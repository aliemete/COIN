import { el, setChildren } from 'redom';
import BalanceChart from './BalanceChart';
import TransferFunds from './TransferFunds';
import TransactionsTable from './TransactionsTable';
import arrowSvg from '!!raw-loader!../assets/arrow.svg';


export default class AccountDetailsPage {
  constructor(accountNumber, onBack, onNavigate, authService) {
    this.onBack = onBack; // Функция для возврата

    this.onNavigate = onNavigate; // Функция для перехода на страницу истории
    console.log(onNavigate);
    this.accountNumber = accountNumber;
    this.authService = authService; // Добавляем authService для загрузки данных
    this.accountDetails = null; // Инициализируем accountDetails как null

    // Создаем DOM-элемент
    this.el = el('div', { class: 'details-page' }, [
      el('div', { class:'details-general' }, [
        el('div', { class: 'details-left'}, [
          el('h1', { class: 'details-left-h1'},  `Просмотр счета:`),
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
        el('div', { class: 'details-row'}, [        
          this.transferContainer = el('div', { class: 'transfer-container' }), 
          el('div', 'Загрузка данных...'), // Временный текст, пока данные загружаются
          this.balanceChart = el('div', { class: 'balance-chart-container'})
        ]),

        this.transactionsContainer = el('div', { class: 'transactions-container' }), 
      ]),
    ]);
    // Инициализация таблицы транзакций
    this.transactionsTable = new TransactionsTable(
      this.accountNumber,
      this.transactionsContainer, (transaction) => {
      this.onNavigate(this.accountNumber), // Переход на страницу истории баланса
      this.accountNumber
    });
      
    // Инициализируем компонент TransferFunds
    this.transferFunds = new TransferFunds(
      this.authService, // Передаем сервис для работы с бэкендом
      this.accountNumber, // Передаем текущий счет
      () => this.updateTransactions() // Колбэк для обновления таблицы транзакций
    );

    // Загружаем данные о счете
    this.loadAccountDetails();
  }
  // Метод для получения данных о счете
  async fetchAccountDetails() {
    try {
      const accountDetails = await this.authService.fetchAccountDetails(this.accountNumber);
      return accountDetails;
    } catch (error) {
      console.error('Ошибка при загрузке деталей счета:', error);
      throw error;
    }
  }
  // Метод для загрузки данных о счете
  async loadAccountDetails() {
    try {
      const accountDetails = await this.fetchAccountDetails();
      this.accountDetails = accountDetails;
      this.updateDOM(); // Обновляем DOM после загрузки данных
    } catch (error) {
      console.error('Ошибка при загрузке деталей счета:', error);
      setChildren(this.accountInfo, [
        el('div', 'Не удалось загрузить данные о счете.'),
      ]);
    }
  }

  //Метод для обновления DOM после загрузки данных
  updateDOM() {
    // Обновляем баланс
    setChildren(this.accountBalance, [
      el('div', { class: 'details-balance-title'}, `Баланс`),
      el('div', `${this.accountDetails.balance} ₽`),
    ]);

    // Очищаем контейнер и добавляем новые элементы
    setChildren(this.accountInfo, [
      el('div', { class: 'details-row'}, [
        this.renderTransferBlock(),
        this.renderBalanceChart()
      ]),
      el('div', { class: 'transaction-table'}, [
        el('h1', { class: 'table-title'}, 'История переводов'),
        this.renderTransactionsTable(),
      ])

    ]);
  }
  // Метод для отрисовки блока переводов
  renderTransferBlock() {
    // Очищаем контейнер для блока переводов и добавляем компонент TransferFunds
    setChildren(this.transferContainer, [this.transferFunds.el]);
    return this.transferContainer;
  }
    // Метод для отрисовки графика изменения баланса
    renderBalanceChart() {
      const balanceChart = new BalanceChart({
        balance: this.accountDetails.balance,
        account: this.accountNumber,
        transactions: this.accountDetails.transactions,
      }, 5, // Ограничиваем 6 месяцами
      true, () => this.onNavigate() // Передаем обработчик клика
    ); // Ограничиваем 6 месяцами
  
      return balanceChart.el;
    }
  // Метод для отрисовки таблицы транзакций
   renderTransactionsTable() {
    console.log('renderTransactionsTable');

    const transactions = this.accountDetails.transactions
      .filter(transaction => 
        transaction.from === this.accountNumber || transaction.to === this.accountNumber
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // Сортируем по дате (самые новые сверху)

      // Обновляем таблицу транзакций
    this.transactionsTable.update(transactions);

    return this.transactionsContainer;
  }
  // Метод для обновления таблицы транзакций
  async updateTransactions() {
    console.log('updateTransactions');
    try {
      // Запрашиваем обновленные данные о счете с сервера
      const accountDetails = await this.fetchAccountDetails();
      
      // Обновляем данные о счете
      this.accountDetails = accountDetails;

      // Обновляем таблицу транзакций с новыми данными
      this.renderTransactionsTable();
    } catch (error) {
      console.error('Ошибка при обновлении транзакций:', error);
    }
  }
}