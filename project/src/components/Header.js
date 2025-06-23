import { el } from 'redom';

export default class Header {
  constructor(onNavigate) {
    this.onNavigate = onNavigate; // Функция для навигации

    // Создаем DOM-элементы
    this.el = el('header', { class: 'header' }, [
      el('div', { class: 'header-flex'},[
        el('div', { class: 'header-logo' }, 'Coin.'),
        el('button', { class: 'menu-toggle', onclick: () => this.toggleMenu() }, [
          el('span', { class: 'menu-icon' }),
          el('span', { class: 'menu-icon' }),
          el('span', { class: 'menu-icon' }),
        ]),
        el('nav', { class: 'nav' }, [
          el('a', { href: '#', class: 'nav-link', id: 'atm', onclick: (e) => this.handleLinkClick(e, 'atm') }, 'Банкоматы'),
          el('a', { href: '#', class: 'nav-link', id: 'accounts', onclick: (e) => this.handleLinkClick(e, 'accounts') }, 'Счета'),
          el('a', { href: '#', class: 'nav-link', id: 'currency', onclick: (e) => this.handleLinkClick(e, 'currency') }, 'Валюта'),
          el('a', { href: '#', class: 'nav-link', id: 'logout', onclick: () => this.logout() }, 'Выйти'),
        ]),
      ]),

    ]);
    // Сохраняем ссылки на все кнопки навигации
    this.navLinks = this.el.querySelectorAll('.nav-link');
    this.navLinks.forEach(link => link.classList.add('hidden'));

    this.menuOpen = false; // Флаг для отслеживания состояния меню
  }
  // Метод для открытия/закрытия меню
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    this.el.classList.toggle('menu-open', this.menuOpen);
  }
  // Метод для обработки клика по ссылке
  handleLinkClick(e, route) {
    console.log('handleLinkClick');
    e.preventDefault(); // Отменяем стандартное поведение ссылки

        // Удаляем класс активного состояния у всех кнопок
        this.navLinks.forEach(link => link.classList.remove('active'));

        // Добавляем класс активного состояния к выбранной кнопке
        e.target.classList.add('active');
        
    this.onNavigate(route); // Вызываем функцию навигации
  }

  // Метод для показа кнопок после авторизации
  showAuthButtons() {
    const authButtons = this.el.querySelectorAll('.hidden');
    authButtons.forEach(button => button.classList.remove('hidden'));
  }

  // Метод для выхода из системы
  logout() {
    localStorage.removeItem('token'); // Удаляем токен
    window.location.reload(); // Перезагружаем страницу
  }
}