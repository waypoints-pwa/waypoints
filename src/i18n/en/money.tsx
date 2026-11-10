import type { ReactNode } from 'react'
import { plural } from '../plural'

export const money = {
  payment: 'Payment',
  cash: 'Cash',
  card: 'Card',
  spentSoFar: 'Spent so far',
  addExpense: '+ Expense',
  yourPart: (amount: string): string => `Your part: ${amount}`,
  cardAndCash: (card: ReactNode, cash: ReactNode) => (
    <>
      Card {card} · Cash {cash}
    </>
  ),
  notNoted: (amount: ReactNode) => <>· Not noted {amount}</>,
  addRateLink: '💱 Changed money or withdrew cash abroad? Add the rate you got',
  balances: 'Balances',
  addPayment: '+ Payment',
  chooseOnTripTab: (tab: ReactNode) => <>Choose on the {tab} tab.</>,
  getsBack: (amount: string): string => `gets back ${amount}`,
  owes: (amount: string): string => `owes ${amount}`,
  square: 'square',
  settleUp: 'Settle up',
  everyoneSquare: 'Everyone is square. 🎉',
  estimates: (n: number): string =>
    `${plural(n, 'card payment')} ${n === 1 ? 'is an estimate' : 'are estimates'} until what the bank charged is added, so these amounts can still change a little.`,
  expenses: 'Expenses',
  noExpenses: (group: boolean): string => `Note what you spend, in any currency.${group ? ' waypoints works out who owes whom.' : ''}`,
  ratesTitle: '💱 Exchange rates',
  addExchange: '+ Exchange',
  cantBeCounted: (n: number, currencies: string): string =>
    `${plural(n, 'expense')} in ${currencies} can't be counted yet. Add what you got for your money (a cash withdrawal, say) and they're converted.`,
  cardsWaiting: (n: number, yours: number, chip: ReactNode) => (
    <>
      {`${plural(n, 'card payment')} ${n === 1 ? 'is' : 'are'} waiting for what the bank charged${yours > 0 ? ` (${yours === n ? (yours === 1 ? "it's yours" : 'all yours') : `${yours} of them yours`})` : ''}. Until then, ${n === 1 ? 'it counts' : 'they count'} at your cash rate, if there is one. Look for `}
      {chip} below.
    </>
  ),
  costPending: 'cost pending',
  noRateYet: 'no rate yet',
  averageOf: (count: number): string => `· average of ${count} exchanges`,
  whatYouGot: '· what you got',
  cashLeftMissing: (amount: ReactNode) => <>Cash left: {amount} (more cash spent than changed: an exchange may be missing)</>,
  cashLeft: (amount: ReactNode) => <>Cash left: {amount}</>,
  exchangeFor: (amount: string, cost: string): string => `${amount} for ${cost}`,
  ratesNote: 'Cash converts at the rate you actually got, fees included. Card payments convert at what the bank charged.',
  pays: (from: ReactNode, to: ReactNode) => (
    <>
      {from} pays {to}
    </>
  ),
  recordPayment: 'Record payment',
  paidTo: (payer: string, names: string): string => `${payer} paid ${names}`,
  paidForOne: (payer: string, name: string): string => `${payer} paid · for ${name}`,
  paidSplitEveryone: (payer: string): string => `${payer} paid · split by everyone`,
  paidSplitWays: (payer: string, n: number): string => `${payer} paid · split ${n} ways`,
}
