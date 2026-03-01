# @owf/integrity

W3C Subresource Integrity (SRI) compatible types, calculation, and parsing utilities for digital identity payloads.

## Features

- **Types:** Strongly typed `IntegrityMetadata`, `IntegrityDigest`, and the `Integrity<T, Paths>` utility type that automatically adds `#integrity` fields to your types based on JSON paths
- **Calculation:** `calculateIntegrity` to compute and inject integrity hashes into objects, supporting JSONPath-like selectors (dot notation, bracket notation, wildcards)
- **Parsing & Extraction:** `parseIntegrityString` following W3C SRI standard and `extractIntegrity` to recursively find and resolve all `#integrity` fields

## Usage

### Define a Secured Type

```typescript
import type { Integrity } from '@owf/integrity'

interface UserProfile {
  id: string
  username: string
  contact: {
    email: string
  }
  documents: {
    type: string
    url: string
  }[]
}

type SecuredProfile = Integrity<UserProfile, 'contact.email' | 'documents[*].url'>
```

### Calculate Integrity

```typescript
import { calculateIntegrity } from '@owf/integrity'

const securedUser = await calculateIntegrity(
  user,
  ['contact.email', 'documents[*].url'],
  myHasher,
)
```

### Extract & Verify

```typescript
import { extractIntegrity } from '@owf/integrity'

const results = extractIntegrity(securedUser)
```
