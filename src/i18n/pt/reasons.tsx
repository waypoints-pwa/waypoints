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
