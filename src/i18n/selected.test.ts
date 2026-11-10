import { describe, expect, it } from 'vitest'
import { en } from './en'
import { pt } from './pt'

describe('selection count and today heading', () => {
  it('reads in English', () => {
    expect(en.files.nSelected.photo(2)).toBe('2 selected')
    expect(en.files.nSelected.document(2)).toBe('2 selected')
    expect(en.plan.dayToday('Wed 10 Mar')).toBe('Wed 10 Mar · Today')
  })

  it('agrees in Portuguese', () => {
    expect(pt.files.nSelected.photo(1)).toBe('1 selecionada')
    expect(pt.files.nSelected.photo(2)).toBe('2 selecionadas')
    expect(pt.files.nSelected.photo(0)).toBe('0 selecionadas')
    expect(pt.files.nSelected.document(1)).toBe('1 selecionado')
    expect(pt.files.nSelected.document(3)).toBe('3 selecionados')
    expect(pt.plan.dayToday('qua., 10/03')).toBe('qua., 10/03 · Hoje')
  })
})
