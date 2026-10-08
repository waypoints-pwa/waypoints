/** Share sheet on phones, clipboard elsewhere, and a copyable prompt as the last resort. */
export async function shareUrl(url: string, title: string, text?: string): Promise<'shared' | 'copied' | undefined> {
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url })
      return 'shared'
    }
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch (err) {
    if ((err as Error).name !== 'AbortError') prompt('Copy this link:', url)
    return undefined
  }
}
