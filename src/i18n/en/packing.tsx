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
}
