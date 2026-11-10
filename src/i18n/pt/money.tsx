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
    `${n === 1 ? '1 pagamento com cartão é uma estimativa' : `${n} pagamentos com cartão são estimativas`} até se adicionar o que o banco cobrou, por isso estes valores ainda podem mudar um pouco.`,
  expenses: 'Despesas',
  noExpenses: (group) => `Regista o que gastas, em qualquer moeda.${group ? ' O waypoints calcula quem deve a quem.' : ''}`,
  ratesTitle: '💱 Taxas de câmbio',
  addExchange: '+ Câmbio',
  cantBeCounted: (n, currencies) =>
    n === 1
      ? `1 despesa em ${currencies} ainda não pode ser contada. Adiciona o que obtiveste pelo teu dinheiro (um levantamento, por exemplo) e passa a ser convertida.`
      : `${n} despesas em ${currencies} ainda não podem ser contadas. Adiciona o que obtiveste pelo teu dinheiro (um levantamento, por exemplo) e passam a ser convertidas.`,
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
  whatWasItFor: 'Para quê?',
  enterAmount: 'Indica o valor, por exemplo 12.50.',
  chooseDay: 'Escolhe o dia.',
  checkBankCharge: (currency) => `Verifica o que o banco cobrou em ${currency}, por exemplo 12.50.`,
  fillInBoth: 'Preenche o que obtiveste e o que custou, ou deixa os dois vazios para adicionar a taxa mais tarde.',
  checkExchangeAmounts: 'Verifica os valores do câmbio.',
  chooseWhoReceived: 'Escolhe quem recebeu o dinheiro.',
  chooseWhoFor: 'Escolhe para quem foi.',
  amountsAddUp: (sum, amount) => `Os valores somam ${sum}, não ${amount}.`,
  editPayment: 'Editar pagamento',
  newPayment: 'Novo pagamento',
  editExpense: 'Editar despesa',
  newExpense: 'Nova despesa',
  whatFor: 'Para quê',
  whatForPlaceholder: 'Jantar, bilhetes, táxi…',
  amount: 'Valor',
  currency: 'Moeda',
  owesSentence: (from, to, amount) => `${from} deve ${amount} a ${to}.`,
  stillOwed: (amount) => `Depois disto, ainda ficam por pagar ${amount}.`,
  partIsFine: 'Pagar só uma parte não faz mal: o resto continua em dívida.',
  paidWith: 'Pago com',
  cardOrBank: 'Cartão ou banco',
  notNotedFor: (transfer) => `Sem indicação para ${transfer ? 'este pagamento' : 'esta despesa'}.`,
  convertedAt: (rate, approx) => (
    <>
      Convertido a {rate}, o que os teus câmbios obtiveram
      {approx && <>: {approx}</>}.
    </>
  ),
  bankChargedLabel: (currency) => `O que o banco cobrou (${currency}, comissões incluídas)`,
  bankChargedHint: (approx) =>
    `Ainda não está na app do banco? Deixa vazio e adiciona mais tarde: fica marcado como "custo pendente" até lá${approx ? `, e conta à tua taxa de dinheiro (${approx})` : ''}.`,
  notKnownYet: 'Ainda não se sabe',
  exchangeRateFor: (currency) => `Taxa de câmbio de ${currency}`,
  whatDidYouGet: 'O que obtiveste pelo teu dinheiro?',
  youGot: 'Obtiveste',
  forCost: 'por',
  codeYouGot: (currency) => `${currency} obtidos`,
  whatItCostIn: (currency) => `Quanto custou em ${currency}`,
  withdrawalNote: (approx, currency) =>
    `${approx ? `${approx}. ` : ''}Um levantamento ou uma troca de dinheiro, comissões incluídas. Fica guardado como a taxa de ${currency} para toda a viagem, por isso só a indicas uma vez. Deixa vazio para adicionar mais tarde em Dinheiro.`,
  category: 'Categoria',
  paidBy: 'Pago por',
  from: 'De',
  to: 'Para',
  split: 'Divisão',
  forWhom: 'Para quem',
  splitEqually: 'Dividir por igual',
  exactAmounts: 'Valores exatos',
  eachFor: (amount, n) => `${amount} cada, para ${n === 1 ? '1 pessoa' : `${n} pessoas`}.`,
  partOf: (name) => `Parte de ${name}`,
  leftToAssign: (amount) => `${amount} por atribuir.`,
  settleUpPayment: 'Pagamento para acertar contas',
  waitingForBank: 'À espera do que o banco cobrou.',
  untilThenCounts: (amount) => `Até lá conta à tua taxa de dinheiro: ≈ ${amount}.`,
  notCountedUntilThen: 'Até lá não é contada.',
  addIt: 'Adicionar',
  chargedByBank: (amount, tripCurrency, rate, currency) => `${amount} cobrados pelo banco (1 ${tripCurrency} = ${rate} ${currency})`,
  atRate: (amount, tripCurrency, rate, currency) => `≈ ${amount} a 1 ${tripCurrency} = ${rate} ${currency}`,
  itsOwnRate: ' (taxa própria)',
  whatExchangesGot: ', o que os teus câmbios obtiveram',
  notCountedYet: (currency) => `Ainda não é contada: não há taxa para ${currency}.`,
  addWhatYouGot: 'Adiciona o que obtiveste pelo teu dinheiro',
  ownCurrency: 'Essa é a moeda da própria viagem. Escolhe a que obtiveste.',
  enterHowMuch: (currency) => `Indica quanto ${currency} obtiveste.`,
  enterWhatItCost: (currency) => `Indica quanto custou em ${currency}, comissões incluídas.`,
  deleteExchangeConfirm: (currency) => `Eliminar este câmbio? As despesas em ${currency} passam a ser convertidas sem ele.`,
  editExchange: 'Editar câmbio',
  moneyChanged: 'Novo câmbio',
  exchangeIntro:
    'Levantaste dinheiro ou trocaste dinheiro? Indica o que obtiveste e quanto custou, comissões incluídas. Todas as despesas nessa moeda são então convertidas a essa taxa, e vários câmbios fazem média.',
  amountYouGot: 'Valor obtido',
  currencyYouGot: 'Moeda obtida',
  itCost: (currency) => `Custou (${currency}, comissões incluídas)`,
  who: 'Quem',
  exchangeNotesPlaceholder: 'Multibanco do aeroporto, casa de câmbio…',
  deleteExchange: 'Eliminar câmbio',
  recordPayment: 'Registar pagamento',
  paidTo: (payer, names) => `${payer} pagou a ${names}`,
  paidForOne: (payer, name) => `${payer} pagou · para ${name}`,
  paidSplitEveryone: (payer) => `${payer} pagou · dividido por todos`,
  paidSplitWays: (payer, n) => `${payer} pagou · dividido em ${n}`,
}
