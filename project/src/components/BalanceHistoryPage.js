import { el, setChildren } from 'redom';
import { Chart } from 'chart.js/auto';
import BalanceChart from './BalanceChart';
import TransactionsTable from './TransactionsTable'; 
import TransactionRatioChart from './TransactionRatioChart';
import arrowSvg from '!!raw-loader!../assets/arrow.svg';

export default class BalanceHistoryPage {
  constructor(accountNumber, onBack, authService) {
    this.onBack = onBack; // Функция для возврата
    this.authService = authService; // Сервис для загрузки данных
    this.accountNumber = accountNumber; // Номер счета, переданный через конструктор
    this.accountDetails = null; // Инициализируем accountDetails как null

    // Создаем DOM-элементы
        this.el = el('div', { class: 'balance-history-page' }, [
          el('div', { class:'balance-history-general' }, [
            el('div', { class: 'details-left'}, [
              el('h1', { class: 'details-left-h1'},  `История баланса:`),
              el('h2', { class: 'details-left-h2'}, `№ ${accountNumber}`),
            ]),
            el('div', { class: 'details-right' }, [
              el('button', { 
                class: 'back-button', 
                onclick: () => this.onBack() 
                }, [
                  el('span', { class: 'back-button-icon' }, [
                    el('span', { 
                      class: 'back-button-icon', 
                      innerHTML: arrowSvg // Встраиваем SVG как HTML
                    }),
                  ]),
                  el('span', { class: 'back-button-text' }, 'Вернуться назад'),
              ]),
              this.accountBalance =  el('div', { class: 'details-balance' })
            ]),
          ]),
          this.accountInfo = el('div', { class: 'account-info' }, [
            el('div', 'Загрузка данных...'), // Временный текст, пока данные загружаются
            this.balanceChart = el('div', { class: 'balance-chart-container'}),
            this.transactionRatioChartContainer = el('div', { class: 'transaction-ratio-container'}), // Контейнер для графика баланса
            this.transactionsContainer = el('div', { class: 'transactions-container' }), 
          ]),
        ]);

    // Инициализируем таблицу транзакций
    this.transactionsTable = new TransactionsTable(this.accountNumber, this.transactionsContainer, () => {});

    // Загружаем данные о счете
    this.loadAccountDetails();
  }
// Метод для отображения skeleton-лоадеров
showSkeleton() {
  setChildren(this.accountInfo, [
    el('div.skeleton.skeleton-chart.skeleton-block', [
      el('div.skeleton.skeleton-chart-header'),
      el('div.skeleton.skeleton-chart-content', [
        el('div.skeleton.skeleton-chart-axis'),
        el('div.skeleton.skeleton-chart-bars', [
          el('div.skeleton.skeleton-chart-bar'),
          el('div.skeleton.skeleton-chart-bar'),
          el('div.skeleton.skeleton-chart-bar'),
          el('div.skeleton.skeleton-chart-bar'),
          el('div.skeleton.skeleton-chart-bar'),
        ]),
      ]),
    ]),
    el('div.skeleton.skeleton-transactions.skeleton-block', [
      el('div.skeleton.skeleton-transactions-header'),
      el('div.skeleton.skeleton-transactions-content', [
        el('div.skeleton.skeleton-transaction-row', [
          el('div.skeleton.skeleton-transaction-cell'),
          el('div.skeleton.skeleton-transaction-cell'),
          el('div.skeleton.skeleton-transaction-cell'),
          el('div.skeleton.skeleton-transaction-cell'),
        ]),
        el('div.skeleton.skeleton-transaction-row', [
          el('div.skeleton.skeleton-transaction-cell'),
          el('div.skeleton.skeleton-transaction-cell'),
          el('div.skeleton.skeleton-transaction-cell'),
          el('div.skeleton.skeleton-transaction-cell'),
        ]),
        el('div.skeleton.skeleton-transaction-row', [
          el('div.skeleton.skeleton-transaction-cell'),
          el('div.skeleton.skeleton-transaction-cell'),
          el('div.skeleton.skeleton-transaction-cell'),
          el('div.skeleton.skeleton-transaction-cell'),
        ]),
      ]),
    ]),
  ]);
}
  // Метод для загрузки данных о счете
  async loadAccountDetails() {
    console.log('loadAccountDetails');
    this.showSkeleton(); // Показываем skeleton-лоадеры

    try {
      console.log('Загрузка данных о счете...');
      const accountDetails = await this.authService.fetchAccountDetails(this.accountNumber);

      this.accountDetails = accountDetails;
      this.updateDOM();
    } catch (error) {
      console.error('Ошибка при загрузке деталей счета:', error);
      this.balanceInfo.textContent = 'Не удалось загрузить данные о счете.';
    }
  }

  // Метод для обновления DOM после загрузки данных
  updateDOM() {
        // Обновляем баланс
        setChildren(this.accountBalance, [
          el('div', { class: 'details-balance-title'}, `Баланс`),
          el('div', `${this.accountDetails.balance} ₽`),
        ]);
    
        // Очищаем контейнер и добавляем новые элементы
        setChildren(this.accountInfo, [
            el('div', { class: 'details-row'}, [
              this.renderBalanceChart(),
              this.renderTransactionRatioChart(),
            ]),
            el('div', { class: 'transaction-table'}, [
              el('h1', { class: 'table-title'}, 'История переводов'),
              this.renderTransactionsTable(),
            ])
        ]);
  }

  // Метод для отрисовки графика изменений баланса
  renderBalanceChart() {
    const balanceChart = new BalanceChart({
      balance: this.accountDetails.balance,
      account: this.accountNumber,
      transactions: this.accountDetails.transactions,
    }, 12, false); // handleClick: false, чтобы клик не обрабатывался

    return balanceChart.el;
  }

  // Метод для отрисовки графика соотношения транзакций
  renderTransactionRatioChart() {
    const transactions = this.accountDetails.transactions;
    const { labels, incoming, outgoing } = this.calculateTransactionRatios(transactions, 12);

    const transactionRatioChart = new TransactionRatioChart({
      balance: this.accountDetails.balance,
      account: this.accountNumber,
      transactions: transactions,
    }, 12);

    return transactionRatioChart.el;
  }

  // Метод для расчета соотношения транзакций
  calculateTransactionRatios(transactions, monthsLimit) {
    const monthlyIncoming = {};
    const monthlyOutgoing = {};

    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyIncoming[month]) {
        monthlyIncoming[month] = 0;
        monthlyOutgoing[month] = 0;
      }

      if (transaction.from === this.accountNumber) {
        monthlyOutgoing[month] += transaction.amount; // Исходящие
      } else if (transaction.to === this.accountNumber) {
        monthlyIncoming[month] += transaction.amount; // Входящие
      }
    });

    const labels = Object.keys(monthlyIncoming).slice(-monthsLimit); // Ограничиваем количество месяцев
    const incoming = Object.values(monthlyIncoming).slice(-monthsLimit);
    const outgoing = Object.values(monthlyOutgoing).slice(-monthsLimit);

    return { labels, incoming, outgoing };
  }
  // Метод для отрисовки таблицы транзакций
  renderTransactionsTable() {
    const transactions = this.accountDetails.transactions
      .filter(transaction => 
        transaction.from === this.accountNumber || transaction.to === this.accountNumber
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // Сортируем по дате (самые новые сверху)
  
    // Очищаем контейнер перед обновлением таблицы
    this.transactionsContainer.innerHTML = '';
  
    // Обновляем таблицу транзакций
    this.transactionsTable.update(transactions);
  
    // Возвращаем контейнер, как это делается в AccountDetailsPage
    return this.transactionsContainer;
  }
}
