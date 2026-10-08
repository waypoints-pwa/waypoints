import { describe, expect, it } from 'vitest'
import { googleMapsSearch, mapQuery, safeHttpUrl, telLink } from './links'

describe('safeHttpUrl', () => {
  it('keeps web addresses and completes ones pasted without https://', () => {
    expect(safeHttpUrl('https://maps.app.goo.gl/abc')).toBe('https://maps.app.goo.gl/abc')
    expect(safeHttpUrl(' http://example.com ')).toBe('http://example.com/')
    expect(safeHttpUrl('booking.com/hotel/pt/casa')).toBe('https://booking.com/hotel/pt/casa')
    expect(safeHttpUrl('www.example.com')).toBe('https://www.example.com/')
  })

  it('refuses everything else', () => {
    for (const text of ['javascript:alert(1)', 'JAVASCRIPT:alert(1)', 'data:text/html,hi', 'file:///etc/passwd', 'just some notes', '', undefined]) {
      expect(safeHttpUrl(text), String(text)).toBeUndefined()
    }
  })
})

describe('maps and phones', () => {
  it('builds map searches from the parts that are there', () => {
    expect(mapQuery('Livraria Lello', undefined, ' Porto ')).toBe('Livraria Lello, Porto')
    expect(mapQuery(undefined, '')).toBeUndefined()
    expect(googleMapsSearch('Café A Brasileira, Lisbon')).toBe(
      'https://www.google.com/maps/search/?api=1&query=Caf%C3%A9%20A%20Brasileira%2C%20Lisbon',
    )
  })

  it('makes dialable phone links', () => {
    expect(telLink('+351 21 123 4567')).toBe('tel:+351211234567')
    expect(telLink('(555) 010-9999')).toBe('tel:5550109999')
    expect(telLink('call the host')).toBeUndefined()
    expect(telLink(undefined)).toBeUndefined()
  })
})
