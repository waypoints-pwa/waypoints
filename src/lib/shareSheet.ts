import { downloadBlob } from './download'

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

/** The share sheet with a file (save it to Files, open it in another app…), or a download where there's none. */
export async function shareFile(blob: Blob, name: string): Promise<void> {
  const file = new File([blob], name, { type: blob.type })
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] })
      return
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') return
  }
  downloadBlob(blob, name)
}

/** Opens a file the phone can show by itself (a PDF, an image) in a new tab. */
export function openFile(blob: Blob) {
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 5 * 60_000)
}
