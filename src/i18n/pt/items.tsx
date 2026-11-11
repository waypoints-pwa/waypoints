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
  deleteForOthers: 'Se partilhares a viagem, a eliminação também vale para os outros.',
  gone: 'Isto já não está na viagem. Alguém pode tê-lo eliminado.',
  couldntSave: 'Não foi possível guardar. Tenta outra vez.',
  directions: '🧭 Direções',
  addToGoogleCalendar: '📅 Adicionar ao Google Calendar',
  calendarFile: '📅 Ficheiro de calendário (.ics)',
  call: '📞 Ligar',
  layoverUnknown: 'Duração da escala desconhecida',
  layover: (duration, place) => `Escala de ${duration} em ${place}`,
  legLeavesFrom: (next, from, prev, place) => `O trajeto ${next} parte de ${from}, mas o trajeto ${prev} chega a ${place}`,
  legLeavesBefore: (next, prev) => `O trajeto ${next} parte antes de o trajeto ${prev} chegar`,
}
