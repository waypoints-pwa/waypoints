import type { Messages } from '../en'

const INVALID_RECORD: Record<string, string> = {
  trips: 'uma viagem inválida',
  travellers: 'um viajante inválido',
  stays: 'uma estadia inválida',
  transports: 'um trajeto inválido',
  activities: 'uma atividade inválida',
  places: 'um local inválido',
  expenses: 'uma despesa inválida',
  exchanges: 'um câmbio inválido',
  reviews: 'uma avaliação inválida',
  packingItems: 'um item de bagagem inválido',
  votes: 'um voto inválido',
  attachments: 'uma foto ou um documento inválido',
  reports: 'um relatório inválido',
}

export const reasons: Messages['reasons'] = {
  notAServerAddress: 'Isto não é um endereço de servidor.',
  mustBeHttps: 'O endereço do servidor tem de começar por https://',
  unreachable: 'Não foi possível contactar o servidor. Verifica o endereço e se o Tailscale está ligado.',
  phoneNoLongerConnected: 'Este telemóvel já não está ligado ao servidor.',
  serverError: (status) => `Erro do servidor (${status}).`,
  notAWaypointsServer: 'Esse endereço não é de um servidor waypoints.',
  notConnected: 'Não estás ligado a um servidor.',
  notOnThatServer: 'Não estás no servidor desse endereço. É o mesmo servidor?',
  couldntLeave: 'Não foi possível sair da viagem no servidor. Tenta outra vez.',
  fileMismatch: 'O ficheiro vindo do servidor não é o que foi adicionado.',
  fileDeleted: 'Foi eliminado.',
  phoneNotConnected: 'Este telemóvel não está ligado ao servidor de sincronização.',
  notOnServerYet: 'Ainda não está no servidor: o telemóvel onde foi adicionado ainda não o enviou.',
  googleUnreachable: 'Não foi possível contactar o teu servidor waypoints. Cola o link em Link, abaixo, e escreve o nome.',
  googleOldServer: 'O teu servidor waypoints precisa de ser atualizado para ler links do Google Maps.',
  googleUnreadable: 'O Google Maps não deu os detalhes do local. Tenta mais tarde ou preenche à mão.',
  couldntShrinkPhoto: 'Este telemóvel não conseguiu reduzir a foto.',
  notAPhoto: (name) => `Não foi possível abrir ${name} neste telemóvel. É uma foto?`,
  emptyFile: (name) => `${name} está vazio.`,
  fileTooLarge: (name) => `${name} é demasiado grande: os documentos podem ter até 100 MB.`,
  googleListNotShared: 'Esta lista não está partilhada ou não existe.',
  data: (err) => {
    switch (err.code) {
      case 'dataMissing':
        return 'Faltam alguns dos seus dados.'
      case 'tooLarge':
        return 'É demasiado grande para abrir.'
      case 'notWaypointsFile':
        return 'Este ficheiro não é do waypoints.'
      case 'newerFile':
        return 'Este ficheiro foi feito por uma versão mais recente do waypoints. Atualiza a app e tenta outra vez.'
      case 'notTripLink':
        return 'Este link não é uma viagem do waypoints.'
      case 'newerLink':
        return 'Este link foi feito por uma versão mais recente do waypoints. Atualiza a app para o abrir.'
      case 'futureDated':
        return 'Tem alterações com data no futuro. Verifica a data e a hora do telemóvel que o enviou.'
      case 'incompleteLink':
        return 'Este link está incompleto. Pode ter sido cortado ao ser copiado: pede-o outra vez.'
      case 'invalidRecord':
        return `Contém ${(err.table !== undefined && Object.hasOwn(INVALID_RECORD, err.table) ? INVALID_RECORD[err.table] : undefined) ?? 'dados inválidos'}.`
      default:
        return err.message
    }
  },
}
