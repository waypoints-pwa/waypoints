import type { Messages } from '../en'

export const items: Messages['items'] = {
  editButton: '✏️ Editar',
  deleteConfirm: {
    stay: 'Eliminar esta estadia?',
    journey: 'Eliminar este trajeto?',
    activity: 'Eliminar esta atividade?',
    place: 'Eliminar este local?',
    expense: 'Eliminar esta despesa?',
    payment: 'Eliminar este pagamento?',
  },
  deleteForOthers: 'Também será eliminado para os outros quando partilhares a viagem.',
  gone: 'Isto já não está na viagem. Alguém pode tê-lo eliminado.',
  couldntSave: 'Não foi possível guardar. Tenta outra vez.',
  directions: '🧭 Direções',
  addToGoogleCalendar: '📅 Adicionar ao Google Calendar',
  calendarFile: '📅 Ficheiro de calendário (.ics)',
  call: '📞 Ligar',
  layoverUnknown: 'Duração da escala desconhecida',
  layover: (duration, place) => `Escala de ${duration} em ${place}`,
}
