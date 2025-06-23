import { el } from 'redom';
import AuthService from './AuthService';

export default class CurrencyExchange {
  constructor(updateCurrencyBalances) {
    this.authService = new AuthService();
    this.updateCurrencyBalances = updateCurrencyBalances;

    // Создаем DOM-элементы
    this.el = el('div', { class: 'currency-exchange' }, [
      el('h2',  { class: 'exchange-title'}, 'Обмен валюты'),
      el('div', { class: 'exchange-flex' }, [
        el('div', { class: 'exchange-manage'}, [
          el('div', { class: 'exchange-inputs'}, [
            el('div', { class: 'exchange-from-to' }, [
              el('label', 'Из '),
              this.fromCurrency = el('select', { class: 'exchange-select' })
            ]),
            el('div', { class: 'exchange-from-to' }, [          
            el('label', 'в '),
            this.toCurrency = el('select', { class: 'exchange-select' })]),
          ]),
          el('div', { class: 'exchange-amount-manage'}, [
            el('label', 'Сумма'),
            this.amountInput = el('input', { type: 'number', placeholder: 'Введите сумму', class: 'exchange-amount' }),
          ]),
        ]),
        el('button', { 
          class: 'exchange-button', 
          onclick: () => this.handleExchange() 
        }, 'Обменять'),
      ]),
      this.result = el('div', { class: 'exchange-result' }),
    ]);

    // Загружаем список валют
    this.loadCurrencies();
  }

  // Метод для загрузки списка валют
  
  loadCurrencies = async () => {
    try {
      const currencies = await this.authService.fetchAllCurrencies();
      this.updateCurrencyOptions(currencies);
    } catch (error) {
      console.error('Ошибка при загрузке валют:', error);
    }
  };

  // Метод для обновления выпадающих списков
  updateCurrencyOptions = (currencies) => {
    // Очищаем списки перед обновлением
    this.fromCurrency.innerHTML = '';
    this.toCurrency.innerHTML = '';
  
    // Добавляем валюты в выпадающие списки
    currencies.forEach((currency) => {
      const optionFrom = el('option', { selected: true, value: currency }, currency);
      const optionTo = el('option', { value: currency }, currency);
      this.fromCurrency.appendChild(optionFrom);
      this.toCurrency.appendChild(optionTo);
    });
  
    // Устанавливаем выбранные значения только после обновления списка
    if (currencies.length > 0) {
      this.fromCurrency.value = currencies[0]; // Первая валюта по умолчанию
      this.toCurrency.value = currencies[1] || currencies[0]; // Вторая валюта или первая, если второй нет
  
   }
  };
  // Метод для обработки обмена валюты
  handleExchange = async () => {
    console.log('handleExchange');
    const from = this.fromCurrency.value;
    const to = this.toCurrency.value;
    const amount = parseFloat(this.amountInput.value);

    // Валидация полей
    if (!from || !to || isNaN(amount) || amount <= 0) {
      this.result.textContent = 'Пожалуйста, заполните все поля корректно.';
      return;
    }

    if (from === to) {
      this.result.textContent = 'Выберите разные валюты для обмена.';
      return;
    }

    try {
      // Выполняем обмен валюты
      const result = await this.authService.exchangeCurrency(from, to, amount);

      // Обновляем балансы валют
      const updatedCurrencies = await this.authService.fetchCurrencies();
      this.updateCurrencyBalances(updatedCurrencies); // Обновляем блок "Ваша валюта"

      // Очищаем поле ввода суммы
      this.amountInput.value = '';

      // Показываем результат обмена
      this.result.textContent = `Обмен выполнен успешно.`;
    } catch (error) {
      this.result.textContent = 'Ошибка при обмене валюты: ' + error.message;
    }
  };
}