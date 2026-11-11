import { describe, expect, it } from 'vitest'
import { en } from './en/index.ts'
import { pt } from './pt/index.ts'

describe('reasons.data', () => {
  it('English returns the message given', () => {
    expect(en.reasons.data({ message: 'Hello', code: 'notWaypointsFile' })).toBe('Hello')
  })
  it('Portuguese goes by code', () => {
    expect(pt.reasons.data({ message: 'x', code: 'notWaypointsFile' })).toBe('Este ficheiro não é do waypoints.')
  })
  it('Portuguese names the invalid record by table', () => {
    expect(pt.reasons.data({ message: 'x', code: 'invalidRecord', table: 'expenses' })).toBe('Contém uma despesa inválida.')
    expect(pt.reasons.data({ message: 'x', code: 'invalidRecord', table: 'somethingNew' })).toBe('Contém dados inválidos.')
  })
  it('Portuguese falls back to the message', () => {
    expect(pt.reasons.data({ message: 'x' })).toBe('x')
    expect(pt.reasons.data({ message: 'x', code: 'nope' })).toBe('x')
  })
})
