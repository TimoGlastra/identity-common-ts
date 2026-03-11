/**
 * Parse PEM-encoded certificate(s) and return base64-encoded DER strings.
 *
 * @param pem - One or more PEM-encoded certificates
 * @returns Array of base64-encoded DER certificate strings
 */
export function parseCertificateChain(pem: string): string[] {
  const certs: string[] = []
  const certRegex = /-----BEGIN CERTIFICATE-----([\s\S]*?)-----END CERTIFICATE-----/g

  for (let match = certRegex.exec(pem); match !== null; match = certRegex.exec(pem)) {
    const base64Content = match[1].replace(/\s/g, '')
    certs.push(base64Content)
  }

  if (certs.length === 0) {
    throw new Error('No valid certificates found in PEM string')
  }

  return certs
}

/**
 * Validate and normalize a PEM-encoded private key string.
 *
 * @param pem - PEM-encoded private key
 * @returns The normalized (trimmed) PEM string
 */
export function parsePrivateKey(pem: string): string {
  const normalized = pem.trim()
  const keyRegex =
    /-----BEGIN (?:EC |RSA |ENCRYPTED )?PRIVATE KEY-----([\s\S]*?)-----END (?:EC |RSA |ENCRYPTED )?PRIVATE KEY-----/
  const match = normalized.match(keyRegex)

  if (!match) {
    throw new Error('No valid private key found in PEM string')
  }

  return normalized
}

/**
 * Parse a single PEM-encoded certificate and return its base64-encoded DER string.
 *
 * @param pem - A single PEM-encoded certificate
 * @returns Base64-encoded DER certificate string
 */
export function parseCertificate(pem: string): string {
  const certRegex = /-----BEGIN CERTIFICATE-----([\s\S]*?)-----END CERTIFICATE-----/
  const match = pem.match(certRegex)

  if (!match) {
    throw new Error('No valid certificate found in PEM string')
  }

  return match[1].replace(/\s/g, '')
}

/**
 * Convert a base64-encoded DER certificate to PEM format.
 *
 * @param base64Der - Base64-encoded DER certificate data
 * @returns PEM-encoded certificate string
 */
export function base64DerToPem(base64Der: string): string {
  const lines = base64Der.match(/.{1,64}/g) || []
  return `-----BEGIN CERTIFICATE-----\n${lines.join('\n')}\n-----END CERTIFICATE-----`
}
