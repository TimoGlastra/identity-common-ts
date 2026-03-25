import { decodeJwt } from '@owf/identity-common'
import z from 'zod'
import { ScaError } from '../error'
import type { TransactionDataTypes } from '../schemas/transaction-data-types'

export const zTransactionDataSchema = z.object({
  type: z.string(),
  credential_ids: z.array(z.string()),
  transaction_data_hashes_alg: z.array(z.string()),
  payload: z.record(z.string(), z.unknown()),
})

export type ParseScaTransactionDataOptions = {
  transactionData: string
  transactionDataTypes: TransactionDataTypes
}

export const parseScaTransactionData = (options: ParseScaTransactionDataOptions) => {
  // TODO: validate signature
  const { payload } = decodeJwt(options.transactionData)

  const { type } = zTransactionDataSchema.parse(payload)

  const transactionData = options.transactionDataTypes[type]

  if (!transactionData) {
    throw new ScaError(
      `Type '${type}' is not available in transaction_data_types. Only [${Object.keys(transactionData).join(',')}]`
    )
  }

  // TODO: improve the return from this based on more examples
  return {
    payload,
    ...transactionData,
  }
}
