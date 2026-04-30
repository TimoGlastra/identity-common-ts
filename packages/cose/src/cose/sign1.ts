import z from 'zod'
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
import { CoseCertificateNotFoundError, CoseInvalidAlgorithmError, CosePayloadMustBeDefinedError } from './error.js'
import { Header, type SignatureAlgorithm } from './headers/defaults.js'
import {
  type ProtectedHeaderOptions,
  ProtectedHeaders,
  protectedHeadersEncodedStructure,
} from './headers/protected-headers.js'
import {
  type UnprotectedHeaderOptions,
  UnprotectedHeaders,
  unprotectedHeadersStructure,
} from './headers/unprotected-headers.js'
import { coseKeyToJwk } from './key/jwk.js'
import type { CoseKey } from './key/key.js'

const sign1EncodedSchema = z.tuple([
  // protected headers
  protectedHeadersEncodedStructure,
  // unprotected headers
  unprotectedHeadersStructure,
  // payload
  zUint8Array.nullable(),
  // signature
  zUint8Array,
])

const sign1DecodedSchema = z.object({
  protected: z.instanceof(ProtectedHeaders),
  unprotected: z.instanceof(UnprotectedHeaders),
  payload: sign1EncodedSchema.def.items[2],
  signature: sign1EncodedSchema.def.items[3],
})

export type Sign1EncodedStructure = z.infer<typeof sign1EncodedSchema>
export type Sign1DecodedStructure = z.infer<typeof sign1DecodedSchema>

export type Sign1Context = {
  sign: (options: { toBeSigned: Uint8Array; key: CoseKey; algorithm: SignatureAlgorithm }) => Promise<Uint8Array>
  getPublicKey: (options: { certificate: Uint8Array | Uint8Array[]; alg: string }) => Promise<Uint8Array>
  verify: (options: { sign1: Sign1; key: Uint8Array | CoseKey }) => Promise<boolean>
  x509: {
    getIssuerNameField: (options: { certificate: Uint8Array | Uint8Array[]; field: string }) => string[]
    getPublicKey: (options: { certificate: Uint8Array | Uint8Array[]; alg: string }) => Promise<Uint8Array>
  }
}

export type Sign1Options = {
  protectedHeaders?: ProtectedHeaders | ProtectedHeaderOptions['protectedHeaders']
  unprotectedHeaders?: UnprotectedHeaders | UnprotectedHeaderOptions['unprotectedHeaders']
  signingKey: CoseKey
  algorithm?: SignatureAlgorithm

  payload?: Uint8Array | null
  detachedPayload?: Uint8Array

  externalAad?: Uint8Array
}

export class Sign1 extends CborStructure<Sign1EncodedStructure, Sign1DecodedStructure> {
  public static tag = 18

  public static override get encodingSchema() {
    return z.codec(sign1EncodedSchema, sign1DecodedSchema, {
      encode: (decoded) =>
        [
          decoded.protected.encodedStructure,
          decoded.unprotected.encodedStructure,
          decoded.payload,
          decoded.signature,
        ] satisfies Sign1EncodedStructure,
      decode: ([protectedHeaders, unprotected, payload, signature]) => ({
        protected: ProtectedHeaders.fromEncodedStructure(protectedHeaders),
        unprotected: UnprotectedHeaders.fromEncodedStructure(unprotected),
        payload,
        signature,
      }),
    })
  }

  public detachedPayload?: Uint8Array
  public externalAad?: Uint8Array

  public get protectedHeaders() {
    return this.structure.protected
  }

  public get unprotectedHeaders() {
    return this.structure.unprotected
  }

  public get payload() {
    return this.structure.payload
  }

  public get signature() {
    return this.structure.signature
  }

  public get certificateChain() {
    return this.x5chain ?? []
  }

  public get certificate() {
    const [certificate] = this.certificateChain

    if (!certificate) {
      throw new CoseCertificateNotFoundError()
    }

    return certificate
  }

  public getIssuingCountry(ctx: Pick<Sign1Context, 'x509'>) {
    const countryName = ctx.x509.getIssuerNameField({
      certificate: this.certificate,
      field: 'C',
    })[0]

    return countryName
  }

  public getIssuingStateOrProvince(ctx: Pick<Sign1Context, 'x509'>) {
    const stateOrProvince = ctx.x509.getIssuerNameField({
      certificate: this.certificate,
      field: 'ST',
    })[0]

    return stateOrProvince
  }

  public get toBeSigned() {
    const payload = this.payload ?? this.detachedPayload

    if (!payload) {
      throw new CosePayloadMustBeDefinedError()
    }

    return Sign1.toBeSigned({
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
    return new Sign1(
      // NOTE: If decoded with Sign1 tag, the cbor decoder already transforms to the class instances
      // In that case we create new instance based on the decoded structure, to ensure we create the
      // instance based on this (and ensure extended classes work)
      rawStructure instanceof Sign1
        ? rawStructure.decodedStructure
        : Sign1.fromEncodedStructure(rawStructure as EncodedStructureType<T>).decodedStructure
    ) as unknown as T
  }

  public static toBeSigned(options: {
    payload: Uint8Array
    protectedHeaders: ProtectedHeaders
    externalAad?: Uint8Array
  }) {
    const toBeSigned = [
      'Signature1',
      options.protectedHeaders.encodedStructure,
      options.externalAad ?? new Uint8Array(),
      options.payload,
    ]

    return cborEncode(toBeSigned)
  }

  public get signatureAlgorithmName(): string {
    // FIXME: why are we looking at the unprotected header for the alg?
    const algorithm = (this.protectedHeaders.headers?.get(Header.Algorithm) ??
      this.unprotectedHeaders.headers?.get(Header.Algorithm)) as SignatureAlgorithm | undefined

    if (!algorithm) {
      throw new CoseInvalidAlgorithmError()
    }

    const algorithmName = coseKeyToJwk.algorithm(algorithm)
    if (!algorithmName) {
      throw new CoseInvalidAlgorithmError()
    }

    return algorithmName
  }

  public get x5chain() {
    // TODO: typed keys for headers
    // FIXME: why are we looking at unprotected header for x5c?
    const x5chain =
      (this.protectedHeaders.headers?.get(Header.X5Chain) as Uint8Array | Uint8Array[] | undefined) ??
      (this.unprotectedHeaders.headers?.get(Header.X5Chain) as Uint8Array | Uint8Array[] | undefined)

    if (!x5chain?.[0]) {
      return undefined
    }

    return Array.isArray(x5chain) ? x5chain : [x5chain]
  }

  public async verifySignature(options: { key?: CoseKey }, ctx: Pick<Sign1Context, 'getPublicKey' | 'verify'>) {
    const publicKey =
      options.key ??
      (this.certificate
        ? await ctx.getPublicKey({
            certificate: this.certificate,
            alg: this.signatureAlgorithmName,
          })
        : undefined)

    if (!publicKey) {
      throw new CoseCertificateNotFoundError()
    }

    return await ctx.verify({
      sign1: this,
      key: publicKey,
    })
  }

  public static async create(options: Sign1Options, ctx: Pick<Sign1Context, 'sign'>) {
    const payload = options.payload ?? options.detachedPayload
    if (!payload) {
      throw new CosePayloadMustBeDefinedError()
    }

    const protectedHeaders =
      options.protectedHeaders instanceof ProtectedHeaders
        ? options.protectedHeaders
        : options.protectedHeaders
          ? ProtectedHeaders.fromDecodedStructure(options.protectedHeaders)
          : ProtectedHeaders.create({})

    const signatureAlgorithm = options.algorithm ?? options.signingKey.algorithm

    if (!signatureAlgorithm) {
      throw new CoseInvalidAlgorithmError(
        'Could not establish signature algorithm. Either provide it in the options directly, or provide it in the signingKey'
      )
    }

    const signature = await ctx.sign({
      toBeSigned: Sign1.toBeSigned({
        payload,
        protectedHeaders,
        externalAad: options.externalAad,
      }),
      key: options.signingKey,
      algorithm: signatureAlgorithm,
    })

    const sign1 = Sign1.fromDecodedStructure({
      payload: options.payload ?? null,
      protected: protectedHeaders,
      unprotected:
        options.unprotectedHeaders instanceof UnprotectedHeaders
          ? options.unprotectedHeaders
          : options.unprotectedHeaders
            ? UnprotectedHeaders.fromEncodedStructure(options.unprotectedHeaders)
            : UnprotectedHeaders.create({}),
      signature,
    })

    sign1.detachedPayload = options.detachedPayload
    sign1.externalAad = options.externalAad

    return sign1
  }
}

addExtension({
  Class: Sign1,
  tag: Sign1.tag,
  encode(instance: Sign1, encodeFn: (obj: unknown) => Uint8Array) {
    return encodeFn(instance)
  },
  decode: (encoded) => Sign1.fromEncodedStructure(encoded as Sign1EncodedStructure),
})
