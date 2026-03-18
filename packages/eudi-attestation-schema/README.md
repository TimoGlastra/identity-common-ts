# @owf/eudi-attestation-schema

> **⚠️ Experimental:** This package is experimental. The underlying ETSI specification is not yet finalized, and this implementation is used to test the upcoming approach. Breaking changes are possible until the specification is stable.

SDK for creating, signing, and validating attestation schema metadata (SchemaMeta) per the **EUDI TS11 Catalogue of Attestations** specification.

## Overview

This SDK implements the TS11 data model for the EUDI Catalogue of Attestations, enabling:

- **Create SchemaMeta objects** using a fluent builder API
- **Validate SchemaMeta documents** against the TS11 schema
- **Sign SchemaMeta as JWS** with private keys or custom signers (HSM/KMS)

## Specification Reference

- [TS11 — Interfaces and formats for catalogue of attributes and catalogue of attestations](https://github.com/eu-digital-identity-wallet/eudi-doc-standards-and-technical-specifications/blob/main/docs/technical-specifications/ts11-interfaces-and-formats-for-catalogue-of-attributes-and-catalogue-of-schemes.md)

## Installation

```bash
npm install @owf/eudi-attestation-schema
# or
pnpm add @owf/eudi-attestation-schema
```

## Usage

### Creating a SchemaMeta Object

```typescript
import {
  schemaMeta,
  schemaURI,
  trustAuthority,
} from '@owf/eudi-attestation-schema';

const meta = schemaMeta()
  .id('https://gym.example.com/attestations/gym-membership-card')
  .version('1.0.0')
  .rulebookURI('https://example.com/rulebooks/gym-membership/1.0.0.md')
  .rulebookIntegrity('sha256-cJe/IG7DijmXd2FpecyWJVnZ9EuKKprly5auxGm1uIw=')
  .addTrustAuthority(
    trustAuthority()
      .frameworkType('etsi_tl')
      .value('https://example.com/trust-lists/gym-members.jws')
      .isLoTE(true)
      .build()
  )
  .attestationLoS('iso_18045_basic')
  .bindingType('key')
  .addFormat('dc+sd-jwt')
  .addSchemaURI(
    schemaURI()
      .format('dc+sd-jwt')
      .uri('https://example.com/schemas/gym-membership.dc+sd-jwt.json')
      .integrity('sha256-M8H+reBt9Nr/s8CRicJrthAnk7UdWyTyONW0N8Z/Axw=')
      .build()
  )
  .build();
```

### Validating a SchemaMeta Document

```typescript
import {
  validateSchemaMeta,
  assertValidSchemaMeta,
} from '@owf/eudi-attestation-schema';

// Returns { valid: boolean, errors: ValidationError[] }
const result = validateSchemaMeta(untrustedData);
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}

// Or use the assertion form (throws SchemaMetaException on invalid input)
assertValidSchemaMeta(untrustedData);
// untrustedData is now typed as SchemaMeta
```

### Signing a SchemaMeta as JWS

```typescript
import { ES256 } from '@owf/crypto';
import { signSchemaMeta, schemaMeta, schemaURI } from '@owf/eudi-attestation-schema';

const { privateKey } = await ES256.generateKeyPair();
const signer = await ES256.getSigner(privateKey);

const meta = schemaMeta()
  .version('1.0.0')
  .rulebookURI('https://example.com/rulebook.md')
  .attestationLoS('iso_18045_basic')
  .bindingType('key')
  .addFormat('dc+sd-jwt')
  .addSchemaURI(
    schemaURI()
      .format('dc+sd-jwt')
      .uri('https://example.com/schema.json')
      .build()
  )
  .build();

const signed = await signSchemaMeta({
  schemaMeta: meta,
  keyId: 'catalog-signer-2025',
  certificates: [pemCertificate],
  signer,
});

console.log(signed.jws); // Compact JWS string
console.log(signed.iat); // Issued-at timestamp (epoch seconds)
```

### Verifying a Signed SchemaMeta

```typescript
import { ES256 } from '@owf/crypto';
import { verifySchemaMeta } from '@owf/eudi-attestation-schema';

const verifier = await ES256.getVerifier(publicKey);

const { header, payload, iat } = await verifySchemaMeta({
  jws: signed.jws,
  verifier,
});

console.log(payload.version); // '1.0.0'
console.log(header.kid);      // 'catalog-signer-2025'
```

## Data Model

### SchemaMeta (Main Class)

| Field | Required | Type | Description |
|---|---|---|---|
| `id` | No | `string` | Unique identifier for the attestation schema |
| `version` | Yes | `string` | Schema version (SemVer) |
| `rulebookURI` | Yes | `string` (URL) | URI of the Attestation Rulebook |
| `rulebookIntegrity` | No | `string` | W3C SRI integrity metadata for the rulebook |
| `trustedAuthorities` | No | `TrustAuthority[]` | Trust anchors for attestation issuers |
| `attestationLoS` | Yes | `AttestationLoS` | Level of security |
| `bindingType` | Yes | `BindingType` | Cryptographic binding type |
| `supportedFormats` | Yes | `AttestationFormat[]` | Supported attestation formats |
| `schemaURIs` | Yes | `SchemaURI[]` | Schema URIs per format |

### Enumerations

**AttestationFormat**: `dc+sd-jwt`, `mso_mdoc`, `jwt_vc_json`, `jwt_vc_json-ld`, `ldp_vc`

**AttestationLoS**: `iso_18045_high`, `iso_18045_moderate`, `iso_18045_enhanced-basic`, `iso_18045_basic`

**BindingType**: `claim`, `key`, `biometric`, `none`

**FrameworkType**: `aki`, `etsi_tl`, `openid_federation`

## License

Apache-2.0
