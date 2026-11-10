import type { Messages } from '../en'
import { plural } from '../plural'

export const settings: Messages['settings'] = {
  title: 'Definições',
  backupDownloaded: 'Cópia de segurança descarregada.',
  imported: (trips, summary) => `Importação concluída, ${plural(trips, 'viagem', 'viagens')}: ${summary}.`,
  importFailed: 'A importação falhou.',

  yourName: 'O teu nome',
  nameHint: 'Sugerido como primeiro viajante nas viagens novas. Fica neste telemóvel.',

  addressSearch: 'Pesquisa de moradas',
  addressSearchText:
    'As cidades e os aeroportos vêm com a app, por isso pesquisá-los funciona offline. As moradas não: são demasiadas. Os campos de morada sugerem as que já estão na viagem, como a da tua estadia para uma atividade lá.',
  searchOnline: 'Pesquisar também moradas online',
  searchOnlineHint:
    'O que escreves num campo de morada vai para o Photon, uma pesquisa gratuita do OpenStreetMap gerida pela komoot (Alemanha), sem conta. Precisa de internet. Só para este telemóvel.',

  syncServer: 'Servidor de sincronização',
  connectedAs: (name, host, disconnected) => (
    <>
      🌐 Ligado como {name} a {host}
      {disconnected ? ', mas este telemóvel foi desligado.' : '.'}
    </>
  ),
  serverOptional: 'Opcional. Com um servidor waypoints, as viagens que lá puseres chegam sozinhas aos outros que o usam, sem enviar links.',
  serverSettings: 'Definições do servidor',
  connectToServer: 'Ligar a um servidor',

  backupTransfer: 'Cópia de segurança e transferência',
  backupText:
    'As tuas viagens ficam guardadas neste telemóvel. Exporta um ficheiro de cópia de segurança para as manteres a salvo ou para as passares para outro telemóvel, e importa-o lá. A importação junta: cada item fica com a versão mais recente, por isso importar um ficheiro duas vezes não muda nada.',
  backupFilesText:
    'As fotos e os documentos deixariam os ficheiros de cópia de segurança enormes, por isso não vão neles (só os nomes e as legendas). Os que estão num servidor de sincronização voltam a partir dele.',
  exportAll: '⬇️ Exportar todas as viagens',
  importFile: '⬆️ Importar um ficheiro',
  safetyCopies: (n) => `Cópias de salvaguarda (${n})`,
  safetyCopiesText:
    'Guardadas automaticamente antes de eliminares uma viagem ou de a substituíres pelas alterações de outra pessoa. Descarrega uma e importa-a para recuperares tudo.',
  download: 'Descarregar',

  storage: 'Armazenamento',
  storageUsed: (size) => `O waypoints usa ${size} neste telemóvel, incluindo fotos e documentos.`,
  storagePersistent: '✅ O armazenamento é persistente: o navegador não vai apagar as tuas viagens para libertar espaço.',
  storageMayClear:
    'O navegador pode apagar os dados dos sites quando o espaço escasseia (sobretudo no iPhone). Adicionar o waypoints ao ecrã principal e permitir o armazenamento persistente torna isto muito menos provável, mas mantém uma cópia de segurança na mesma.',
  requestPersistent: 'Pedir armazenamento persistente',

  updates: 'Atualizações',
  updatesText: 'O waypoints atualiza-se sozinho. Vê o que mudou em cada versão.',
  whatsNew: '✨ Novidades',

  about: 'Acerca de',
  aboutVersion: (version, github) => <>waypoints v{version} · código aberto · {github}</>,
  howToUse: 'Como usar o waypoints',
  aboutGuide: (guide) => <>📖 {guide}</>,
  privacyText:
    'Sem conta, sem rastreio, sem anúncios. As tuas viagens ficam neste telemóvel e só saem dele nos links e ficheiros que escolheres enviar, e nas viagens que puseres num servidor de sincronização, se te ligares a um. Os mapas e os calendários abrem nas suas próprias apps; sem servidor, o waypoints nunca se liga a nada, a não ser que ativares a pesquisa de moradas online.',
  dataCredits: (geonames, ourAirports, mwgg) => (
    <>
      Dados de cidades e fusos horários da {geonames} (CC BY 4.0); aeroportos da {ourAirports} e da {mwgg}.
    </>
  ),
}
