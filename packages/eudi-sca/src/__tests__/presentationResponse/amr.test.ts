import { expect, suite, test } from 'vitest'
import { AmrInherence, AmrKnowledge, AmrPossession, createAmr } from '../../presentationResponse/amr'

suite('amr', () => {
  test('create a valid amr configuration with 2 entries', () => {
    const amr = createAmr({ inherence: AmrInherence.FaceDevice, possession: AmrPossession.KeyInRemoteWscd })

    expect(amr.length).toStrictEqual(2)
    expect(amr).toStrictEqual(
      expect.arrayContaining([{ inherence: AmrInherence.FaceDevice }, { possession: AmrPossession.KeyInRemoteWscd }])
    )
  })

  test('create a valid amr configuration with 3 entries', () => {
    const amr = createAmr({
      inherence: AmrInherence.FaceDevice,
      possession: AmrPossession.KeyInRemoteWscd,
      knowledge: AmrKnowledge.Pin6OrMoreDigits,
    })

    expect(amr.length).toStrictEqual(3)
    expect(amr).toStrictEqual(
      expect.arrayContaining([
        { inherence: AmrInherence.FaceDevice },
        { possession: AmrPossession.KeyInRemoteWscd },
        { knowledge: AmrKnowledge.Pin6OrMoreDigits },
      ])
    )
  })

  test('create an invalid amr configuration with one amr', () => {
    // @ts-expect-error: covering test case
    expect(() => createAmr({ inherence: AmrInherence.FaceDevice })).toThrow()
  })
})
