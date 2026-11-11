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

const SERVER_REASONS: Record<string, string> = {
  badRequest: 'O servidor não percebeu o pedido.',
  requestTooLarge: 'O pedido é demasiado grande para o servidor.',
  tooManyTrips: 'Demasiadas viagens numa só sincronização.',
  tooManyRecords: 'Demasiados dados numa só sincronização.',
  tooManyWrongCodes: 'Demasiados códigos errados. Tenta outra vez daqui a uns minutos.',
  wrongServerCode: 'Código do servidor errado',
  notConnected: 'Este telemóvel não está (ou já não está) ligado a este servidor',
  nameNeeded: 'Falta o teu nome',
  personGone: 'Essa pessoa já não está no servidor',
  codePersonGone: 'A pessoa a quem se destinava esse código já não está no servidor',
  inviteInvalid: 'Esse convite não é válido. Pede um novo.',
  inviteExpired: 'Esse convite expirou. Pede um novo.',
  noSuchTrip: 'Essa viagem não existe',
  noSuchFile: 'Essa foto ou documento não existe',
  previewTooLarge: 'A pré-visualização é demasiado grande',
  fileMismatch: 'O ficheiro não é o que foi adicionado',
  fileNotYet: 'O servidor ainda não tem esse ficheiro',
  notGoogle: 'Isso não é um link do Google Maps.',
  googleNoAnswer: 'O Google Maps não respondeu.',
  googleUnreadable: 'O Google Maps respondeu algo que este servidor não consegue ler.',
  listNotShared: 'Esta lista não está partilhada ou não existe.',
  notPlaceOrList: 'Esse link não é de um local nem de uma lista.',
  adminOnlyInvite: 'Só o administrador do servidor pode convidar pessoas novas',
  adminOnlySignIn: 'Só o administrador do servidor pode dar acesso ao telemóvel de outra pessoa',
  adminOnlyRemove: 'Só o administrador do servidor pode remover pessoas',
  personNotOnServer: 'Essa pessoa não está no servidor',
  noSuchPhone: 'Esse telemóvel não existe',
  cantRemoveYourself: 'Não te podes remover do servidor',
  notFound: 'Não encontrado',
  internalError: 'Erro interno do servidor',
}

export const reasons: Messages['reasons'] = {
  server: (answer) => {
    const { code, name, mb } = answer
    if (code === undefined) return answer.error
    if (code === 'nameTaken' || code === 'nameTakenInvite') {
      if (typeof name !== 'string') return answer.error
      return code === 'nameTaken'
        ? `Já há alguém chamado ${name} no servidor. Se és tu, escolhe antes o teu nome na lista.`
        : `Já há alguém chamado ${name} no servidor. Se és tu, pede antes um link de acesso ao administrador.`
    }
    if (code === 'fileTooLarge') return typeof mb === 'number' ? `Este servidor aceita ficheiros até ${mb} MB` : answer.error
    return (Object.hasOwn(SERVER_REASONS, code) ? SERVER_REASONS[code] : undefined) ?? answer.error
  },
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
      case 'privateFile':
        return 'Fica só no telemóvel onde foi adicionado.'
      case 'fileChanged':
        return 'O ficheiro de uma foto ou documento não pode ser alterado.'
      case 'otherTrip':
        return 'Pertence a outra viagem.'
      case 'serverTooOld':
        return 'Este servidor é demasiado antigo para isto: atualiza o servidor.'
      default:
        return err.message
    }
  },
}
