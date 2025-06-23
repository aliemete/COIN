import { el, setChildren } from 'redom';
import Header from './components/Header';
import AuthPage from './components/AuthPage';
import AccountsPage from './components/AccountsPage';
import AccountDetailsPage from './components/AccountDetailsPage';
import AuthService from './components/AuthService';
import BalanceHistoryPage from './components/BalanceHistoryPage';
import CurrencyPage from './components/CurrencyPage';
import AtmMap from './components/AtmMap'; // Импортируем компонент карты

import './assets/style.css'; // Подключаем стили

// Ждем загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  const authService = new AuthService();
  const header = new Header((route) => handleNavigation(route));
  const authPage = new AuthPage(async (login, password) => {
    try {
      const isAuthenticated = await authService.login(login, password);
      if (isAuthenticated) {
        header.showAuthButtons();
        handleNavigation('accounts');
      }
    } catch (error) {
      console.error('Ошибка при авторизации:', error);
    }
  });

  let currentPage = null;

  // Функция для навигации
  function handleNavigation(route, accountNumber = null) {
    if (currentPage) {
      if (currentPage.destroy) {
        currentPage.destroy(); // Уничтожаем график перед удалением компонента
      }
      currentPage.el.remove();
    }
  
    // Проверяем авторизацию перед переходом на страницу счета
    if (route.startsWith('account/') && !authService.isAuthenticated()) {
      console.error('Пользователь не авторизован. Перенаправление на страницу авторизации.');
      handleNavigation('/'); // Перенаправляем на страницу авторизации
      return;
    }
  
    // Сохраняем текущий маршрут и параметры в localStorage
    localStorage.setItem('currentRoute', route);
    if (accountNumber) {
      localStorage.setItem('accountNumber', accountNumber);
    } else {
      localStorage.removeItem('accountNumber');
    }
  
    switch (route) {
      case '/':
        currentPage = authPage;
        break;
      case 'accounts':
        currentPage = new AccountsPage(
          (accountNumber) => handleNavigation(`account/${accountNumber}`),
        );
        break;
      case 'currency':
        currentPage = new CurrencyPage();
        break;
      case 'atm':
        currentPage = new AtmMap();
        break;
      case 'balance-history':
        if (!accountNumber) {
          console.error('Номер счета не передан. Перенаправление на страницу счетов.');
          handleNavigation('accounts');
          return;
        }
        currentPage = new BalanceHistoryPage(
          accountNumber,
          () => handleNavigation(`account/${accountNumber}`),
          authService
        );
        break;
      default:
        if (route.startsWith('account/')) {
          const accountNumber = route.split('/')[1];
          currentPage = new AccountDetailsPage(
            accountNumber,
            () => handleNavigation('accounts'),
            () => handleNavigation('balance-history', accountNumber),
            authService
          );
        }
        break;
    }
  
    setChildren(document.body, [header.el, currentPage.el]);
  }

// Инициализация
const currentRoute = localStorage.getItem('currentRoute') || '/';
const accountNumber = localStorage.getItem('accountNumber');

if (authService.token) {
  header.showAuthButtons();
  if (currentRoute === 'balance-history' && accountNumber) {
    handleNavigation(currentRoute, accountNumber); // Восстанавливаем страницу balance-history с accountNumber
  } else {
    handleNavigation(currentRoute);
  }
} else {
  handleNavigation('/');
}
});