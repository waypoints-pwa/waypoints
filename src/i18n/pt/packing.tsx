import type { Messages } from '../en'

export const packing: Messages['packing'] = {
  whoIsBringing: 'Quem leva',
  nobodyYet: 'Ninguém ainda',
  title: 'Bagagem e tarefas',
  empty: 'Ainda não há nada aqui',
  progress: (packed, total) => `${packed} de ${total} na mala`,
  packedLabel: (text) => `Na mala: ${text}`,
  addFromTemplate: 'Adicionar a partir de um modelo',
  addAnItem: 'Adicionar um item',
  item: 'Item',
  deleteConfirm: 'Eliminar este item?',
  templates: {
    beach: {
      label: 'Praia',
      items: ['Protetor solar', 'Fato de banho', 'Toalha de praia', 'Óculos de sol', 'Chinelos', 'Chapéu', 'Garrafa de água', 'Saco de praia', 'Creme pós-solar', 'Máscara de snorkel'],
    },
    city: {
      label: 'Cidade',
      items: ['Carregador do telemóvel', 'Power bank', 'Sapatos confortáveis', 'Guarda-chuva', 'Mochila pequena', 'Adaptador de tomada', 'Máquina fotográfica', 'Mapas offline', 'Garrafa de água reutilizável', 'Medicamentos'],
    },
    hiking: {
      label: 'Caminhada',
      items: ['Botas de caminhada', 'Impermeável', 'Garrafa de água', 'Snacks para o caminho', 'Kit de primeiros socorros', 'Lanterna frontal', 'Chapéu de sol', 'Mapa e bússola', 'Agasalho', 'Pensos para bolhas'],
    },
    skiing: {
      label: 'Esqui',
      items: ['Casaco de esqui', 'Calças de esqui', 'Luvas', 'Óculos de esqui', 'Roupa térmica', 'Capacete', 'Meias de esqui', 'Batom de cieiro', 'Gola térmica', 'Forfait'],
    },
  },
}
