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
  whatWasItFor: 'What was it for?',
  enterAmount: 'Enter the amount, like 12.50.',
  chooseDay: 'Choose the day.',
  checkBankCharge: (currency: string): string => `Check what the bank charged in ${currency}, like 12.50.`,
  fillInBoth: 'Fill in both what you got and what it cost, or leave both empty to add the rate later.',
  checkExchangeAmounts: 'Check the exchange amounts.',
  chooseWhoReceived: 'Choose who received the money.',
  chooseWhoFor: 'Choose who it was for.',
  amountsAddUp: (sum: string, amount: string): string => `The amounts add up to ${sum}, not ${amount}.`,
  editPayment: 'Edit payment',
  newPayment: 'New payment',
  editExpense: 'Edit expense',
  newExpense: 'New expense',
  whatFor: 'What for',
  whatForPlaceholder: 'Dinner, tickets, taxi…',
  amount: 'Amount',
  currency: 'Currency',
  owesSentence: (from: string, to: string, amount: string): string => `${from} owes ${to} ${amount}.`,
  stillOwed: (amount: string): string => `${amount} will still be owed after this.`,
  partIsFine: 'Paying part of it is fine: the rest stays owed.',
  paidWith: 'Paid with',
  cardOrBank: 'Card or bank',
  notNotedFor: (transfer: boolean): string => `Not noted for this ${transfer ? 'payment' : 'expense'}.`,
  convertedAt: (rate: ReactNode, approx: string | undefined) => (
    <>
      Converted at {rate}, what your exchanges got
      {approx && <>: {approx}</>}.
    </>
  ),
  bankChargedLabel: (currency: string): string => `What the bank charged (${currency}, fees included)`,
  bankChargedHint: (approx: string | undefined): string =>
    `Not in your bank app yet? Leave it empty and add it later: it's marked "cost pending" until then${approx ? `, and counts at your cash rate (${approx})` : ''}.`,
  notKnownYet: 'Not known yet',
  exchangeRateFor: (currency: string): string => `Exchange rate for ${currency}`,
  whatDidYouGet: 'What did you get for your money?',
  youGot: 'You got',
  forCost: 'for',
  codeYouGot: (currency: string): string => `${currency} you got`,
  whatItCostIn: (currency: string): string => `What it cost in ${currency}`,
  withdrawalNote: (approx: string | undefined, currency: string): string =>
    `${approx ? `${approx}. ` : ''}A cash withdrawal or money changed, fees included. It's saved as the ${currency} rate for the whole trip, so you only enter it once. Leave it empty to add it later in Money.`,
  category: 'Category',
  paidBy: 'Paid by',
  from: 'From',
  to: 'To',
  split: 'Split',
  forWhom: 'For whom',
  splitEqually: 'Split equally',
  exactAmounts: 'Exact amounts',
  eachFor: (amount: string, n: number): string => `${amount} each, for ${plural(n, 'person', 'people')}.`,
  partOf: (name: string): string => `${name}'s part`,
  leftToAssign: (amount: string): string => `${amount} left to assign.`,
  settleUpPayment: 'Settle-up payment',
  waitingForBank: 'Waiting for what the bank charged.',
  untilThenCounts: (amount: string): string => `Until then it counts at your cash rate: ≈ ${amount}.`,
  notCountedUntilThen: "It isn't counted until then.",
  addIt: 'Add it',
  chargedByBank: (amount: string, tripCurrency: string, rate: string, currency: string): string =>
    `${amount} charged by the bank (1 ${tripCurrency} = ${rate} ${currency})`,
  atRate: (amount: string, tripCurrency: string, rate: string, currency: string): string => `≈ ${amount} at 1 ${tripCurrency} = ${rate} ${currency}`,
  itsOwnRate: ' (its own rate)',
  whatExchangesGot: ', what your exchanges got',
  notCountedYet: (currency: string): string => `Not counted yet: there's no rate for ${currency}.`,
  addWhatYouGot: 'Add what you got for your money',
  ownCurrency: "That's the trip's own currency. Choose the one you got.",
  enterHowMuch: (currency: string): string => `Enter how much ${currency} you got.`,
  enterWhatItCost: (currency: string): string => `Enter what it cost in ${currency}, fees included.`,
  deleteExchangeConfirm: (currency: string): string => `Delete this exchange? Expenses in ${currency} will convert without it.`,
  editExchange: 'Edit exchange',
  moneyChanged: 'Money changed',
  exchangeIntro:
    'Withdrew cash or changed money? Note what you got and what it cost, fees included. Every expense in that currency is then converted at that rate, and several exchanges are averaged.',
  amountYouGot: 'Amount you got',
  currencyYouGot: 'Currency you got',
  itCost: (currency: string): string => `It cost (${currency}, fees included)`,
  who: 'Who',
  exchangeNotesPlaceholder: 'Airport cash machine, exchange office…',
  deleteExchange: 'Delete exchange',
  recordPayment: 'Record payment',
  paidTo: (payer: string, names: string): string => `${payer} paid ${names}`,
  paidForOne: (payer: string, name: string): string => `${payer} paid · for ${name}`,
  paidSplitEveryone: (payer: string): string => `${payer} paid · split by everyone`,
  paidSplitWays: (payer: string, n: number): string => `${payer} paid · split ${n} ways`,
}
