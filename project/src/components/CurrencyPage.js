import { el, setChildren } from 'redom';
import CurrencyExchange from './CurrencyExchange';
import AuthService from './AuthService';

export default class CurrencyPage {
  constructor() {
    this.authService = new AuthService();
    this.exchangeRatesData = {};
    this.exchangeRatesList = [];
    this.currencyExchange = null;

    // Создаем DOM-элементы и сохраняем ссылки на них
    this.currencyBalancesList = el('div', { class: 'currency-balances-list' });
    this.exchangeRatesContainer = el('div', { class: 'rates-ecxhange-list' });

    this.el = el('div', { class: 'currency-page' }, [
      el('div', { class: 'currency-container' }, [
        el('h1', 'Валютный обмен'),
        el('div', {class: 'currency-flex'}, [
          el('div', { class: 'currency-acoount'}, [
            el('div', { class: 'currency-balances' }, [
              el('h2', 'Ваши валюты'),
              this.currencyBalancesList,
            ]),
            this.renderCurrencyExchange(),
          ]),
          el('div', { class: 'rates-ecxhange' }, [
            el('h2', 'Изменение курсов в реальном времени'),
            this.exchangeRatesContainer,
          ]),
        ]),
      ]),


    ]);

    // Загружаем список валют
    this.loadCurrencies();

    // Настраиваем WebSocket
    this.setupWebSocket();
  }
// Метод для отображения skeleton-лоадеров
showSkeleton() {
  setChildren(this.currencyBalancesList, [
    el('div.skeleton.skeleton-currency-balance'),
    el('div.skeleton.skeleton-currency-balance'),
    el('div.skeleton.skeleton-currency-balance'),
  ]);

  setChildren(this.exchangeRatesContainer, [
    el('div.skeleton.skeleton-exchange-rate'),
    el('div.skeleton.skeleton-exchange-rate'),
    el('div.skeleton.skeleton-exchange-rate'),
  ]);
}
  async loadCurrencies() {
    this.showSkeleton(); // Показываем skeleton-лоадеры
    try {
      const currencies = await this.authService.fetchCurrencies();
      this.updateCurrencyBalances(currencies);
    } catch (error) {
      console.error('Ошибка при загрузке валютных счетов:', error);
    }
  }

  updateCurrencyBalances(currencies) {
    // Очищаем контейнер перед обновлением
    setChildren(this.currencyBalancesList, []);

    // Фильтруем валюты с ненулевым балансом
    const nonZeroCurrencies = Object.values(currencies).filter(currency => currency.amount > 0);

    // Создаем элементы для каждой валюты
    nonZeroCurrencies.forEach(currency => {
      const balanceElement = this.createCurrencyBalance(currency);
      this.currencyBalancesList.appendChild(balanceElement);
    });
  }
  createCurrencyBalance(currency) {
    const dotsContainer = el('div', { class: 'currency-dots' });
    const balanceElement = el('div', { class: 'currency-balance' }, [
      el('div', { class: 'currency-code' }, `${currency.code}`),
      dotsContainer,
      el('div', { class: 'currency-amount' }, `${currency.amount.toFixed(2)}`),
    ]);
  
    // Временно добавляем элемент в DOM для измерения ширины
    document.body.appendChild(balanceElement);
  
    // Генерируем точки и вставляем их в блок
    dotsContainer.textContent = this.generateDots(
      balanceElement, 
      `${currency.code}`, 
      `${currency.amount.toFixed(2)}`
    );
  
    // Удаляем элемент из DOM, если он не должен быть частью основного DOM
    document.body.removeChild(balanceElement);
  
    return balanceElement;
  }
/**
 * Генерирует строку точек между двумя текстовыми элементами.
 * 
 * @param {HTMLElement} container - Контейнер, в котором находятся элементы.
 * @param {string} leftText - Текст слева от точек.
 * @param {string} rightText - Текст справа от точек.
 * @param {number} [padding=16] - Отступ между элементами (в пикселях).
 * @param {number} [dotWidth=6] - Ширина одной точки (в пикселях).
 * @returns {string} Строка точек.
 */
generateDots(container, leftText, rightText, padding = 16, dotWidth = 6) {
  // Создаем временные элементы для измерения ширины
  const tempLeft = document.createElement('div');
  tempLeft.textContent = leftText;
  tempLeft.style.position = 'absolute';
  tempLeft.style.visibility = 'hidden';
  tempLeft.style.whiteSpace = 'nowrap';
  document.body.appendChild(tempLeft);

  const tempRight = document.createElement('div');
  tempRight.textContent = rightText;
  tempRight.style.position = 'absolute';
  tempRight.style.visibility = 'hidden';
  tempRight.style.whiteSpace = 'nowrap';
  document.body.appendChild(tempRight);

  // Измеряем ширину текстовых элементов
  const leftWidth = tempLeft.offsetWidth;
  const rightWidth = tempRight.offsetWidth;

  // Удаляем временные элементы
  document.body.removeChild(tempLeft);
  document.body.removeChild(tempRight);

  // Рассчитываем доступное пространство для точек
  const containerWidth = container.offsetWidth;
  const availableWidth = containerWidth - leftWidth - rightWidth - padding;

  // Если доступное пространство меньше или равно нулю, возвращаем пустую строку
  if (availableWidth <= 0) {
    return '';
  }

  // Генерируем точки
  const dotCount = Math.floor(availableWidth / dotWidth);
  return '.'.repeat(dotCount);
}

  renderCurrencyExchange() {
    this.currencyExchange = new CurrencyExchange(this.updateCurrencyBalances.bind(this));
    return this.currencyExchange.el;
  }

  setupWebSocket() {
    const ws = new WebSocket('ws://localhost:3000/currency-feed');

    ws.onopen = () => {
      console.log('WebSocket connection established.');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'EXCHANGE_RATE_CHANGE') {
        const { from, to, rate, change } = message;
        const pair = `${from}-${to}`;

        // Обновляем данные о курсах
        this.exchangeRatesData[pair] = { rate, change };

        // Обновляем DOM-элементы
        this.updateExchangeRatesList(pair, { rate, change });
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      alert('Ошибка соединения с сервером. Пожалуйста, перезагрузите страницу.');
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed.');
      alert('Соединение с сервером прервано. Пожалуйста, перезагрузите страницу.');
    };
  }
  updateExchangeRatesList(pair, data) {
    const { rate, change } = data;
    const [from, to] = pair.split('-');
  
    const arrow = change === 1 ? '▲' : change === -1 ? '▼' : '▶';
    const color = change === 1 ? 'green' : change === -1 ? '#FD4E5D' : '76CA66';
  
    // Создаем контейнер для точек
    const dotsContainer = el('span', { class: 'dots' });
  
    // Создаем новый DOM-элемент для курса
    const rateElement = el('div', { class: 'rate-exchange' }, [
      el('span', { class: 'currency-code' }, `${from}/${to}:`),
      dotsContainer,
      el('span', `${rate} `),
      el('span', { style: `color: ${color};` }, arrow),
    ]);
  
    // Временно добавляем элемент в DOM для измерения ширины
    document.body.appendChild(rateElement);
  
    // Генерируем точки и вставляем их в блок
    dotsContainer.textContent = this.generateDots(
      rateElement, 
      `${from}/${to}:`, 
      `${rate} ${arrow}`
    );
  
    // Удаляем элемент из DOM, если он не должен быть частью основного DOM
    document.body.removeChild(rateElement);
  
    // Добавляем новый элемент в начало списка
    this.exchangeRatesList.unshift(rateElement);
  
    // Если количество элементов превышает 12, удаляем самый старый элемент
    if (this.exchangeRatesList.length > 25) {
      this.exchangeRatesList.pop();
    }
  
    // Обновляем DOM
    setChildren(this.exchangeRatesContainer, this.exchangeRatesList);
  }
}