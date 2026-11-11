import type { Messages } from '../en'
import { plural } from '../plural'

export const share: Messages['share'] = {
  counts: (n) => [
    plural(n.stays, 'estadia', 'estadias'),
    plural(n.journeys, 'trajeto', 'trajetos'),
    plural(n.activities, 'atividade', 'atividades'),
    plural(n.places, 'local', 'locais'),
    plural(n.expenses, 'despesa', 'despesas'),
  ],
  shareText: (who, tripName) =>
    `${who ? `${who} partilhou` : 'Aqui está'} “${tripName}” no waypoints. Abre o link para adicionar a viagem ou para atualizar a tua cópia:`,
  serverNote: (onServer, others) =>
    `🌐 Esta viagem está no servidor de sincronização, por isso ${onServer.join(', ')} ${onServer.length === 1 ? 'recebe' : 'recebem'} todas as alterações automaticamente. ${
      others.length
        ? `Envia este link a ${others.join(', ')}, que ${others.length === 1 ? 'não está' : 'não estão'} no servidor.`
        : 'Um link continua a ser útil para quem não está no servidor.'
    }`,
  longLink: (characters) =>
    `Esta viagem gera um link longo (${characters} carateres). Algumas apps de conversa cortam links longos: se não abrir para alguém, envia-lhe o ficheiro.`,
  intro:
    'Cada pessoa guarda a sua própria cópia da viagem no telemóvel. Envia este link na conversa de grupo: ao abri-lo, a viagem é adicionada ou uma cópia existente é atualizada. Quando alguém alterar alguma coisa, envia um link de volta da mesma forma.',
  noServerInvolved: 'Não há nenhum servidor envolvido: a viagem inteira vai dentro do link.',
  mergedItemByItem:
    'As alterações são combinadas item a item, por isso nada do que alguém adiciona se perde. Se duas pessoas editarem o mesmo item, vence a última edição.',
  nameHint: 'Mostrado aos outros como quem enviou.',
  includesUnsent: (n) => `Inclui ${plural(n, 'alteração', 'alterações')} que os outros ainda não viram.`,
  shareTripLink: '🔗 Partilhar link da viagem',
  pasteIntoChat: 'Cola-o na conversa de grupo.',
  saveAsFile: '⬇️ Guardar como ficheiro',
  openLinkOrFile: 'Abrir um link ou ficheiro de viagem',
  anyoneWithLink: (openLinkOrFile) => (
    <>
      Quem tiver o link ou o ficheiro pode ver tudo nesta viagem, incluindo despesas e notas, e um link enviado não pode ser
      retirado. Os ficheiros abrem-se com {openLinkOrFile} na lista de viagens.
    </>
  ),
  unsentNotice: (n) => `✏️ ${plural(n, 'alteração', 'alterações')} que o grupo ainda não viu.`,
  sendUpdate: 'Enviar atualização',
  notATripLink: 'Isso não é um link de viagem do waypoints. Copia o link todo e tenta outra vez.',
  couldntPaste: 'Não foi possível colar. Mantém premida a caixa abaixo e escolhe Colar.',
  fileCouldntBeOpened: 'Não foi possível abrir esse ficheiro.',
  linkCouldntBeOpened: 'Não foi possível abrir este link.',
  openedTrips: (n, summary) => `${plural(n, 'viagem aberta', 'viagens abertas')}: ${summary}.`,
  openATrip: 'Abrir uma viagem',
  openIntro: 'Cola um link de viagem que alguém te enviou (ou um convite para um servidor de sincronização), ou abre um ficheiro do waypoints.',
  pasteTripLink: '📋 Colar link da viagem',
  tripLinkLabel: 'Link da viagem',
  openLink: 'Abrir link',
  openAFile: '📄 Abrir um ficheiro',
  sharedBy: (name) => (name ? `${name} partilhou uma viagem` : 'Uma viagem partilhada'),
  withPeople: (names) => `Com ${names}`,
  openTheTrip: 'Abrir a viagem',
  copyUpToDate: (summary) => `A tua cópia está atualizada: ${summary}.`,
  addToMyTrips: '+ Adicionar às minhas viagens',
  savedOnPhone: 'Fica guardada neste telemóvel. Os links que o grupo enviar mais tarde atualizam-na.',
  changesForCopy: (summary) => (
    <>
      Alterações para a tua cópia: <strong>{summary}</strong>.
    </>
  ),
  updateMyCopy: 'Atualizar a minha cópia',
  newestVersion: 'Cada item fica com a sua versão mais recente, por isso nada do que adicionaste se perde.',
  copyAlreadyHasAll: 'A tua cópia já tem tudo o que está neste link.',
  isOnYourPhone: (tripName) => `✓ “${tripName}” está no teu telemóvel`,
  notOnList: 'Não estás na lista? Adiciona-te',
  addMe: 'Adicionar-me',
  skipForNow: 'Agora não',
  openInApp: 'Abrir na app waypoints',
  safariKeeps:
    'O Safari guarda a sua própria cópia do waypoints, separada da app no teu ecrã principal. Isto copia o link para o poderes abrir lá.',
  copyThisLink: 'Copia este link',
  openFromHomeScreen: 'Abre o waypoints a partir do teu ecrã principal.',
  handOffOpenTripLink: 'Abrir um link ou ficheiro de viagem',
  tapThenPaste: (button) => (
    <>
      Toca em {button} e depois em Colar.
    </>
  ),
  noWaypointsYet: 'Ainda não tens o waypoints no ecrã principal? No Safari, toca em Partilhar → Adicionar ao ecrã principal primeiro.',
  useItHere: 'Usar aqui no Safari',
  copyLinkPrompt: 'Copia este link:',
}
