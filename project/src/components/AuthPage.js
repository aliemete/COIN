import { el } from 'redom';
import AuthService from './AuthService';

export default class AuthPage {
  constructor(onSubmit) {
    this.onSubmit = onSubmit; // Функция для обработки авторизации
    this.authService = new AuthService(); // Создаем экземпляр AuthService

    // Создаем DOM-элементы
    this.el = el('div', { class: 'auth-body' }, [
      el('div', { class: 'auth-container' }, [
        el('h1', 'Вход в аккаунт'),
        this.authError = el('div', { class: 'error-message' }), // Блок для ошибки авторизации
        el('div', { class: 'auth-inputs' },[
          el('label', { class: 'auth-label' }, { for: 'login' }, 'Логин'),
          this.loginInput = el('input', { 
            type: 'text', 
            placeholder: 'Введите логин', 
            id: 'login' 
          }),
        ]),
        this.loginError = el('div', { class: 'error-message' }), // Блок для ошибок логина
        el('div', { class: 'auth-inputs' },[
          el('label', { class: 'auth-label' }, { for: 'password' }, 'Пароль'),
          this.passwordInput = el('input', { 
            type: 'password', 
            placeholder: 'Введите пароль', 
            id: 'password' 
          }),
        ]),
        this.passwordError = el('div', { class: 'error-message' }), // Блок для ошибок пароля
        el('div', { class: 'auth-button-block'}, [
        el('div', { class: 'invisible-block'}),
        el('button', { class: 'auth-button'}, { 
          onclick: () => this.handleSubmit() 
        }, 'Войти'),
        el('div', { class: 'invisible-block2'}),
        ]),
      ])      
    ]);
  }

  // Обработчик отправки формы
  async handleSubmit() {
    
    const login = this.loginInput.value.trim();
    const password = this.passwordInput.value.trim();

    // Очищаем предыдущие ошибки
    this.authError.textContent = '';
    this.loginError.textContent = '';
    this.passwordError.textContent = '';

    let hasError = false;

    // Валидация логина
    if (!login) {
      this.loginError.textContent = 'Поле "Логин" не может быть пустым.';
      hasError = true;
    } else if (login.length < 6) {
      this.loginError.textContent = 'Логин должен содержать минимум 6 символов.';
      hasError = true;
    } else if (login.includes(' ')) {
      this.loginError.textContent = 'Логин не должен содержать пробелов.';
      hasError = true;
    }

    // Валидация пароля
    if (!password) {
      this.passwordError.textContent = 'Поле "Пароль" не может быть пустым.';
      hasError = true;
    } else if (password.length < 6) {
      this.passwordError.textContent = 'Пароль должен содержать минимум 6 символов.';
      hasError = true;
    } else if (password.includes(' ')) {
      this.passwordError.textContent = 'Пароль не должен содержать пробелов.';
      hasError = true;
    }

    // Если есть ошибки, останавливаем выполнение
    if (hasError) {
      return;
    }
    try {
      // Пытаемся авторизоваться через AuthService
      const isAuthenticated = await this.authService.login(login, password);

      if (isAuthenticated) {
        // Если авторизация успешна, вызываем переданную функцию onSubmit
        this.onSubmit(login, password);
      }
    } catch (error) {
      // Если произошла ошибка, отображаем её
      this.authError.textContent = error.message || 'Ошибка при авторизации. Попробуйте снова.';
    }
  }
}