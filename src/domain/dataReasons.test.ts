import { describe, expect, it } from 'vitest'
import { checkRecord, DataError } from './records.ts'
import { decodeLink, parseBackup } from './sync.ts'

function thrown(fn: () => unknown): DataError {
  try {
    fn()
  } catch (err) {
    expect(err).toBeInstanceOf(DataError)
    return err as DataError
  }
  throw new Error('did not throw')
}

describe('DataError codes', () => {
  it('marks files that are not waypoints files', () => {
    expect(thrown(() => parseBackup('x')).code).toBe('notWaypointsFile')
    expect(thrown(() => parseBackup('{}')).code).toBe('notWaypointsFile')
  })
  it('marks files from a newer version', () => {
    expect(thrown(() => parseBackup('{"app":"waypoints","schemaVersion":999}')).code).toBe('newerFile')
  })
  it('marks links that are not trips or are newer', () => {
    expect(thrown(() => decodeLink({})).code).toBe('notTripLink')
    expect(thrown(() => decodeLink({ v: 99 })).code).toBe('newerLink')
  })
  it('marks an invalid record with its table', () => {
    const err = thrown(() => checkRecord('votes', {}))
    expect(err.code).toBe('invalidRecord')
    expect(err.table).toBe('votes')
    expect(err.message).toBe('It contains an invalid vote.')
  })
})
