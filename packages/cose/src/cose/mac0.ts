import { z } from 'zod'
import {
  type AnyCborStructure,
  addExtension,
  CborStructure,
  type CborStructureStaticThis,
  cborDecode,
  cborEncode,
  type EncodedStructureType,
} from '../cbor/index.js'

import { zUint8Array } from '../utils/zod.js'
import { CoseInvalidAlgorithmError, CosePayloadMustBeDefinedError } from './error.js'
import { Header, type MacAlgorithm } from './headers/defaults.js'
import {
  type ProtectedHeaderOptions,
  ProtectedHeaders,
  type ProtectedHeadersEncodedStructure,
} from './headers/protected-headers.js'
import {
  type UnprotectedHeaderOptions,
  UnprotectedHeaders,
  type UnprotectedHeadersStructure,
} from './headers/unprotected-headers.js'
import { coseKeyToJwk } from './key/jwk.js'
import type { CoseKey } from './key/key.js'

const mac0EncodedSchema = z.tuple([zUint8Array, z.map(z.unknown(), z.unknown()), zUint8Array.nullable(), zUint8Array])

const mac0DecodedSchema = z.object({
  protectedHeaders: z.instanceof(ProtectedHeaders),
  unprotectedHeaders: z.instanceof(UnprotectedHeaders),
  payload: zUint8Array.nullable(),
  tag: zUint8Array,
})

export type Mac0EncodedStructure = z.infer<typeof mac0EncodedSchema>
export type Mac0DecodedStructure = z.infer<typeof mac0DecodedSchema>

export type Mac0Context = {
  createEphemeralKey: (options: {
    privateKey: Uint8Array
    ephemeralPublicKey: Uint8Array
    info: Uint8Array
  }) => Promise<Uint8Array>
  mac: (options: { toBeAuthenticated: Uint8Array; key: Uint8Array }) => Promise<Uint8Array>
}

export type Mac0Options = {
  protectedHeaders: ProtectedHeaders | ProtectedHeaderOptions['protectedHeaders']
  unprotectedHeaders: UnprotectedHeaders | UnprotectedHeaderOptions['unprotectedHeaders']
  externalAad?: Uint8Array

  payload?: Uint8Array | null
  detachedPayload?: Uint8Array

  privateKey: CoseKey
  ephemeralKey: CoseKey
  info: Uint8Array
}

export class Mac0 extends CborStructure<Mac0EncodedStructure, Mac0DecodedStructure> {
  public static tag = 17

  public static override get encodingSchema() {
    return z.codec(mac0EncodedSchema, mac0DecodedSchema, {
      decode: ([protectedHeadersBytes, unprotectedHeadersMap, payload, tag]) => ({
        protectedHeaders: ProtectedHeaders.fromEncodedStructure(
          protectedHeadersBytes as ProtectedHeadersEncodedStructure
        ),
        unprotectedHeaders: UnprotectedHeaders.fromEncodedStructure(
          unprotectedHeadersMap as UnprotectedHeadersStructure
        ),
        payload,
        tag,
      }),
      encode: ({ protectedHeaders, unprotectedHeaders, payload, tag }) =>
        [
          protectedHeaders.encodedStructure,
          unprotectedHeaders.encodedStructure,
          payload,
          tag,
        ] satisfies Mac0EncodedStructure,
    })
  }

  public externalAad?: Uint8Array
  public detachedPayload?: Uint8Array

  public get protectedHeaders() {
    return this.structure.protectedHeaders
  }

  public get unprotectedHeaders() {
    return this.structure.unprotectedHeaders
  }

  public get payload() {
    return this.structure.payload
  }

  public get tag() {
    return this.structure.tag
  }

  public get toBeAuthenticated() {
    const payload = this.payload ?? this.detachedPayload

    if (!payload) {
      throw new CosePayloadMustBeDefinedError()
    }

    return Mac0.toBeAuthenticated({
      payload,
      protectedHeaders: this.protectedHeaders,
      externalAad: this.externalAad,
    })
  }

  /**
   * Decodes CBOR bytes into a Sign1 instance.
   * Uses the encodingSchema's decode() method to validate and transform the decoded data.
   */
  public static decode<T extends AnyCborStructure>(this: CborStructureStaticThis<T>, bytes: Uint8Array): T {
    const rawStructure = cborDecode(bytes)

    // May feel weird, but using new this makes TypeScript understand we may return a subclass
    return new Mac0(
      // NOTE: If decoded with Mac0 tag, the cbor decoder already transforms to the class instances
      // In that case we create new instance based on the decoded structure, to ensure we create the
      // instance based on this (and ensure extended classes work)
      rawStructure instanceof Mac0
        ? rawStructure.decodedStructure
        : Mac0.fromEncodedStructure(rawStructure as EncodedStructureType<T>).decodedStructure
    ) as unknown as T
  }

  public static toBeAuthenticated(options: {
    payload: Uint8Array
    protectedHeaders: ProtectedHeaders
    externalAad?: Uint8Array
  }) {
    const toBeAuthenticated = ['MAC0', options.protectedHeaders.encodedStructure]
    if (options.externalAad) toBeAuthenticated.push(options.externalAad)
    toBeAuthenticated.push(options.payload)

    return cborEncode(toBeAuthenticated)
  }

  public get signatureAlgorithmName(): MacAlgorithm {
    const algorithm = (this.protectedHeaders.headers?.get(Header.Algorithm) ??
      this.unprotectedHeaders.headers?.get(Header.Algorithm)) as MacAlgorithm | undefined

    if (!algorithm) {
      throw new CoseInvalidAlgorithmError()
    }

    const algorithmName = coseKeyToJwk.algorithm(algorithm)

    if (!algorithmName) {
      throw new CoseInvalidAlgorithmError()
    }

    return algorithmName
  }

  public static async create(options: Mac0Options, ctx: Mac0Context): Promise<Mac0> {
    const protectedHeaders =
      options.protectedHeaders instanceof ProtectedHeaders
        ? options.protectedHeaders
        : ProtectedHeaders.create({ protectedHeaders: options.protectedHeaders })

    const unprotectedHeaders =
      options.unprotectedHeaders instanceof UnprotectedHeaders
        ? options.unprotectedHeaders
        : UnprotectedHeaders.create({ unprotectedHeaders: options.unprotectedHeaders })

    const ephemeralMacKey = await ctx.createEphemeralKey({
      privateKey: options.privateKey.encode(),
      ephemeralPublicKey: options.ephemeralKey.encode(),
      info: options.info,
    })

    const payload = options.payload ?? options.detachedPayload
    if (!payload) {
      throw new CosePayloadMustBeDefinedError()
    }

    const tag = await ctx.mac({
      toBeAuthenticated: Mac0.toBeAuthenticated({
        payload,
        protectedHeaders: protectedHeaders,
        externalAad: options.externalAad,
      }),
      key: ephemeralMacKey,
    })

    const mac0 = Mac0.fromDecodedStructure({
      protectedHeaders,
      unprotectedHeaders,
      payload: options.payload ?? null,
      tag,
    })

    mac0.externalAad = options.externalAad
    mac0.detachedPayload = options.detachedPayload

    return mac0
  }
}

addExtension({
  Class: Mac0,
  tag: Mac0.tag,
  encode(instance: Mac0, encodeFn: (obj: unknown) => Uint8Array) {
    return encodeFn(instance.encodedStructure)
  },
  decode: (encoded) => Mac0.fromEncodedStructure(encoded as Mac0EncodedStructure),
})
