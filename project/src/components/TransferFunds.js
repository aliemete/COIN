import { el, setChildren } from 'redom';

export default class TransferFunds {
  constructor(authService, accountNumber, onTransferSuccess) {
    this.authService = authService; // Сервис для работы с бэкендом
    this.currentAccount = accountNumber; // Текущий счет (отправитель)
    this.onTransferSuccess = onTransferSuccess; // Колбэк для обновления таблицы транзакций
    console.log(onTransferSuccess);
    // Создаем DOM-элементы
    this.el = el('div', { class: 'transfer-funds' }, [
      el('h2', 'Новый перевод'),
      el('div', { class: 'transfer-inpits' }, [
        el('label', { class: 'transfer-label' }, 'Номер счёта получателя'),
        this.toInput = el('input', { type: 'text', placeholder: 'Введите номер счёта' }),
      ]),

      el('div', { class: 'transfer-inpits' }, [
        el('label', { class: 'transfer-label'}, 'Сумма перевода'),
        this.amountInput = el('input', { type: 'number', placeholder: 'Введите сумму' }),
      ]),
      el('div', { class: 'transfer-button-block' }, [
        el('div', { class: 'transfer-invisible'}),
        el('button', { 
          class: 'transfer-button', 
          onclick: () => this.handleTransfer() 
        }, '  Отправить'),
        el('div', { class: 'transfer-invisible'}),
      ]),

      this.transferResult = el('div', { class: 'transfer-result' }), // Блок для вывода результата перевода
    ]);

    // Инициализируем автозаполнение
    this.initAutocomplete();
  }

  // Метод для обработки перевода
  handleTransfer = async () => {
    const from = this.currentAccount; // Счет отправителя
    const to = this.toInput.value.trim(); // Счет получателя
    const amount = parseFloat(this.amountInput.value.trim()); // Сумма перевода

    // Валидация полей
    if (!to || isNaN(amount) || amount <= 0) {
      this.transferResult.textContent = 'Пожалуйста, заполните все поля корректно.';
      return;
    }

    if (from === to) {
      this.transferResult.textContent = 'Нельзя перевести средства на тот же счет.';
      return;
    }

    try {
      // Выполняем перевод средств через AuthService
      const result = await this.authService.transferFunds(from, to, amount);
      console.log('Результат перевода:', result);

      // Очищаем поля ввода
      this.toInput.value = '';
      this.amountInput.value = '';

      // Показываем результат перевода
      this.transferResult.textContent = `Перевод выполнен успешно`;

      // Сохраняем счет получателя в localStorage
      this.saveRecipientAccount(to);

      // Вызываем колбэк для обновления таблицы транзакций
      if (this.onTransferSuccess) {
        this.onTransferSuccess(); // Вызов колбэка
      }

    } catch (error) {
      this.transferResult.textContent = 'Ошибка при переводе средств: ' + error.message;
    }
  };

  // Метод для сохранения счета получателя в localStorage
  saveRecipientAccount(account) {
    const savedAccounts = JSON.parse(localStorage.getItem('recipientAccounts') || '[]');
    if (!savedAccounts.includes(account)) {
      savedAccounts.push(account);
      localStorage.setItem('recipientAccounts', JSON.stringify(savedAccounts));
    }
  }

  // Метод для загрузки сохраненных счетов из localStorage
  loadRecipientAccounts() {
    return JSON.parse(localStorage.getItem('recipientAccounts') || '[]');
  }

  // Метод для инициализации автозаполнения
  initAutocomplete() {
    const savedAccounts = this.loadRecipientAccounts();
    if (savedAccounts.length > 0) {
      // Создаем datalist для автозаполнения
      const datalist = el('datalist', { id: 'recipientAccounts' });
      savedAccounts.forEach(account => {
        datalist.appendChild(el('option', { value: account }));
      });

      // Добавляем datalist к полю ввода
      this.toInput.setAttribute('list', 'recipientAccounts');
      this.el.appendChild(datalist);
    }
  }

  // Метод для очистки сохраненных счетов
  clearRecipientAccounts() {
    localStorage.removeItem('recipientAccounts');
  }
}