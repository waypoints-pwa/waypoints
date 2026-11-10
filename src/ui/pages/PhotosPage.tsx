import { useState } from 'react'
import { m } from '../../i18n'
import { Link, useSearchParams } from 'react-router'
import { isPhoto, ownerFinder, sortDocuments, stateFinder, tripPhotos, useTripFiles } from '../attachments'
import { Notice } from '../components/bits'
import { AddAttachments, DocumentRow, PhotoTile, SelectBar, selectOf, useSelection } from '../components/Attachments'
import { sectionFiles } from '../fileGroups'
import { fmtBytes } from '../format'
import { tripPath, useTrip } from '../tripData'

/** The trip's documents and photos: those of the whole trip and of each item, in one place. */
export function PhotosPage() {
  const t = useTrip()
  const files = useTripFiles(t.trip.id)
  const ownerOf = ownerFinder(t)
  const stateOf = stateFinder(t)
  const [params, setParams] = useSearchParams()
  const selection = useSelection()
  const [deleted, setDeleted] = useState<string>()
  const view = params.get('view') === 'photos' ? 'photos' : 'documents'
  const docGroups = sectionFiles(sortDocuments(t.attachments.filter((a) => !isPhoto(a)), ownerOf), ownerOf)
  const photoGroups = sectionFiles(tripPhotos(t), ownerOf)
  const shownDocs = docGroups.flatMap((g) => g.sections.flatMap((s) => s.items))
  const shownPhotos = photoGroups.flatMap((g) => g.sections.flatMap((s) => s.items.slice(0, 3)))
  const shown = view === 'documents' ? shownDocs : shownPhotos
  const noun = view === 'documents' ? ('document' as const) : ('photo' as const)
  const switchView = (next: Record<string, string>) => {
    selection.stop()
    setDeleted(undefined)
    setParams(next, { replace: true })
  }
  const states = t.attachments.map((a) => stateOf(a, files?.get(a.id)))
  const waiting = states.filter((s) => s === 'waiting').length
  const refused = states.filter((s) => s === 'refused').length
  const used = files ? [...files.values()].reduce((sum, f) => sum + (f.blob?.size ?? 0) + (f.thumb?.size ?? 0), 0) : 0

  return (
    <>
      <h2>{m.files.title}</h2>
      {!t.server && t.travellers.length > 1 && (
        <p className="muted small">{m.files.staysOnPhone}</p>
      )}
      {t.oldServer && (
        <Notice kind="warn">{m.files.oldServerNotice}</Notice>
      )}
      {t.server && !t.oldServer && (waiting > 0 || refused > 0) && (
        <p className="muted small">
          {[waiting > 0 && m.files.waitingFiles(waiting), refused > 0 && m.files.refusedFiles(refused)].filter(Boolean).join(' ')}
        </p>
      )}

      <AddAttachments choose />

      <div className="segmented" role="tablist" aria-label={m.files.viewLabel}>
        <button role="tab" aria-selected={view === 'documents'} className={view === 'documents' ? 'active' : ''} onClick={() => switchView({})}>
          {m.files.documentsTab}
        </button>
        <button
          role="tab"
          aria-selected={view === 'photos'}
          className={view === 'photos' ? 'active' : ''}
          onClick={() => switchView({ view: 'photos' })}
        >
          {m.files.photosTab}
        </button>
      </div>

      {shown.length > 0 && !selection.active && (
        <div className="actions">
          <button
            type="button"
            className="btn btn-small"
            onClick={() => {
              setDeleted(undefined)
              selection.start()
            }}
          >
            {m.common.select}
          </button>
        </div>
      )}
      {deleted && <Notice kind="ok">{deleted}</Notice>}

      {view === 'documents' ? (
        <section className="stack">
          {docGroups.length === 0 && <p className="muted small">{m.files.emptyDocuments}</p>}
          {docGroups.map((g) => (
            <div key={g.group} className="stack" style={{ gap: 6 }}>
              <h3 className="group-title">{g.label}</h3>
              {g.sections.map((s) => (
                <div key={s.key} className="stack" style={{ gap: 6 }}>
                  {g.group !== 'trip' && (
                    <div className="row spread">
                      <h4>
                        {s.emoji} {s.title}
                      </h4>
                    </div>
                  )}
                  <ul className="list">
                    {s.items.map((a) => (
                      <li key={a.id}>
                        <DocumentRow a={a} file={files?.get(a.id)} state={stateOf(a, files?.get(a.id))} select={selectOf(selection, a.id)} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </section>
      ) : (
        <section className="stack">
          {photoGroups.length === 0 && <p className="muted small">{m.files.emptyPhotos}</p>}
          {photoGroups.map((g) => (
            <div key={g.group} className="stack" style={{ gap: 6 }}>
              {g.sections.map((s) => {
                const seeAll = s.items.length > 3 && (
                  <Link className="link small" to={tripPath(t.trip.id, ...s.seeAll)}>
                    {m.files.seeAll(s.items.length)}
                  </Link>
                )
                return (
                  <div key={s.key} className="stack" style={{ gap: 6 }}>
                    {g.group === 'trip' ? (
                      <div className="row spread">
                        <h3 className="group-title">{g.label}</h3>
                        {seeAll}
                      </div>
                    ) : (
                      <>
                        {s === g.sections[0] && <h3 className="group-title">{g.label}</h3>}
                        <div className="row spread">
                          <h4>
                            {s.emoji} {s.title}
                          </h4>
                          {seeAll}
                        </div>
                      </>
                    )}
                    <div className="photo-grid photo-row">
                      {s.items.slice(0, 3).map((a) => (
                        <PhotoTile key={a.id} a={a} file={files?.get(a.id)} state={stateOf(a, files?.get(a.id))} select={selectOf(selection, a.id)} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </section>
      )}

      {selection.active && <SelectBar shown={shown} noun={noun} selection={selection} onDeleted={(n) => setDeleted(m.files.deletedNotice[noun](n))} />}

      {used > 0 && <p className="muted small">{m.files.takeSpace(fmtBytes(used))}</p>}
    </>
  )
}
