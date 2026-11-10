import type { Messages } from '../en'

export const common: Messages['common'] = {
  mergeSummary: ({ added, updated, removed }) =>
    [
      added && `${added} ${added === 1 ? 'novo' : 'novos'}`,
      updated && `${updated} ${updated === 1 ? 'alterado' : 'alterados'}`,
      removed && `${removed} ${removed === 1 ? 'eliminado' : 'eliminados'}`,
    ]
      .filter(Boolean)
      .join(', ') || 'pequenas alterações',
}
