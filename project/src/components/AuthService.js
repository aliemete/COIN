export default class AuthService {
  constructor() {
    this.token = localStorage.getItem('token') || null;
  }

  // Метод для авторизации
  async login(login, password) {
    try {
      const response = await fetch(`http://localhost:3000/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ login, password }),
      });

      const data = await response.json();

      // Проверяем, есть ли ошибка в ответе
      if (data.error) {
        if (data.error === 'Invalid password') {
          throw new Error('Неверный пароль.');
        } else if (data.error === 'No such user') {
          throw new Error('Пользователь с таким логином не существует.');
        } else {
          throw new Error('Ошибка при авторизации.');
        }
      }

      // Проверяем, что токен получен
      if (data.payload && data.payload.token) {
        this.token = data.payload.token;
        localStorage.setItem('token', this.token);
        return true;
      } else {
        throw new Error('Токен не получен.');
      }
    } catch (error) {
      console.error('Ошибка при авторизации:', error);
      throw error;
    }
  }

  // Метод для получения списка счетов
  async fetchAccounts() {
    try {
      const response = await fetch('http://localhost:3000/accounts', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${this.token}`,
        },
      });

      const data = await response.json();

      // Проверяем, есть ли ошибка в ответе
      if (data.error) {
        if (response.status === 401) {
          throw new Error('Пользователь не авторизован.');
        } else {
          throw new Error(data.error || 'Ошибка при загрузке счетов.');
        }
      }

      return data.payload;
    } catch (error) {
      console.error('Ошибка при загрузке счетов:', error);
      throw error;
    }
  }

  // Метод для получения деталей счета
  async fetchAccountDetails(accountNumber) {
    try {
      const response = await fetch(`http://localhost:3000/account/${accountNumber}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${this.token}`,
        },
      });

      const data = await response.json();
      // Проверяем, есть ли ошибка в ответе
      if (data.error) {
        if (response.status === 401) {
          throw new Error('Пользователь не авторизован.');
        } else if (response.status === 404) {
          throw new Error('Счет не найден.');
        } else {
          throw new Error(data.error || 'Ошибка при загрузке деталей счета.');
        }
      }

      return data.payload;
    } catch (error) {
      console.error('Ошибка при загрузке деталей счета:', error);
      throw error;
    }
  }

  // Метод для создания нового счета
  async createAccount() {
    try {
      const response = await fetch('http://localhost:3000/create-account', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.token}`,
        },
      });

      const data = await response.json();

      // Проверяем, есть ли ошибка в ответе
      if (data.error) {
        if (response.status === 401) {
          throw new Error('Пользователь не авторизован.');
        } else {
          throw new Error(data.error || 'Ошибка при создании счета.');
        }
      }

      return data.payload;
    } catch (error) {
      console.error('Ошибка при создании счета:', error);
      throw error;
    }
  }

  // Метод для перевода средств
  async transferFunds(from, to, amount) {
    try {
      const response = await fetch('http://localhost:3000/transfer-funds', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to, amount }),
      });

      const data = await response.json();

      // Проверяем, есть ли ошибка в ответе
      if (data.error) {
        if (data.error === 'Invalid account from') {
          throw new Error('Неверный счет списания.');
        } else if (data.error === 'Invalid account to') {
          throw new Error('Неверный счет зачисления.');
        } else if (data.error === 'Invalid amount') {
          throw new Error('Неверная сумма перевода.');
        } else if (data.error === 'Overdraft prevented') {
          throw new Error('Недостаточно средств на счете.');
        } else {
          throw new Error(data.error || 'Ошибка при переводе средств.');
        }
      }
      console.log(data.payload);
      return data.payload;
    } catch (error) {
      console.error('Ошибка при переводе средств:', error);
      throw error;
    }
  }

  // Метод для получения списка всех валют
  async fetchAllCurrencies() {
    try {
      const response = await fetch('http://localhost:3000/all-currencies', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${this.token}`,
        },
      });

      const data = await response.json();

      // Проверяем, есть ли ошибка в ответе
      if (data.error) {
        if (response.status === 401) {
          throw new Error('Пользователь не авторизован.');
        } else {
          throw new Error(data.error || 'Ошибка при загрузке списка валют.');
        }
      }

      return data.payload;
    } catch (error) {
      console.error('Ошибка при загрузке списка валют:', error);
      throw error;
    }
  }

  // Метод для получения списка валютных счетов
  async fetchCurrencies() {
    try {
      const response = await fetch('http://localhost:3000/currencies', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${this.token}`,
        },
      });

      const data = await response.json();

      // Проверяем, есть ли ошибка в ответе
      if (data.error) {
        if (response.status === 401) {
          throw new Error('Пользователь не авторизован.');
        } else {
          throw new Error(data.error || 'Ошибка при загрузке валютных счетов.');
        }
      }

      return data.payload;
    } catch (error) {
      console.error('Ошибка при загрузке валютных счетов:', error);
      throw error;
    }
  }

  // Метод для обмена валюты
  async exchangeCurrency(from, to, amount) {
    try {
      const response = await fetch('http://localhost:3000/currency-buy', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to, amount }),
      });

      const data = await response.json();

      // Проверяем, есть ли ошибка в ответе
      if (data.error) {
        if (data.error === 'Unknown currency code') {
          throw new Error('Неверный код валюты.');
        } else if (data.error === 'Invalid amount') {
          throw new Error('Неверная сумма для обмена.');
        } else if (data.error === 'Not enough currency') {
          throw new Error('Недостаточно средств на счете.');
        } else if (data.error === 'Overdraft prevented') {
          throw new Error('Попытка перевести больше, чем доступно на счете.');
        } else {
          throw new Error(data.error || 'Ошибка при обмене валюты.');
        }
      }

      return data.payload;
    } catch (error) {
      console.error('Ошибка при обмене валюты:', error);
      throw error;
    }
  }

  // Метод для получения списка банкоматов
  async fetchBanks() {
    try {
      const response = await fetch('http://localhost:3000/banks', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${this.token}`,
        },
      });

      const data = await response.json();

      // Проверяем, есть ли ошибка в ответе
      if (data.error) {
        if (response.status === 401) {
          throw new Error('Пользователь не авторизован.');
        } else {
          throw new Error(data.error || 'Ошибка при загрузке списка банкоматов.');
        }
      }

      return data.payload;
    } catch (error) {
      console.error('Ошибка при загрузке списка банкоматов:', error);
      throw error;
    }
  }

  // Метод для проверки авторизации
  isAuthenticated() {
    return !!this.token;
  }

  // Метод для выхода из системы
  logout() {
    this.token = null;
    localStorage.removeItem('token');
  }
}