# @owf/trust-list-sdk

SDK for creating, signing, and managing trust lists in LoTE (List of Trusted Entities) format per **ETSI TS 119 602**.

## Overview

This SDK implements the ETSI TS 119 602 standard for trust lists, enabling:

- **Create and manage trust lists** with trusted entities and their services
- **Sign trust lists** with private keys or custom signers (HSM/KMS)
- **Verify trust list signatures** using public keys, JWKs, or embedded certificates
- **Validate trust lists** against ETSI TS 119 602 schema
- **Publish trust lists** to registrar backends

## Specification Reference

- [ETSI TS 119 602](https://www.etsi.org/deliver/etsi_ts/119600_119699/119602/01.01.01_60/ts_119602v010101p.pdf) - Trusted Lists

## Installation

```bash
npm install @owf/trust-list-sdk
# or
pnpm add @owf/trust-list-sdk
```

## Usage

### Creating a Trust List

```typescript
import {
  createTrustList,
  trustedEntity,
  service,
  addTrustedEntity,
} from '@owf/trust-list-sdk';

// Create the base trust list (only SchemeOperatorName is required)
let trustList = createTrustList({
  SchemeOperatorName: [{ lang: 'en', value: 'Example Trust Operator' }],
  SchemeOperatorAddress: {
    SchemeOperatorPostalAddress: [
      {
        lang: 'en',
        StreetAddress: 'Main Street 1',
        Locality: 'Berlin',
        PostalCode: '10115',
        Country: 'DE',
      },
    ],
    SchemeOperatorElectronicAddress: [
      { lang: 'en', uriValue: 'mailto:trust@example.org' },
    ],
  },
  SchemeName: [{ lang: 'en', value: 'Gym Membership Issuers' }],
  SchemeTerritory: 'DE',
});

// Build a trusted entity using the fluent builder
const gymEntity = trustedEntity()
  .name('Mighty Fitness Center GmbH')
  .tradeName('Mighty Fitness')
  .postalAddress({
    StreetAddress: 'Gym Street 5',
    Locality: 'Fitville',
    PostalCode: '54321',
    Country: 'DE',
  })
  .email('contact@gym.example.com')
  .website('https://gym.example.com')
  .infoUri('https://gym.example.com/about')
  .addService(
    service()
      .name('Gym Membership Attestation Issuance')
      .type('https://example.org/service-type/gym-attestation-issuer')
      .status('https://example.org/status/granted')
      .addPublicKey({
        kty: 'EC',
        crv: 'P-256',
        x: '...',
        y: '...',
        kid: 'gym-issuer-key-1',
        use: 'sig',
        alg: 'ES256',
      })
      .addEndpoint(
        'https://example.org/service-type/gym-attestation-issuer',
        'https://issuer.gym.example.com',
      )
      .build(),
  )
  .build();

// Add the entity to the trust list
trustList = addTrustedEntity(trustList, gymEntity);
```

### Service with Multiple Identity Types

The SDK supports all digital identity types from ETSI TS 119 602:

```typescript
const svc = service()
  .name('Multi-Identity Service')
  .type('https://example.org/service-type/issuer')
  .status('https://example.org/status/granted')
  // X.509 certificates
  .addCertificate('MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...')
  // X.509 subject names
  .addX509SubjectName('CN=Test CA, O=Test Org, C=DE')
  // X.509 Subject Key Identifiers
  .addX509SKI('base64encodedSKI==')
  // JWK public keys
  .addPublicKey({ kty: 'EC', crv: 'P-256', x: '...', y: '...' })
  // Other identifiers
  .addOtherId('urn:example:custom-id:12345')
  .build();
```

### Service History

Track historical changes to services:

```typescript
const svc = service()
  .name('Current Service Name')
  .addPublicKey({ kty: 'EC', crv: 'P-256', x: '...', y: '...' })
  .addHistoryEntry({
    ServiceName: [{ lang: 'en', value: 'Previous Service Name' }],
    ServiceDigitalIdentity: { PublicKeyValues: [{ kty: 'EC', crv: 'P-256' }] },
    ServiceStatus: 'https://example.org/status/revoked',
    StatusStartingTime: '2023-01-01T00:00:00.000Z',
  })
  .build();
```

### Pointers to Other LoTE Lists

Reference other trust lists:

```typescript
const trustList = createTrustList({
  SchemeOperatorName: [{ lang: 'en', value: 'Master Registry' }],
  PointersToOtherLoTE: [
    {
      LoTELocation: 'https://other-registry.example.com/lote',
      ServiceDigitalIdentities: [
        { PublicKeyValues: [{ kty: 'EC', crv: 'P-256', x: '...', y: '...' }] },
      ],
      LoTEQualifiers: [
        {
          LoTEType: 'https://example.org/lote-type/regional',
          SchemeOperatorName: [{ lang: 'en', value: 'Regional Operator' }],
          MimeType: 'application/jwt',
        },
      ],
    },
  ],
});
```

### Signing a Trust List

```typescript
import { signTrustList } from '@owf/trust-list-sdk';

// With private key
const signed = await signTrustList({
  trustList,
  privateKey: '-----BEGIN EC PRIVATE KEY-----...',
  keyId: 'trust-list-signer-2025',
});

console.log(signed.jws); // The signed JWS
```

### Using a Custom Signer (HSM/KMS)

```typescript
const signed = await signTrustList({
  trustList,
  keyId: 'trust-list-signer-2025',
  signer: async (data) => {
    // Send to your KMS/HSM
    return await myKmsService.sign('ES256', data);
  },
});
```

### Verifying a Trust List

```typescript
import {
  verifyTrustList,
  verifyTrustListWithJWK,
  decodeTrustList,
} from '@owf/trust-list-sdk';

// Quick decode without verification
const decoded = decodeTrustList(jws);
console.log(decoded.payload.LoTE.ListAndSchemeInformation.SchemeName);

// Verify with PEM public key
const result = await verifyTrustList(jws, publicKeyPem);
if (result.valid) {
  console.log('Valid trust list');
}

// Verify with JWK
const result2 = await verifyTrustListWithJWK(jws, publicKeyJwk);
```

### Validating a Trust List

```typescript
import {
  validateTrustList,
  assertValidTrustList,
} from '@owf/trust-list-sdk';

// Get validation result with error details
const result = validateTrustList(trustList);
if (!result.valid) {
  console.log('Validation errors:', result.errors);
}

// Or throw on invalid
assertValidTrustList(trustList); // throws ValidationError if invalid
```

### Publishing to a Registrar

```typescript
import { publishTrustList } from '@owf/trust-list-sdk';

const result = await publishTrustList({
  jws: signed.jws,
  registrarUrl: 'https://registrar.example.com',
  authToken: 'your-bearer-token',
});

if (result.success) {
  console.log('Published with ID:', result.id);
}
```

### Updating a Trust List

```typescript
import {
  updateTrustListVersion,
  addTrustedEntity,
  removeTrustedEntity,
} from '@owf/trust-list-sdk';

// Increment version and update timestamps
let updatedList = updateTrustListVersion(trustList);

// Add new entity
updatedList = addTrustedEntity(updatedList, newEntity);

// Remove an entity by name
updatedList = removeTrustedEntity(updatedList, 'Old Gym Name');
```

## API Reference

### Signing

#### `signTrustList(options): Promise<SignedTrustList>`

Signs a trust list. Provide either `privateKey` or a custom `signer` function.

#### `createTrustList(schemeInfo, entities?): TrustList`

Creates a new trust list with the given scheme information. Only `SchemeOperatorName` is required per ETSI TS 119 602.

#### `updateTrustListVersion(trustList): TrustList`

Increments the sequence number and updates timestamps.

#### `addTrustedEntity(trustList, entity): TrustList`

Adds a trusted entity to the list.

#### `removeTrustedEntity(trustList, entityName): TrustList`

Removes an entity by name.

### Verification

#### `decodeTrustList(jws): { header, payload }`

Decodes a JWS without verification.

#### `verifyTrustList(jws, publicKeyPem): Promise<VerificationResult>`

Verifies using a PEM public key.

#### `verifyTrustListWithJWK(jws, jwk): Promise<VerificationResult>`

Verifies using a JWK public key.

#### `verifyTrustListWithEmbeddedCert(jws): Promise<VerificationResult>`

Verifies using the embedded x5c certificate.

### Validation

#### `validateTrustList(trustList): ValidationResult`

Validates a trust list against ETSI TS 119 602 schema. Returns validation result with error details.

#### `assertValidTrustList(trustList): asserts trustList is TrustList`

Type assertion that throws `ValidationError` if the trust list is invalid.

### Publishing

#### `publishTrustList(options): Promise<PublishResult>`

Publishes to a registrar backend.

#### `fetchTrustList(url): Promise<string>`

Fetches a trust list from a URL.

#### `trustListExists(registrarUrl, schemeName, territory): Promise<boolean>`

Checks if a trust list exists.

### Builders

#### `trustedEntity(): TrustedEntityBuilder`

Fluent builder for creating trusted entities.

Methods:
- `.name(name, lang?)` - Entity name
- `.tradeName(name, lang?)` - Trade name
- `.registrationId(id, lang?)` - Registration identifier
- `.postalAddress(address, lang?)` - Postal address
- `.email(email, lang?)` - Email address
- `.website(url, lang?)` - Website URL
- `.infoUri(uri, lang?)` - Information URI
- `.addExtension(extension)` - Add an extension
- `.addService(service)` - Add a service
- `.build()` - Build the entity

#### `service(): ServiceBuilder`

Fluent builder for creating services.

Methods:
- `.name(name, lang?)` - Service name
- `.type(typeUri)` - Service type identifier
- `.status(statusUri)` - Service status
- `.statusStartingTime(isoTimestamp)` - When status became effective
- `.addCertificate(base64Cert)` - Add X.509 certificate
- `.addX509SubjectName(subjectName)` - Add X.509 subject name
- `.addX509SKI(base64SKI)` - Add X.509 Subject Key Identifier
- `.addPublicKey(jwk)` - Add JWK public key
- `.addOtherId(identifier)` - Add custom identifier
- `.addEndpoint(type, uri)` - Add service endpoint
- `.addExtension(extension)` - Add service extension
- `.addHistoryEntry(entry)` - Add service history entry
- `.build()` - Build the service

## Types

See [src/types.ts](./src/types.ts) for complete type definitions including:

- `TrustList` - Root trust list structure
- `TrustedEntity` - Entity in the trust list
- `Service` - Service provided by an entity
- `ServiceDigitalIdentity` - Digital identity for a service
- `ServiceHistory` / `ServiceHistoryInstance` - Historical service states
- `PointersToOtherLoTE` / `OtherLoTEPointer` - Cross-list references
- `ValidationResult` / `ValidationError` - Validation types

### SignerFunction

```typescript
type SignerFunction = (data: Uint8Array) => Promise<Uint8Array | string>;
```

## External Key Management

The SDK supports delegating signing to external services:

### Azure Key Vault

```typescript
import { CryptographyClient } from '@azure/keyvault-keys';

const signed = await signTrustList({
  trustList,
  keyId: 'trust-list-signer',
  signer: async (data) => {
    const result = await cryptoClient.sign('ES256', data);
    return result.result;
  },
});
```

### AWS KMS

```typescript
import { KMSClient, SignCommand } from '@aws-sdk/client-kms';

const signed = await signTrustList({
  trustList,
  keyId: 'trust-list-signer',
  signer: async (data) => {
    const response = await kmsClient.send(
      new SignCommand({
        KeyId: 'alias/trust-list-signer',
        Message: data,
        MessageType: 'RAW',
        SigningAlgorithm: 'ECDSA_SHA_256',
      }),
    );
    return new Uint8Array(response.Signature!);
  },
});
```

## Security Considerations

- **Protect signing keys** - Use HSM or KMS for production
- **Validate trust anchors** - Verify the signer's certificate chain
- **Check sequence numbers** - Ensure you have the latest version
- **Use HTTPS** - Always use HTTPS for distribution points
- **Validate before signing** - Use `assertValidTrustList` before signing

## License

Apache-2.0
