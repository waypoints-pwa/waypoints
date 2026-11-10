export const common = {
  /** "2 new, 1 changed" for a merge. */
  mergeSummary: ({ added, updated, removed }: { added: number; updated: number; removed: number }): string =>
    [added && `${added} new`, updated && `${updated} changed`, removed && `${removed} deleted`].filter(Boolean).join(', ') || 'small updates',
}
