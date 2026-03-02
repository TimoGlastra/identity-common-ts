# @owf/token-status-list

## 0.1.0

### Minor Changes

- 7ef6497: Migrate reusable packages from sd-jwt-js

  - **@owf/identity-common**: Add shared types (JwtPayload, Signer, Verifier, Hasher, etc.), base64url utilities, and JWT decoding
  - **@owf/crypto**: Add Web Crypto API wrappers (ES256/384/512 key generation, signing, verification) and SHA-256/384/512 hash functions
  - **@owf/token-status-list**: Add core StatusList class with bitstring compression/decompression (1/2/4/8-bit), JWT transport layer, and CWT/CBOR transport layer for Token Status Lists (draft-ietf-oauth-status-list)

### Patch Changes

- Updated dependencies [7ef6497]
  - @owf/identity-common@0.1.0
