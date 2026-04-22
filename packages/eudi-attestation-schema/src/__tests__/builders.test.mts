import { describe, expect, it } from 'vitest'
import { schemaMeta, schemaURI, trustAuthority } from '../builders'

describe('TrustAuthorityBuilder', () => {
  it('should create a trust authority with etsi_tl framework', () => {
    const ta = trustAuthority()
      .frameworkType('etsi_tl')
      .value('https://example.com/trust-list.jws')
      .isLoTE(true)
      .build()

    expect(ta.frameworkType).toBe('etsi_tl')
    expect(ta.value).toBe('https://example.com/trust-list.jws')
    expect(ta.isLOTE).toBe(true)
  })

  it('should create a trust authority with aki framework', () => {
    const ta = trustAuthority().frameworkType('aki').value('dGVzdC1ha2k').build()

    expect(ta.frameworkType).toBe('aki')
    expect(ta.value).toBe('dGVzdC1ha2k')
    expect(ta.isLOTE).toBeUndefined()
  })

  it('should create a trust authority with openid_federation framework', () => {
    const ta = trustAuthority().frameworkType('openid_federation').value('https://federation.example.com').build()

    expect(ta.frameworkType).toBe('openid_federation')
    expect(ta.value).toBe('https://federation.example.com')
  })

  it('should throw when isLOTE is used with non-etsi_tl framework', () => {
    expect(() => {
      trustAuthority().frameworkType('aki').value('dGVzdC1ha2k').isLoTE(true).build()
    }).toThrow('Invalid TrustAuthority')
  })

  it('should throw when frameworkType is missing', () => {
    expect(() => {
      trustAuthority().value('https://example.com').build()
    }).toThrow('Invalid TrustAuthority')
  })

  it('should throw when value is missing', () => {
    expect(() => {
      trustAuthority().frameworkType('etsi_tl').build()
    }).toThrow('Invalid TrustAuthority')
  })
})

describe('SchemaURIBuilder', () => {
  it('should create a schema URI for dc+sd-jwt format', () => {
    const schema = schemaURI().format('dc+sd-jwt').uri('https://example.com/schema.json').build()

    expect(schema.formatIdentifier).toBe('dc+sd-jwt')
    expect(schema.uri).toBe('https://example.com/schema.json')
  })

  it('should create a schema URI with integrity', () => {
    const schema = schemaURI()
      .format('mso_mdoc')
      .uri('https://example.com/schema.json')
      .integrity('sha256-M8H+reBt9Nr/s8CRicJrthAnk7UdWyTyONW0N8Z/Axw=')
      .build()

    expect(schema.integrity).toBe('sha256-M8H+reBt9Nr/s8CRicJrthAnk7UdWyTyONW0N8Z/Axw=')
  })

  it('should throw when format is missing', () => {
    expect(() => {
      schemaURI().uri('https://example.com/schema.json').build()
    }).toThrow('Invalid SchemaURI')
  })

  it('should throw when uri is missing', () => {
    expect(() => {
      schemaURI().format('dc+sd-jwt').build()
    }).toThrow('Invalid SchemaURI')
  })

  it('should throw when uri is not a valid URL', () => {
    expect(() => {
      schemaURI().format('dc+sd-jwt').uri('not-a-url').build()
    }).toThrow('Invalid SchemaURI')
  })
})

describe('SchemaMetaBuilder', () => {
  it('should create a minimal SchemaMeta object', () => {
    const meta = schemaMeta()
      .version('1.0.0')
      .rulebookURI('https://example.com/rulebook.md')
      .attestationLoS('iso_18045_basic')
      .bindingType('key')
      .addFormat('dc+sd-jwt')
      .addSchemaURI(schemaURI().format('dc+sd-jwt').uri('https://example.com/schema.json').build())
      .build()

    expect(meta.version).toBe('1.0.0')
    expect(meta.rulebookURI).toBe('https://example.com/rulebook.md')
    expect(meta.attestationLoS).toBe('iso_18045_basic')
    expect(meta.bindingType).toBe('key')
    expect(meta.supportedFormats).toEqual(['dc+sd-jwt'])
    expect(meta.schemaURIs).toHaveLength(1)
  })

  it('should create a full SchemaMeta with all fields', () => {
    const ta = trustAuthority()
      .frameworkType('etsi_tl')
      .value('https://example.com/trust-list.jws')
      .isLoTE(true)
      .build()

    const meta = schemaMeta()
      .id('https://example.com/attestations/membership')
      .version('1.0.0')
      .rulebookURI('https://example.com/rulebook.md')
      .rulebookIntegrity('sha256-cJe/IG7DijmXd2FpecyWJVnZ9EuKKprly5auxGm1uIw=')
      .addTrustAuthority(ta)
      .attestationLoS('iso_18045_basic')
      .bindingType('key')
      .addFormat('dc+sd-jwt')
      .addSchemaURI(
        schemaURI()
          .format('dc+sd-jwt')
          .uri('https://example.com/schema.json')
          .integrity('sha256-M8H+reBt9Nr/s8CRicJrthAnk7UdWyTyONW0N8Z/Axw=')
          .build()
      )
      .build()

    expect(meta.id).toBe('https://example.com/attestations/membership')
    expect(meta.rulebookIntegrity).toBe('sha256-cJe/IG7DijmXd2FpecyWJVnZ9EuKKprly5auxGm1uIw=')
    expect(meta.trustedAuthorities).toHaveLength(1)
    expect(meta.trustedAuthorities?.[0].frameworkType).toBe('etsi_tl')
    expect(meta.trustedAuthorities?.[0].isLOTE).toBe(true)
    expect(meta.schemaURIs[0].integrity).toBe('sha256-M8H+reBt9Nr/s8CRicJrthAnk7UdWyTyONW0N8Z/Axw=')
  })

  it('should support multiple formats and schema URIs', () => {
    const meta = schemaMeta()
      .version('1.0.0')
      .rulebookURI('https://example.com/rulebook.md')
      .attestationLoS('iso_18045_high')
      .bindingType('claim')
      .addFormat('dc+sd-jwt')
      .addFormat('mso_mdoc')
      .addSchemaURI(schemaURI().format('dc+sd-jwt').uri('https://example.com/schema-sdjwt.json').build())
      .addSchemaURI(schemaURI().format('mso_mdoc').uri('https://example.com/schema-mdoc.json').build())
      .build()

    expect(meta.supportedFormats).toEqual(['dc+sd-jwt', 'mso_mdoc'])
    expect(meta.schemaURIs).toHaveLength(2)
  })

  it('should not add duplicate formats', () => {
    const meta = schemaMeta()
      .version('1.0.0')
      .rulebookURI('https://example.com/rulebook.md')
      .attestationLoS('iso_18045_basic')
      .bindingType('none')
      .addFormat('dc+sd-jwt')
      .addFormat('dc+sd-jwt')
      .addSchemaURI(schemaURI().format('dc+sd-jwt').uri('https://example.com/schema.json').build())
      .build()

    expect(meta.supportedFormats).toEqual(['dc+sd-jwt'])
  })

  it('should support multiple trust authorities', () => {
    const meta = schemaMeta()
      .version('1.0.0')
      .rulebookURI('https://example.com/rulebook.md')
      .attestationLoS('iso_18045_moderate')
      .bindingType('key')
      .addTrustAuthority(trustAuthority().frameworkType('etsi_tl').value('https://example.com/tl1.jws').build())
      .addTrustAuthority(trustAuthority().frameworkType('aki').value('dGVzdA').build())
      .addFormat('dc+sd-jwt')
      .addSchemaURI(schemaURI().format('dc+sd-jwt').uri('https://example.com/schema.json').build())
      .build()

    expect(meta.trustedAuthorities).toHaveLength(2)
  })

  it('should throw when version is missing', () => {
    expect(() => {
      schemaMeta()
        .rulebookURI('https://example.com/rulebook.md')
        .attestationLoS('iso_18045_basic')
        .bindingType('key')
        .addFormat('dc+sd-jwt')
        .addSchemaURI(schemaURI().format('dc+sd-jwt').uri('https://example.com/schema.json').build())
        .build()
    }).toThrow('Invalid SchemaMeta')
  })

  it('should throw when rulebookURI is missing', () => {
    expect(() => {
      schemaMeta()
        .version('1.0.0')
        .attestationLoS('iso_18045_basic')
        .bindingType('key')
        .addFormat('dc+sd-jwt')
        .addSchemaURI(schemaURI().format('dc+sd-jwt').uri('https://example.com/schema.json').build())
        .build()
    }).toThrow('Invalid SchemaMeta')
  })

  it('should throw when supportedFormats is empty', () => {
    expect(() => {
      schemaMeta()
        .version('1.0.0')
        .rulebookURI('https://example.com/rulebook.md')
        .attestationLoS('iso_18045_basic')
        .bindingType('key')
        .addSchemaURI(schemaURI().format('dc+sd-jwt').uri('https://example.com/schema.json').build())
        .build()
    }).toThrow('Invalid SchemaMeta')
  })

  it('should throw when schemaURIs is empty', () => {
    expect(() => {
      schemaMeta()
        .version('1.0.0')
        .rulebookURI('https://example.com/rulebook.md')
        .attestationLoS('iso_18045_basic')
        .bindingType('key')
        .addFormat('dc+sd-jwt')
        .build()
    }).toThrow('Invalid SchemaMeta')
  })

  it('should produce the gym membership example from cre8/catalog-of-attestations', () => {
    const meta = schemaMeta()
      .id('https://gym.example.com/attestations/gym-membership-card')
      .version('1.0.0')
      .rulebookURI(
        'https://raw.githubusercontent.com/cre8/catalog-of-attestations/main/rulebooks/gym-membership-card/1.0.0.md'
      )
      .rulebookIntegrity('sha256-cJe/IG7DijmXd2FpecyWJVnZ9EuKKprly5auxGm1uIw=')
      .addTrustAuthority(
        trustAuthority()
          .frameworkType('etsi_tl')
          .value('https://raw.githubusercontent.com/cre8/catalog-of-attestations/main/trust-lists/gym-members.jws')
          .isLoTE(true)
          .build()
      )
      .attestationLoS('iso_18045_basic')
      .bindingType('key')
      .addFormat('dc+sd-jwt')
      .addSchemaURI(
        schemaURI()
          .format('dc+sd-jwt')
          .uri(
            'https://raw.githubusercontent.com/cre8/catalog-of-attestations/main/schemas/gym-membership.dc+sd-jwt.json'
          )
          .integrity('sha256-M8H+reBt9Nr/s8CRicJrthAnk7UdWyTyONW0N8Z/Axw=')
          .build()
      )
      .build()

    expect(meta.id).toBe('https://gym.example.com/attestations/gym-membership-card')
    expect(meta.version).toBe('1.0.0')
    expect(meta.trustedAuthorities).toHaveLength(1)
    expect(meta.trustedAuthorities?.[0].isLOTE).toBe(true)
    expect(meta.supportedFormats).toEqual(['dc+sd-jwt'])
    expect(meta.schemaURIs).toHaveLength(1)
  })
})
