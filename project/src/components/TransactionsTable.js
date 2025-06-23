import { el, setChildren } from 'redom';

export default class TransactionsTable {
  constructor(accountNumber, container, onRowClick) {
    this.container = container;
    console.log('container');
    console.log(this.container);
    this.transactions = [];
    this.showAll = false;
    this.onRowClick = onRowClick;
    this.accountNumber = accountNumber; // Сохраняем accountNumber
    console.log(this.accountNumber);
  }
  update(transactions) {
    this.transactions = transactions;
    this.showAll = false;
    this.render();
  }

  render() {
    console.log('render');
    // Очищаем контейнер перед обновлением
    this.container.innerHTML = '';

    // Создаем таблицу
    const table = el('table', { class: 'table' }, [
      el('thead', { class: 'table-header' }, [
        el('tr',  [
          el('th', 'Счет отправителя'),
          el('th', 'Счет получателя'),
          el('th', 'Сумма'),
          el('th', 'Дата'),
        ]),
      ]),
      el('tbody', this.getVisibleTransactions().map(transaction => {
        const isIncoming = transaction.to == this.accountNumber; // Входящая транзакция
        const isOutgoing = transaction.from == this.accountNumber; // Входящая транзакция
        const amountClass = isIncoming ? 'incoming' : isOutgoing ? 'outgoing' : 'neutral'; // Класс для суммы
        const amountSign = isIncoming ? '+' : '-'; // Знак суммы
        return el('tr', { 
          onclick: () => this.handleRowClick(transaction),
        }, [
          el('td', { 'data-label': 'Счет отправителя' }, `${transaction.from}`),
          el('td', { 'data-label': 'Счет получателя' }, `${transaction.to}`),
          el('td', { class: amountClass }, `${amountSign}${transaction.amount} ₽`),
          el('td', { 'data-label': 'Дата' }, new Date(transaction.date).toLocaleString()),
        ]) 
      }
      )),
    ]);
    // Добавляем кнопку "Показать все", если транзакций больше 3
    if (this.transactions.length > 3 && !this.showAll) {
      const showMoreButton = el('button', { 
        class: 'show-more-button', 
        onclick: () => this.showAllTransactions() 
      }, 'Показать все');
      setChildren(this.container, [table, showMoreButton]);
    } else {
      setChildren(this.container, [table]);
    }
  }
  // Получаем те транзакции которые видим либо 3 либо все
  getVisibleTransactions() {
    return this.showAll ? this.transactions : this.transactions.slice(0, 3);
  }
  // Показываем все транзакции по клику
  showAllTransactions = () => {
    this.showAll = true;
    this.render();
  };
  // Обработка клика для отображения всех транзакций
  handleRowClick(transaction) {
    if (this.onRowClick) {
      this.onRowClick(transaction);
    }
  }
}