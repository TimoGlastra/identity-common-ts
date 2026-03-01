---
'@owf/identity-common': minor
'@owf/identity-common-integrity': minor
'@owf/identity-common-hash': minor
'@owf/identity-common-crypto-browser': minor
'@owf/identity-common-crypto-node': minor
'@owf/identity-common-status-list': minor
'@owf/identity-common-status-list-jwt': minor
'@owf/identity-common-status-list-cwt': minor
---

Migrate reusable packages from sd-jwt-js

- **@owf/identity-common**: Add shared types (JwtPayload, Signer, Verifier, Hasher, etc.), base64url utilities, and JWT decoding
- **@owf/identity-common-integrity**: Add W3C Subresource Integrity calculation, parsing, and validation
- **@owf/identity-common-hash**: Add SHA-256/384/512 hash functions using @noble/hashes
- **@owf/identity-common-crypto-browser**: Add Web Crypto API wrappers (ES256/384/512 key generation, signing, verification)
- **@owf/identity-common-crypto-node**: Add node:crypto wrappers (ES256/384/512 key generation, signing, verification)
- **@owf/identity-common-status-list**: Add core StatusList class with bitstring compression/decompression (1/2/4/8-bit)
- **@owf/identity-common-status-list-jwt**: Add JWT transport layer for Token Status Lists (draft-ietf-oauth-status-list)
- **@owf/identity-common-status-list-cwt**: Add CWT/CBOR transport layer for Token Status Lists (draft-ietf-oauth-status-list)
