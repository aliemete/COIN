import { el, setChildren } from 'redom';

export default class AccountList {
  constructor() {
    this.accounts = [];
    this.el = el('ul', { class: 'account-list' });
  }

  update(accounts) {
    this.accounts = accounts;
    this.render();
  }

  sort(criteria) {
    switch (criteria) {
      case 'number':
        this.accounts.sort((a, b) => a.number.localeCompare(b.number));
        break;
      case 'balance':
        this.accounts.sort((a, b) => b.balance - a.balance);
        break;
      case 'lastTransaction':
        this.accounts.sort((a, b) => new Date(b.lastTransaction) - new Date(a.lastTransaction));
        break;
    }
    this.render();
  }

  render() {
    setChildren(this.el, this.accounts.map(account => el('li', `Счет: ${account.number}, Баланс: ${account.balance}`)));
  }
}
