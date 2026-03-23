# @owf/eudi-jades

[![npm version](https://img.shields.io/npm/v/@owf/eudi-jades)](https://npmjs.com/package/@owf/eudi-jades)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/openwallet-foundation-labs/identity-common-ts/blob/main/LICENSE)

JAdES (JSON Advanced Electronic Signatures) implementation based on [ETSI TS 119 182-1](https://www.etsi.org/deliver/etsi_ts/119100_119199/11918201/01.02.01_60/ts_11918201v010201p.pdf) standard.

## Features

- **JAdES Baseline Profiles**: B-B, B-T, B-LT, B-LTA
- **Signature Algorithms**: ES256, ES384, ES512, RS256, RS384, RS512, PS256, PS384, PS512
- **Certificate Handling**: x5c, x5u, x5t#S256, x5t#o, sigX5ts
- **Output Formats**: Compact JWS, General JWS JSON, Flattened JWS JSON
- **Detached Signatures**: Support for detached payload signatures

## Installation

```bash
# Using npm
npm install @owf/eudi-jades

# Using pnpm
pnpm add @owf/eudi-jades

# Using yarn
yarn add @owf/eudi-jades
```

## Usage

### Basic Signature (B-B Profile)

```typescript
import { Token, parseCerts } from '@owf/eudi-jades'
import { ES256 } from '@owf/crypto'

// Create payload
const payload = {
  credentialSubject: {
    id: 'did:example:123',
    name: 'John Doe',
  },
}

// Create token
const token = new Token(payload)

// Set protected header with certificate
const certs = parseCerts(pemCertificate)
token
  .setProtectedHeader({ alg: 'ES256' })
  .setX5c(certs)
  .setKid('signer-key-2025')
  .setSignedAt()

// Sign
const signer = await ES256.getSigner(privateKey)
await token.sign(signer)

// Get compact JWS
const compactJws = token.toString()
// eyJhbGciOiJFUzI1NiIsIng1YyI6Wy4uLl0sLi4ufQ.eyJjcmVkZW50aWFsU3ViamVjdCI6ey4uLn19.signature

// Get General JWS JSON
const generalJws = token.toJSON()
// { payload: "...", signatures: [{ protected: "...", signature: "..." }] }
```

### Signature with Timestamp (B-T Profile)

```typescript
import { Token, parseCerts } from '@owf/eudi-jades'

const token = new Token(payload)
const certs = parseCerts(pemCertificate)

token
  .setProtectedHeader({ alg: 'ES256' })
  .setX5c(certs)
  .setSigningTime() // ISO 8601 timestamp

// Add timestamp token in unprotected header
token.setUnprotectedHeader({
  etsiU: [
    {
      sigTst: {
        tstTokens: [{ val: 'Base64-encoded-RFC-3161-timestamp' }],
      },
    },
  ],
})

await token.sign(signer)
```

### Verification

```typescript
import { verify, verifyCompact, decode } from '@owf/eudi-jades'
import { ES256 } from '@owf/crypto'

// Verify compact JWS
const verifier = await ES256.getVerifier(publicKey)
const result = await verifyCompact(compactJws, verifier)

console.log(result.valid) // true
console.log(result.payload) // decoded payload
console.log(result.header) // decoded protected header

// Auto-detect format and verify
const result2 = await verify(jwsStringOrObject, verifier)

// Decode without verification (for inspection only)
const decoded = decode(compactJws)
```

### Utility Functions

```typescript
import {
  parseCerts,
  generateX5c,
  generateX5tS256,
  generateX5tO,
  generateKid,
  getSigningTime,
} from '@owf/eudi-jades'

// Parse PEM certificate chain
const certs = parseCerts(pemString)

// Generate x5c header value
const x5c = generateX5c(pemString)

// Generate SHA-256 thumbprint
const thumbprint = await generateX5tS256(certDer)

// Generate thumbprint with other algorithm
const x5tO = await generateX5tO(certDer, 'SHA-512')

// Generate key ID from certificate
const kid = await generateKid(certDer)

// Get current signing time
const sigT = getSigningTime() // "2025-03-23T14:30:00Z"
```

## JAdES Profiles

| Profile | Description | Headers Required |
|---------|-------------|------------------|
| **B-B** | Basic signature | alg, x5c or x5t#S256 |
| **B-T** | With timestamp | B-B + sigTst in etsiU |
| **B-LT** | Long-term validation | B-T + xVals, rVals |
| **B-LTA** | Archive timestamps | B-LT + arcTst |

## Platform Support

This library is **platform agnostic** and works in:

- ✅ Node.js (>=20)
- ✅ Browsers (modern browsers with ES2020 support)
- ✅ React Native

## References

- [ETSI TS 119 182-1 - JAdES Baseline Signatures](https://www.etsi.org/deliver/etsi_ts/119100_119199/11918201/01.02.01_60/ts_11918201v010201p.pdf)
- [RFC 7515 - JSON Web Signature (JWS)](https://datatracker.ietf.org/doc/html/rfc7515)
- [RFC 7797 - JSON Web Signature Unencoded Payload Option](https://datatracker.ietf.org/doc/html/rfc7797)

## API Reference

### Classes

- `Token<T>` - Main class for creating JAdES signatures

### Functions

- `verify(jws, verifier)` - Verify JWS (auto-detect format)
- `verifyCompact(jws, verifier)` - Verify compact JWS
- `verifyGeneral(jws, verifier)` - Verify General JWS JSON
- `decode(jws)` - Decode without verification

### Utilities

- `parseCerts(pem)` - Parse PEM certificates
- `generateX5c(certs)` - Generate x5c header
- `generateX5tS256(cert)` - Generate SHA-256 thumbprint
- `generateX5tO(cert, alg)` - Generate thumbprint with algorithm
- `generateKid(cert)` - Generate key ID
- `getSigningTime()` - Get current ISO timestamp

## Contributing

See the [Contributing Guide](https://github.com/openwallet-foundation-labs/identity-common-ts/blob/main/CONTRIBUTING.md) for details on how to contribute to this project.

## License

This project is licensed under the [Apache License Version 2.0](https://github.com/openwallet-foundation-labs/identity-common-ts/blob/main/LICENSE) (Apache-2.0).
