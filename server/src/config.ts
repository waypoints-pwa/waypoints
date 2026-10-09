import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { newCode } from './secrets.ts'

export interface Config {
  port: number
  /** The trip database and the server code: small, read and written on every change. */
  dataDir: string
  /**
   * Bulk storage, which can be a different disk: daily copies of the database now, documents and
   * photos later. Defaults to the data folder.
   */
  filesDir: string
  /** Lets whoever enters it in the app become an admin, or sign in as any member. */
  serverCode: string
  allowedOrigins: string[] | '*'
}

interface Secrets {
  serverCode: string
}

/** The server code is generated on first start and kept in the data folder, so it survives updates. */
async function loadSecrets(dataDir: string): Promise<Secrets> {
  await mkdir(dataDir, { recursive: true })
  const path = join(dataDir, 'secrets.json')
  try {
    const secrets = JSON.parse(await readFile(path, 'utf8')) as Partial<Secrets>
    if (secrets.serverCode) return secrets as Secrets
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
  }
  const secrets: Secrets = { serverCode: newCode() }
  await writeFile(path, JSON.stringify(secrets, null, 2), { mode: 0o600 })
  return secrets
}

export async function loadConfig(env: Record<string, string | undefined> = process.env): Promise<Config> {
  const dataDir = env.DATA_DIR || './data'
  const secrets = await loadSecrets(dataDir)
  const origins = (env.ALLOWED_ORIGINS ?? '*').split(',').map((s) => s.trim()).filter(Boolean)
  return {
    port: Number(env.PORT || 8788),
    dataDir,
    filesDir: env.FILES_DIR || dataDir,
    serverCode: env.WAYPOINTS_SERVER_CODE || secrets.serverCode,
    allowedOrigins: origins.includes('*') || !origins.length ? '*' : origins,
  }
}
