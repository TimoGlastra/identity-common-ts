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
import { Token } from '@owf/eudi-jades'
import { ES256, parseCertificateChain } from '@owf/crypto'

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
const certs = parseCertificateChain(pemCertificate)
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
import { Token } from '@owf/eudi-jades'
import { parseCertificateChain } from '@owf/crypto'

const token = new Token(payload)
const certs = parseCertificateChain(pemCertificate)

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
  generateX5c,
  generateX5tS256,
  generateX5tO,
  getSigningTime,
} from '@owf/eudi-jades'
import { parseCertificateChain } from '@owf/crypto'

// Parse PEM certificate chain
const certs = parseCertificateChain(pemString)

// Generate x5c header value
const x5c = generateX5c(pemString)

// Generate SHA-256 thumbprint
const thumbprint = generateX5tS256(certDer)

// Generate thumbprint with other algorithm
const x5tO = generateX5tO(certDer, 'SHA-512')

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

### Profile Validation

```typescript
import { validateProfile, detectProfiles, JAdESProfile, decode } from '@owf/eudi-jades'

const { header, unprotectedHeader } = decode(jws)

// Validate against a specific profile
const result = validateProfile(header, JAdESProfile.B_T, unprotectedHeader)
if (!result.valid) {
  console.log('Missing requirements:', result.missing)
}

// Detect all satisfied profiles
const profiles = detectProfiles(header, unprotectedHeader)
// e.g., [JAdESProfile.B_T, JAdESProfile.B_B]
```

## Integration with SD-JWT-VC

This package is designed to work alongside existing JWT/JWS verification pipelines. It validates JAdES-specific requirements **without performing cryptographic verification**, allowing you to layer JAdES compliance on top of your existing verification logic.

### Usage with @sd-jwt/sd-jwt-vc

```typescript
import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc'
import { 
  decode, 
  validateProfile, 
  detectProfiles, 
  JAdESProfile,
  type ProtectedHeaderParams 
} from '@owf/eudi-jades'

/**
 * Verify an SD-JWT-VC with JAdES compliance validation.
 * 
 * Responsibilities:
 * - SD-JWT-VC: signature verification, disclosure handling, holder binding
 * - eudi-jades: JAdES header validation, profile compliance
 * - Status list: credential revocation (handled separately)
 */
async function verifyJAdESCompliantCredential(
  credential: string,
  requiredProfile: JAdESProfile = JAdESProfile.B_B
) {
  // 1. Extract JWT part from SD-JWT (before disclosures)
  const jwtPart = credential.split('~')[0]
  
  // 2. JAdES compliance validation (no crypto - just structure/header checks)
  const decoded = decode(jwtPart)
  
  // Validate against required profile
  const profileResult = validateProfile(
    decoded.header,
    requiredProfile,
    decoded.unprotectedHeader
  )
  
  if (!profileResult.valid) {
    throw new Error(
      `JAdES ${requiredProfile} profile not satisfied. Missing: ${profileResult.missing?.join(', ')}`
    )
  }
  
  // 3. SD-JWT-VC verification (signature, disclosures, holder binding)
  const sdJwtVc = new SDJwtVcInstance({
    hasher: yourHasher,
    verifier: yourVerifier,
    // ... other config
  })
  
  const sdJwtResult = await sdJwtVc.verify(credential, {
    // verification options
  })
  
  // 4. Return combined result
  return {
    ...sdJwtResult,
    jadesProfile: requiredProfile,
    satisfiedProfiles: detectProfiles(decoded.header, decoded.unprotectedHeader),
    signingTime: decoded.header.sigT,
  }
}

// Usage
const result = await verifyJAdESCompliantCredential(
  sdJwtCredential,
  JAdESProfile.B_T  // Require timestamp
)

console.log('Payload:', result.payload)
console.log('JAdES Profile:', result.jadesProfile)
console.log('Signing Time:', result.signingTime)
```

### Extracting JAdES Metadata

```typescript
import { decode, getSigningTime } from '@owf/eudi-jades'

// Decode and inspect JAdES-specific headers
const jwtPart = sdJwtCredential.split('~')[0]
const { header, payload, unprotectedHeader } = decode(jwtPart)

// Access JAdES header parameters
console.log('Algorithm:', header.alg)
console.log('Signing Time:', header.sigT)
console.log('Certificate Chain:', header.x5c)
console.log('Certificate Thumbprint:', header['x5t#S256'])

// Check for timestamp tokens (B-T profile)
if (unprotectedHeader?.etsiU) {
  const sigTst = unprotectedHeader.etsiU.find(e => 'sigTst' in e)
  if (sigTst) {
    console.log('Has signature timestamp')
  }
}
```

### Why Separate Concerns?

| Concern | Package | Responsibility |
|---------|---------|----------------|
| **Signature Crypto** | @sd-jwt/sd-jwt-vc | ECDSA/RSA verification |
| **Selective Disclosure** | @sd-jwt/sd-jwt-vc | Disclosure handling |
| **Holder Binding** | @sd-jwt/sd-jwt-vc | Key binding JWT |
| **JAdES Compliance** | @owf/eudi-jades | Header validation, profile checks |
| **Credential Status** | @owf/token-status-list | Revocation checking |

This separation allows:

- Using your existing verification infrastructure
- Adding JAdES compliance without changing crypto implementation
- Flexible composition based on your requirements

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

- `generateX5c(certs)` - Generate x5c header
- `generateX5tS256(cert)` - Generate SHA-256 thumbprint
- `generateX5tO(cert, alg)` - Generate thumbprint with algorithm
- `getSigningTime()` - Get current ISO timestamp

## Contributing

See the [Contributing Guide](https://github.com/openwallet-foundation-labs/identity-common-ts/blob/main/CONTRIBUTING.md) for details on how to contribute to this project.

## License

This project is licensed under the [Apache License Version 2.0](https://github.com/openwallet-foundation-labs/identity-common-ts/blob/main/LICENSE) (Apache-2.0).
