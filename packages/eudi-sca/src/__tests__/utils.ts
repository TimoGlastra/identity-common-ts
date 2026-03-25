import { hash as nodeHasher, randomBytes } from 'node:crypto'

export const hasher = (toBeHashed: string) => ({
  algorithm: 'sha256',
  hash: nodeHasher('sha256', toBeHashed),
})

export const jtiGenerator = () => randomBytes(16).toString('base64')
