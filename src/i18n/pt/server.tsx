import type { Messages } from '../en'
import { plural } from '../plural'

export const server: Messages['server'] = {
  disconnected: 'Este telemóvel foi desligado do servidor de sincronização. As tuas viagens continuam aqui.',
  serverSettings: 'Definições do servidor de sincronização',
  couldntSync: (ago, reason) => `Não foi possível sincronizar${ago ? ` (da última vez ${ago})` : ''}: ${reason}`,
  savedWillGoUp: (n) => `${plural(n, 'alteração guardada', 'alterações guardadas')} aqui ${n === 1 ? 'será enviada' : 'serão enviadas'} quando o servidor estiver acessível.`,
  synced: (ago) => `✅ Sincronizado ${ago}`,
  waitingFirstSync: 'A aguardar a primeira sincronização…',
  toSend: (n) => `${plural(n, 'alteração', 'alterações')} por enviar`,
  refused: (n, reason) =>
    `O servidor recusou ${plural(n, 'alteração', 'alterações')}: ${reason} ${n === 1 ? 'Fica' : 'Ficam'} neste telemóvel e ${n === 1 ? 'é enviada' : 'são enviadas'} outra vez em cada sincronização, por isso atualizar o servidor pode resolver.`,
  syncing: 'A sincronizar…',
  syncNow: '🔄 Sincronizar agora',
  noLongerOnTrip:
    'Já não estás nesta viagem no servidor de sincronização: alguém te retirou dela, ou foste removido do servidor. A tua cópia fica neste telemóvel, e os links continuam a trazer-te as alterações do grupo.',
  tripIsOnServer: (name) => `🌐 “${name}” está no servidor.`,
  backToTrip: 'Voltar à viagem',
  connectFirst: 'Liga primeiro este telemóvel a um servidor de sincronização.',
  putTripOnServer: (name) => `Pôr “${name}” no servidor`,
  moveIntro:
    'Indica quem é cada viajante no servidor. Recebem a viagem, e todas as alterações a seguir, automaticamente. Quem não está no servidor continua a receber links, e os links já enviados continuam a funcionar.',
  whosWho: 'Quem é quem',
  chooseWhichYouAre: 'Escolhe qual dos viajantes és tu: o servidor só mostra a viagem às pessoas que estão nele.',
  moveNote:
    'Só as pessoas ligadas aqui podem ver a viagem no servidor. Se não for possível contactar o servidor agora, a viagem é enviada da próxima vez que for.',
  moveFilesNote: 'As fotos e os documentos também são enviados, e os outros no servidor veem-nos. Os marcados como “só neste telemóvel” ficam aqui.',
}
