import { describe, expect, it } from 'vitest'
import { assertValidSchemaMeta, validateSchemaMeta } from '../validator'

const validSchemaMeta = {
  version: '1.0.0',
  rulebookURI: 'https://example.com/rulebook.md',
  attestationLoS: 'iso_18045_basic',
  bindingType: 'key',
  schemaURIs: [
    {
      formatIdentifier: 'dc+sd-jwt',
      uri: 'https://example.com/schema.json',
      meta: { vct: 'eu.europa.ec.eudi.pid.1' },
    },
  ],
}

describe('validateSchemaMeta', () => {
  it('should validate a valid SchemaMeta', () => {
    const result = validateSchemaMeta(validSchemaMeta)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should validate a full SchemaMeta with all optional fields', () => {
    const full = {
      ...validSchemaMeta,
      id: 'https://example.com/attestations/test',
      rulebookIntegrity: 'sha256-abc123',
      trustedAuthorities: [
        {
          frameworkType: 'etsi_tl',
          value: 'https://example.com/trust-list.jws',
          isLOTE: true,
        },
      ],
    }
    const result = validateSchemaMeta(full)
    expect(result.valid).toBe(true)
  })

  it('should reject missing version', () => {
    const { version, ...invalid } = validSchemaMeta
    const result = validateSchemaMeta(invalid)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should reject missing rulebookURI', () => {
    const { rulebookURI, ...invalid } = validSchemaMeta
    const result = validateSchemaMeta(invalid)
    expect(result.valid).toBe(false)
  })

  it('should reject invalid attestationLoS', () => {
    const result = validateSchemaMeta({ ...validSchemaMeta, attestationLoS: 'invalid' })
    expect(result.valid).toBe(false)
  })

  it('should reject invalid bindingType', () => {
    const result = validateSchemaMeta({ ...validSchemaMeta, bindingType: 'invalid' })
    expect(result.valid).toBe(false)
  })

  it('should reject empty schemaURIs', () => {
    const result = validateSchemaMeta({ ...validSchemaMeta, schemaURIs: [] })
    expect(result.valid).toBe(false)
  })

  it('should reject schemaURI missing meta', () => {
    const result = validateSchemaMeta({
      ...validSchemaMeta,
      schemaURIs: [{ formatIdentifier: 'dc+sd-jwt', uri: 'https://example.com/schema.json' }],
    })
    expect(result.valid).toBe(false)
  })

  it('should accept dc+sd-jwt with vct', () => {
    const result = validateSchemaMeta({
      ...validSchemaMeta,
      schemaURIs: [
        {
          formatIdentifier: 'dc+sd-jwt',
          uri: 'https://example.com/schema.json',
          meta: { vct: 'eu.europa.ec.eudi.pid.1' },
        },
      ],
    })
    expect(result.valid).toBe(true)
  })

  it('should reject dc+sd-jwt meta missing vct', () => {
    const result = validateSchemaMeta({
      ...validSchemaMeta,
      schemaURIs: [{ formatIdentifier: 'dc+sd-jwt', uri: 'https://example.com/schema.json', meta: {} }],
    })
    expect(result.valid).toBe(false)
  })

  it('should reject dc+sd-jwt meta with unknown fields', () => {
    const result = validateSchemaMeta({
      ...validSchemaMeta,
      schemaURIs: [
        {
          formatIdentifier: 'dc+sd-jwt',
          uri: 'https://example.com/schema.json',
          meta: { vct: 'eu.europa.ec.eudi.pid.1', unknown_field: 'value' },
        },
      ],
    })
    expect(result.valid).toBe(false)
  })

  it('should accept mso_mdoc with doctype_value', () => {
    const result = validateSchemaMeta({
      ...validSchemaMeta,
      schemaURIs: [
        {
          formatIdentifier: 'mso_mdoc',
          uri: 'https://example.com/schema.json',
          meta: { doctype_value: 'org.iso.18013.5.1.mDL' },
        },
      ],
    })
    expect(result.valid).toBe(true)
  })

  it('should reject mso_mdoc meta missing doctype_value', () => {
    const result = validateSchemaMeta({
      ...validSchemaMeta,
      schemaURIs: [{ formatIdentifier: 'mso_mdoc', uri: 'https://example.com/schema.json', meta: {} }],
    })
    expect(result.valid).toBe(false)
  })

  it('should reject mso_mdoc meta with unknown fields', () => {
    const result = validateSchemaMeta({
      ...validSchemaMeta,
      schemaURIs: [
        {
          formatIdentifier: 'mso_mdoc',
          uri: 'https://example.com/schema.json',
          meta: { doctype_value: 'org.iso.18013.5.1.mDL', unknown_field: 'value' },
        },
      ],
    })
    expect(result.valid).toBe(false)
  })

  it('should accept the target data shape example from spec', () => {
    const result = validateSchemaMeta({
      ...validSchemaMeta,
      schemaURIs: [
        {
          formatIdentifier: 'dc+sd-jwt',
          uri: 'https://example.org/schemas/pid.json',
          meta: { vct: 'eu.europa.ec.eudi.pid.1' },
        },
        {
          formatIdentifier: 'mso_mdoc',
          uri: 'https://example.org/schemas/mdl.json',
          meta: { doctype_value: 'org.iso.18013.5.1.mDL' },
        },
      ],
    })
    expect(result.valid).toBe(true)
  })

  it('should reject invalid frameworkType in trustedAuthorities', () => {
    const result = validateSchemaMeta({
      ...validSchemaMeta,
      trustedAuthorities: [{ frameworkType: 'invalid', value: 'test' }],
    })
    expect(result.valid).toBe(false)
  })

  it('should reject isLOTE with non-etsi_tl framework', () => {
    const result = validateSchemaMeta({
      ...validSchemaMeta,
      trustedAuthorities: [{ frameworkType: 'aki', value: 'test', isLOTE: true }],
    })
    expect(result.valid).toBe(false)
  })

  it('should reject non-object input', () => {
    const result = validateSchemaMeta('not-an-object')
    expect(result.valid).toBe(false)
  })

  it('should reject null input', () => {
    const result = validateSchemaMeta(null)
    expect(result.valid).toBe(false)
  })
})

describe('assertValidSchemaMeta', () => {
  it('should not throw for valid SchemaMeta', () => {
    expect(() => assertValidSchemaMeta(validSchemaMeta)).not.toThrow()
  })

  it('should throw SchemaMetaException for invalid SchemaMeta', () => {
    expect(() => assertValidSchemaMeta({})).toThrow('Invalid SchemaMeta')
  })

  it('should narrow the type after assertion', () => {
    const data: unknown = validSchemaMeta
    assertValidSchemaMeta(data)
    // After assertion, data should be typed as SchemaMeta
    expect(data.version).toBe('1.0.0')
    expect(data.schemaURIs[0].formatIdentifier).toBe('dc+sd-jwt')
  })
})
