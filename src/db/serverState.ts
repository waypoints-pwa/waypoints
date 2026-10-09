import type { MemberSummary, RejectedRecord } from '../domain/serverProtocol'
import { getSetting, setSetting, SETTINGS } from './db'

/** The sync server this phone is connected to. Local only, never shared or exported. */
export interface ServerConfig {
  /** e.g. https://share.example.ts.net:13443 */
  url: string
  /** This phone's token: it is this phone's access to the server. */
  token: string
  deviceId: string
  /** Who this phone belongs to on the server. */
  member: MemberSummary
  /** Everyone on the server, as of the last sync: trips can be shared with them offline. */
  members: MemberSummary[]
  lastSyncAt?: string
  lastError?: string
  /** HTTP status of the last failure: 401 means this phone was disconnected from the server. */
  lastErrorStatus?: number
  /** Changes the server refused at the last sync. They stay waiting, and are sent again. */
  rejected?: RejectedRecord[]
}

export const getServerConfig = () => getSetting<ServerConfig>(SETTINGS.server)
export const setServerConfig = (config: ServerConfig | undefined) => setSetting(SETTINGS.server, config)
