import { slowCypressDown } from 'cypress-slow-down';
slowCypressDown(500);

describe('Просмотр счетов', () => {
  it('Неуспешная авторизация', () => {
    cy.visit('../dist/index.html'); // Переходим на главную страницу

    // Вводим неверный логин и пароль
    cy.get('input[id="login"]').type('invalidLogin');
    cy.get('input[id="password"]').type('invalidPassword');

    // Нажимаем кнопку "Войти"
    cy.get('button.auth-button').click();

    // Проверяем, что появилось сообщение об ошибке
    cy.get('.error-message').should('contain', 'Пользователь с таким логином не существует.');
  });
  
  it('Отображение списка счетов', () => {
    cy.visit('../dist/index.html');
    cy.get('input[id="login"]').type('developer');
    cy.get('input[id="password"]').type('skillbox');
    cy.get('button.auth-button').click();

    // Проверяем, что на странице отображается список счетов
    cy.get('.account-list').should('exist');
    cy.get('.account-item').should('have.length.greaterThan', 0);

    // // Нажимаем кнопку "Создать новый счет"
    cy.get('.create-account-button').click();

    // // Проверяем, что новый счет появился в списке
    cy.get('.account-item').should('have.length.greaterThan', 1);

    // Ищем блок счета, который содержит нужный номер
    cy.contains('.account-item', '74213041477477406320783754').within(() => {
      // Проверяем, что номер счета отображается
      cy.get('.account-number').should('contain', '74213041477477406320783754');
      cy.get('button').contains('Открыть счет').should('exist');
      cy.get('button').click();
    });

    // Проверяем, что мы перешли на страницу деталей счета
    cy.contains('h1', 'Просмотр счета:').should('exist');
    cy.contains('h2', '№ 74213041477477406320783754').should('exist'); // Проверяем, что отображается номер счета
    // Проверяем, что баланс отображается
    cy.contains('div', 'Баланс').should('exist');
    cy.contains('div', '₽').should('exist'); // Проверяем, что отображается сумма в рублях
    cy.contains('h2', 'Динамика баланса').should('exist');

    // Проверяем, что таблица транзакций отображается
    cy.contains('h1', 'История переводов').should('exist');
    cy.get('.transaction-table').should('exist');
    // Проверяем, что в таблице есть хотя бы одна транзакция
    cy.get('.transaction-table tr').should('have.length.greaterThan', 1);

    // Вводим данные для перевода
    cy.contains('label', 'Номер счёта получателя').next('input').type('61253747452820828268825011');
    cy.contains('label', 'Сумма перевода').next('input').type('100');
    // // Нажимаем кнопку "Отправить"
    cy.contains('button', 'Отправить').click();
                // Проверяем, что появилось сообщение об успешном переводе
    cy.contains('div', 'Перевод выполнен успешно').should('exist');

    // Переходим на страницу истории баланса
    cy.get('.balance-chart-container').should('exist').click()
  });
  });