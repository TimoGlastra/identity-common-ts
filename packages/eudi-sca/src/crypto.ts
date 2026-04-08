export type JwtSignatureVerifier = (x5c: Array<string>, toBeVerified: string, signature: Uint8Array) => Promise<void>
