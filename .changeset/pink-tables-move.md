---
"@owf/lote": patch
"@owf/crypto": patch
"@owf/identity-common": patch
"@owf/token-status-list": patch
---

add lote package

add package-specific exception classes (`CryptoException`, `LoTEException`, `IdentityCommonException`) extending a shared `IdentityException` base class in `@owf/identity-common`, replacing plain `Error` throws across all packages. Refactor `SLException` to also extend `IdentityException`.
