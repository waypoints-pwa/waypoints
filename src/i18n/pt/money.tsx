import type { Messages } from '../en'

export const money: Messages['money'] = {
  payment: 'Pagamento',
  cash: 'Dinheiro',
  card: 'Cartão',
  spentSoFar: 'Gasto até agora',
  addExpense: '+ Despesa',
  yourPart: (amount) => `A tua parte: ${amount}`,
  cardAndCash: (card, cash) => (
    <>
      Cartão {card} · Dinheiro {cash}
    </>
  ),
  notNoted: (amount) => <>· Sem indicação {amount}</>,
  addRateLink: '💱 Trocaste dinheiro ou levantaste dinheiro no estrangeiro? Adiciona a taxa que obtiveste',
  balances: 'Saldos',
  addPayment: '+ Pagamento',
  chooseOnTripTab: (tab) => <>Escolhe no separador {tab}.</>,
  getsBack: (amount) => `recebe ${amount}`,
  owes: (amount) => `deve ${amount}`,
  square: 'contas certas',
  settleUp: 'Acertar contas',
  everyoneSquare: 'Está tudo certo. 🎉',
  estimates: (n) =>
    `${n === 1 ? '1 pagamento com cartão é uma estimativa' : `${n} pagamentos com cartão são estimativas`} até se juntar o que o banco cobrou, por isso estes valores ainda podem mudar um pouco.`,
  expenses: 'Despesas',
  noExpenses: (group) => `Regista o que gastas, em qualquer moeda.${group ? ' O waypoints calcula quem deve a quem.' : ''}`,
  ratesTitle: '💱 Taxas de câmbio',
  addExchange: '+ Câmbio',
  cantBeCounted: (n, currencies) =>
    n === 1
      ? `1 despesa em ${currencies} ainda não pode ser contada. Junta o que obtiveste pelo teu dinheiro (um levantamento, por exemplo) e passa a ser convertida.`
      : `${n} despesas em ${currencies} ainda não podem ser contadas. Junta o que obtiveste pelo teu dinheiro (um levantamento, por exemplo) e passam a ser convertidas.`,
  cardsWaiting: (n, yours, chip) => (
    <>
      {`${n === 1 ? '1 pagamento com cartão está' : `${n} pagamentos com cartão estão`} à espera do que o banco cobrou${yours > 0 ? ` (${yours === n ? (yours === 1 ? 'é teu' : 'são todos teus') : yours === 1 ? '1 é teu' : `${yours} são teus`})` : ''}. Até lá, ${n === 1 ? 'conta' : 'contam'} à tua taxa de dinheiro, se houver. Procura `}
      {chip} abaixo.
    </>
  ),
  costPending: 'custo pendente',
  noRateYet: 'ainda sem taxa',
  averageOf: (count) => `· média de ${count} câmbios`,
  whatYouGot: '· o que obtiveste',
  cashLeftMissing: (amount) => <>Dinheiro que sobra: {amount} (mais dinheiro gasto do que trocado: pode faltar um câmbio)</>,
  cashLeft: (amount) => <>Dinheiro que sobra: {amount}</>,
  exchangeFor: (amount, cost) => `${amount} por ${cost}`,
  ratesNote: 'O dinheiro converte-se à taxa que realmente obtiveste, comissões incluídas. Os pagamentos com cartão convertem-se ao que o banco cobrou.',
  pays: (from, to) => (
    <>
      {from} paga a {to}
    </>
  ),
  recordPayment: 'Registar pagamento',
  paidTo: (payer, names) => `${payer} pagou a ${names}`,
  paidForOne: (payer, name) => `${payer} pagou · para ${name}`,
  paidSplitEveryone: (payer) => `${payer} pagou · dividido por todos`,
  paidSplitWays: (payer, n) => `${payer} pagou · dividido em ${n}`,
}
