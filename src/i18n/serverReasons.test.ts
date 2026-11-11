import { describe, expect, it } from 'vitest'
import { SERVER_ERROR_CODES } from '../domain/serverProtocol.ts'
import { en } from './en/index.ts'
import { pt } from './pt/index.ts'

describe('reasons.server', () => {
  it('has a Portuguese sentence for every code, and English returns the sentence given', () => {
    for (const code of SERVER_ERROR_CODES) {
      const text = pt.reasons.server({ error: 'x', code, name: 'Max', mb: 25 })
      expect(text, code).toBeTypeOf('string')
      expect(text, code).not.toBe('')
      expect(text, code).not.toBe('x')
      expect(en.reasons.server({ error: 'x', code })).toBe('x')
    }
  })
  it('says specific sentences', () => {
    expect(pt.reasons.server({ error: 'x', code: 'wrongServerCode' })).toBe('Código do servidor errado')
    expect(pt.reasons.server({ error: 'x', code: 'nameTaken', name: 'Max' })).toBe(
      'Já há alguém chamado Max no servidor. Se és tu, escolhe antes o teu nome na lista.',
    )
    expect(pt.reasons.server({ error: 'x', code: 'fileTooLarge', mb: 25 })).toBe('Este servidor aceita ficheiros até 25 MB')
  })
  it('falls back to the sentence given', () => {
    expect(pt.reasons.server({ error: 'x', code: 'nameTaken' })).toBe('x')
    expect(pt.reasons.server({ error: 'x', code: 'fileTooLarge', mb: '25' as unknown as number })).toBe('x')
    expect(pt.reasons.server({ error: 'x', code: 'nope' })).toBe('x')
    expect(pt.reasons.server({ error: 'x' })).toBe('x')
  })
})

describe('reasons.data for the server', () => {
  it('Portuguese says why the server refused a record', () => {
    expect(pt.reasons.data({ message: 'x', code: 'privateFile' })).toBe('Fica só no telemóvel onde foi adicionado.')
    expect(pt.reasons.data({ message: 'x', code: 'fileChanged' })).toBe('O ficheiro de uma foto ou documento não pode ser alterado.')
    expect(pt.reasons.data({ message: 'x', code: 'otherTrip' })).toBe('Pertence a outra viagem.')
    expect(pt.reasons.data({ message: 'x', code: 'serverTooOld' })).toBe('Este servidor é demasiado antigo para isto: atualiza o servidor.')
  })
})
