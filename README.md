<h1 align="center">Identity Common - TypeScript</h1>

<p align="center">
  <a href="https://typescriptlang.org">
    <img src="https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg" alt="TypeScript" />
  </a>
  <a href="https://github.com/openwallet-foundation-labs/identity-common-ts/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" alt="Apache 2.0 License" />
  </a>
</p>

<p align="center">
  <a href="#overview">Overview</a>
  &nbsp;|&nbsp;
  <a href="#packages">Packages</a>
  &nbsp;|&nbsp;
  <a href="#getting-started">Getting Started</a>
  &nbsp;|&nbsp;
  <a href="#supported-environments">Supported Environments</a>
  &nbsp;|&nbsp;
  <a href="#contributing">Contributing</a>
  &nbsp;|&nbsp;
  <a href="#license">License</a>
</p>

---

## Overview

To avoid reinventing the wheel, many identity projects share common needs for data types and utility functions. **Identity Common TypeScript** provides a shared library of TypeScript types and utilities for identity-related projects, promoting consistency and reducing duplication across the ecosystem.

### Goals

- 🪶 **Lightweight**: Minimal dependencies to keep bundle sizes small
- 🌐 **Platform Agnostic**: Works in Node.js, browsers, and React Native
- 🔄 **Reusable**: Common utilities shared across identity solutions
- 🤝 **Interoperable**: Ensures compatibility between different identity projects

### Project Categories

The project is organized into two main categories:

#### Core Identity Utilities

Generic, reusable utilities that can be used across any identity solution:

| Package | Description | Status |
|---------|-------------|--------|
| [`@owf/identity-common`](./packages/identity-common) | Base types, base64url utilities, and JWT decoding | ✅ Available |
| [`@owf/integrity`](./packages/integrity) | W3C Subresource Integrity (SRI) calculation and parsing | ✅ Available |
| [`@owf/hash`](./packages/hash) | SHA-256/384/512 hash functions via `@noble/hashes` | ✅ Available |
| [`@owf/crypto-browser`](./packages/crypto-browser) | Web Crypto API wrappers (signing, hashing, key generation) | ✅ Available |
| [`@owf/crypto-node`](./packages/crypto-node) | Node.js `crypto` wrappers (signing, hashing, key generation) | ✅ Available |
| [`@owf/status-list`](./packages/status-list) | Core status list bitstring handling and compression | ✅ Available |
| [`@owf/status-list-jwt`](./packages/status-list-jwt) | JWT transport layer for status lists | ✅ Available |
| [`@owf/status-list-cwt`](./packages/status-list-cwt) | CWT/CBOR transport layer for status lists | ✅ Available |
| `@owf/jose` | JOSE/JWT implementation with common validation methods | 📋 Planned |
| `@owf/cose` | COSE/CWT implementation with common validation methods | 📋 Planned |
| `@owf/x509` | X.509 certificate parsing, creation, and verification | 📋 Planned |

#### EUDI-Specific Tools

Tools specific to the [European Digital Identity (EUDI) Wallet](https://ec.europa.eu/digital-building-blocks/sites/display/EUDIGITALIDENTITYWALLET) ecosystem:

| Package | Description | Status |
|---------|-------------|--------|
| `@owf/eudi-lote` | ETSI TS 119 602 Lists of Trusted Entities (LoTE) | 📋 Planned |
| `@owf/eudi-certificates` | Registration and access certificate verification | 📋 Planned |
| `@owf/eudi-payment` | ARF TS 12 Electronic Payment SCA extensions | 📋 Planned |

> **Note**: While the EUDI Wallet is built on open standards (OpenID4VC, SD-JWT VC), it requires specific extensions for Trust, Payments, and document signing that are better suited in dedicated packages.

---

## Packages

### @owf/identity-common

[![@owf/identity-common version](https://img.shields.io/npm/v/@owf/identity-common)](https://npmjs.com/package/@owf/identity-common)

Base types (`JwtPayload`, `JsonWebKey`, `Signer`, `Verifier`, `Hasher`), base64url encode/decode, and JWT decoding.

```bash
npm install @owf/identity-common
```

📖 [View package documentation](./packages/identity-common/README.md)

### @owf/integrity

[![@owf/integrity version](https://img.shields.io/npm/v/@owf/integrity)](https://npmjs.com/package/@owf/integrity)

W3C Subresource Integrity (SRI) calculation, parsing, and validation.

```bash
npm install @owf/integrity
```

📖 [View package documentation](./packages/integrity/README.md)

### @owf/hash

[![@owf/hash version](https://img.shields.io/npm/v/@owf/hash)](https://npmjs.com/package/@owf/hash)

SHA-256, SHA-384, and SHA-512 hash functions powered by `@noble/hashes`.

```bash
npm install @owf/hash
```

📖 [View package documentation](./packages/hash/README.md)

### @owf/crypto-browser

[![@owf/crypto-browser version](https://img.shields.io/npm/v/@owf/crypto-browser)](https://npmjs.com/package/@owf/crypto-browser)

Web Crypto API wrappers for signing, hashing, salt generation, and ES256/384/512 key pairs.

```bash
npm install @owf/crypto-browser
```

📖 [View package documentation](./packages/crypto-browser/README.md)

### @owf/crypto-node

[![@owf/crypto-node version](https://img.shields.io/npm/v/@owf/crypto-node)](https://npmjs.com/package/@owf/crypto-node)

Node.js `crypto` module wrappers for signing, hashing, salt generation, and ES256/384/512 key pairs.

```bash
npm install @owf/crypto-node
```

📖 [View package documentation](./packages/crypto-node/README.md)

### @owf/status-list

[![@owf/status-list version](https://img.shields.io/npm/v/@owf/status-list)](https://npmjs.com/package/@owf/status-list)

Core status list implementation with bitstring handling, compression, and decompression.

```bash
npm install @owf/status-list
```

📖 [View package documentation](./packages/status-list/README.md)

### @owf/status-list-jwt

[![@owf/status-list-jwt version](https://img.shields.io/npm/v/@owf/status-list-jwt)](https://npmjs.com/package/@owf/status-list-jwt)

JWT transport layer for creating and reading status list tokens.

```bash
npm install @owf/status-list-jwt
```

📖 [View package documentation](./packages/status-list-jwt/README.md)

### @owf/status-list-cwt

[![@owf/status-list-cwt version](https://img.shields.io/npm/v/@owf/status-list-cwt)](https://npmjs.com/package/@owf/status-list-cwt)

CWT/CBOR transport layer for creating and reading status list tokens.

```bash
npm install @owf/status-list-cwt
```

📖 [View package documentation](./packages/status-list-cwt/README.md)

---

## Getting Started

### Installation

Install the packages you need:

```bash
# Using npm
npm install @owf/identity-common

# Using pnpm
pnpm add @owf/identity-common

# Using yarn
yarn add @owf/identity-common
```

### Development Setup

To contribute or develop locally:

```bash
# Clone the repository
git clone https://github.com/openwallet-foundation-labs/identity-common-ts.git
cd identity-common-ts

# Install dependencies (requires pnpm)
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

---

## Supported Environments

This library is **platform agnostic** and supports:

- ✅ **Node.js** (>=20)
- ✅ **Browsers** (modern browsers with ES2020 support)
- ✅ **React Native**

### Requirements

Your environment must provide:

- `URL` and `URLSearchParams` implementations
- A global `fetch` implementation (or provide it via callbacks)

### Platform-Agnostic Design

Because these libraries are platform agnostic, cryptographic operations and other platform-specific functionality must be provided via callbacks:

```typescript
import { someFunction } from '@owf/identity-common'

// Provide platform-specific implementations
const result = await someFunction({
  crypto: {
    sha256: async (data) => { /* your implementation */ },
    randomBytes: (length) => { /* your implementation */ },
  },
  fetch: globalThis.fetch, // if not globally available
})
```

---

## Related Projects

This library is designed to work with and support other OpenWallet Foundation projects:

- [**sd-jwt-js**](https://github.com/openwallet-foundation-labs/sd-jwt-js) - SD-JWT implementation
- [**oid4vc-ts**](https://github.com/openwallet-foundation-labs/oid4vc-ts) - OpenID4VC implementation
- [**openid-federation-ts**](https://github.com/openwallet-foundation-labs/openid-federation-ts) - OpenID Federation implementation
- [**credo-ts**](https://github.com/openwallet-foundation/credo-ts) - Aries Framework JavaScript
- [**EUDIPLO**](https://github.com/openwallet-foundation-labs/eudiplo) - EUDI Wallet implementation

---

## Contributing

We welcome contributions! Whether you're:

- 🐛 Reporting bugs
- 💡 Suggesting features
- 📝 Improving documentation
- 🔧 Submitting code changes

Please read our [Contributing Guide](./CONTRIBUTING.md) to get started.

### Adding a New Package

Want to add a new package to the monorepo? Check out our [guide for adding packages](./CONTRIBUTING.md#adding-a-new-package).

---

## License

This project is licensed under the [Apache License Version 2.0](./LICENSE) (Apache-2.0).
