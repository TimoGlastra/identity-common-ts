import { base64urlDecode } from './base64url'

export const decodeJwt = <H extends Record<string, unknown>, T extends Record<string, unknown>>(
  jwt: string
): { header: H; payload: T; signature: string } => {
  const { 0: header, 1: payload, 2: signature, length } = jwt.split('.')
  if (length !== 3) {
    throw new Error('Invalid JWT as input')
  }

  return {
    header: JSON.parse(base64urlDecode(header)),
    payload: JSON.parse(base64urlDecode(payload)),
    signature: signature,
  }
}
