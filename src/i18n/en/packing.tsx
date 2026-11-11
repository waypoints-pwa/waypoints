export const packing = {
  whoIsBringing: "Who's bringing it",
  nobodyYet: 'Nobody yet',
  title: 'Packing & to-do',
  empty: 'Nothing here yet',
  progress: (packed: number, total: number): string => `${packed} of ${total} packed`,
  packedLabel: (text: string): string => `Packed: ${text}`,
  addFromTemplate: 'Add from a template',
  addAnItem: 'Add an item',
  item: 'Item',
  deleteConfirm: 'Delete this item?',
  templates: {
    beach: {
      label: 'Beach',
      items: ['Sunscreen', 'Swimsuit', 'Beach towel', 'Sunglasses', 'Flip-flops', 'Hat', 'Water bottle', 'Beach bag', 'After-sun lotion', 'Snorkel mask'],
    },
    city: {
      label: 'City',
      items: ['Phone charger', 'Power bank', 'Comfortable shoes', 'Umbrella', 'Daypack', 'Travel adapter', 'Camera', 'Offline maps', 'Reusable water bottle', 'Medication'],
    },
    hiking: {
      label: 'Hiking',
      items: ['Hiking boots', 'Rain jacket', 'Water bottle', 'Trail snacks', 'First-aid kit', 'Headlamp', 'Sun hat', 'Map and compass', 'Warm layer', 'Blister plasters'],
    },
    skiing: {
      label: 'Skiing',
      items: ['Ski jacket', 'Ski pants', 'Gloves', 'Goggles', 'Thermal base layer', 'Helmet', 'Ski socks', 'Lip balm', 'Neck warmer', 'Ski pass'],
    },
  },
}
