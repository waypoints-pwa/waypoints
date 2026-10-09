import { join } from 'node:path'
import { createApp, VERSION } from './app.ts'
import { loadConfig } from './config.ts'
import { FileStore } from './files.ts'
import { Store } from './store.ts'

const config = await loadConfig()
const store = new Store(config.dataDir, join(config.filesDir, 'backups'))
await store.load()
const files = new FileStore(join(config.filesDir, 'trips'))

createApp(config, store, files).listen(config.port, () => {
  const members = Object.keys(store.data.members).length
  const trips = Object.keys(store.data.trips).length
  console.log(`waypoints-server ${VERSION} listening on :${config.port} (${members} member(s), ${trips} trip(s))`)
  console.log(`Data: ${config.dataDir} · photos and documents: ${files.dir} · daily copies: ${join(config.filesDir, 'backups')}`)
  console.log(`Server code: ${config.serverCode}`)
  console.log('Keep it to yourself: whoever enters it in waypoints (Settings → Sync server) becomes an admin.')
})

const shutdown = async () => {
  await store.save()
  process.exit(0)
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
