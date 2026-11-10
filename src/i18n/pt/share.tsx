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
}
