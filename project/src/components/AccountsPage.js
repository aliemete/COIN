import { el, setChildren } from 'redom';
import AuthService from './AuthService';


export default class AccountsPage {
  constructor(onOpenAccount) {
    this.onOpenAccount = onOpenAccount; // Функция для открытия счета
    this.authService = new AuthService();

    // Создаем DOM-элементы
    this.el = el('div', { class: 'accounts-page' }, [
      el('div', {class: 'accounts-manage'}, [
        el('div', { class: 'accounts-manage-left'}, [
          el('h1', 'Ваши счета'),
          el('div', { class: 'sort-controls' }, [
            el('select', { id: 'sort' }, [
              el('option', { disabled: true, hidden: true, selected: true }, 'Сортировка'), // Скрытый и невыбираемый элемент
              el('option', { value: 'account' }, 'Номер'),
              el('option', { value: 'balance' }, 'Баланс'),
              el('option', { value: 'transactions' }, 'Последняя транзакция'),
            ]),
          ]),
        ]),
        el('button', { 
          class: 'create-account-button', 
          onclick: () => this.handleCreateAccount() 
        }, '+   Создать новый счет')
      ]),
      el('div', { class: 'accounts-display'}, [
        this.accountList = el('ul', { class: 'account-list' }), // Список счетов
      ])
    ]);

    // Загружаем счета при создании компонента
    this.loadAccounts();

    // Обработчик изменения сортировки
    this.el.querySelector('#sort').addEventListener('change', (e) => {
      this.sortAccounts(e.target.value);
    });
  }

  // Метод для отображения skeleton-лоадеров
  showSkeleton() {
    const skeletonItems = Array.from({ length: 5 }, () =>
      el('li.skeleton-account-item', [
        el('div.skeleton.skeleton-account-number'),
        el('div.skeleton.skeleton-account-balance'),
        el('div.skeleton.skeleton-account-transaction'),
        el('button.skeleton.skeleton-button'),
      ])
    );
  
    setChildren(this.accountList, skeletonItems);
  }

  // Метод для загрузки счетов
  async loadAccounts() {
    console.log('loadAccounts');
    this.showSkeleton(); // Показываем skeleton-лоадеры

    try {
      const accounts = await this.authService.fetchAccounts();
      this.update(accounts);
    } catch (error) {
      console.error('Ошибка при загрузке счетов:', error);
      alert('Не удалось загрузить счета. Попробуйте позже.');
    }
  }

  // Метод для обновления списка счетов
  update(accounts) {
    this.accounts = accounts;
    this.render();
  }

  // Метод для обновления списка счетов
  async updateAccounts() {
    await this.loadAccounts(); // Просто вызываем loadAccounts
  }

  // Метод для создания нового счета
  async handleCreateAccount() {
    if (!this.authService.isAuthenticated()) {
      alert('Вы не авторизованы. Пожалуйста, войдите в систему.');
      return;
    }

    try {
      const newAccount = await this.authService.createAccount();
      this.updateAccounts(); // Обновляем список счетов
    } catch (error) {
      alert('Ошибка при создании счёта: ' + error.message);
    }
  }

  // Метод для сортировки счетов
  sortAccounts(sortBy) {
    switch (sortBy) {
      case 'account':
        this.accounts.sort((a, b) => a.account.localeCompare(b.account));
        break;
      case 'balance':
        this.accounts.sort((a, b) => b.balance - a.balance);
        break;
      case 'transactions':
        this.accounts.sort((a, b) => {
          const lastTransactionA = a.transactions[0]?.date || '1970-01-01T00:00:00Z';
          const lastTransactionB = b.transactions[0]?.date || '1970-01-01T00:00:00Z';
          return new Date(lastTransactionB) - new Date(lastTransactionA);
        });
        break;
      default:
        break;
    }
    this.render();
  }
  formatDate(dateString) {
    console.log('formatDate');
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('ru-RU', { month: 'long' }); // Месяц на русском
    const year = date.getFullYear();
    return `${day} ${month} ${year}`; // Например: "5 октября 2023"
  }
  // Метод для отрисовки списка счетов
  render() {
    const accountsList = this.accounts.map(account => {
      const lastTransaction = account.transactions[0];
      const formattedDate = lastTransaction ? this.formatDate(lastTransaction.date) : 'Нет транзакций'; // Проверяем наличие транзакции
      return el('li', { class: 'account-item' }, [
        el('div', { class: 'accounts-item-display'}, [
          el('div', { class: 'account-number' }, `${account.account}`),
          el('div', { class: 'account-balance' }, `${account.balance} ₽`),
          el('div', { class: 'account-transactions'}, [
            el('div', { class: 'account-transaction-title' }, `Последняя транзакция:`),
            lastTransaction ? el('div', { class: 'account-transaction-date' }, [
              el('div', `${formattedDate}`), // Выводим отформатированную дату
            ]) : el('div', { class: 'account-transaction' }, 'Нет транзакций'),
          ]),
        ]),
        el('button', { 
          class: 'open-account-button', 
          onclick: () => {
            if (this.authService.isAuthenticated()) {
              this.onOpenAccount(account.account); // Переход на страницу счета
            } else {
              console.error('Пользователь не авторизован.');
              handleNavigation('/'); // Перенаправление на страницу авторизации
            }
          }
        }, 'Открыть счет'),
      ]);
    });
  
    setChildren(this.accountList, accountsList);
  }
}