import { el } from 'redom';
import { Chart } from 'chart.js/auto';

// Плагин для рамки вокруг поля диаграммы
const chartAreaBorder = {
  id: 'chartAreaBorder',
  afterDraw(chart, args, options) {
    const { ctx, chartArea: { left, top, width, height } } = chart;
    ctx.save();
    ctx.strokeStyle = options.borderColor;
    ctx.lineWidth = options.borderWidth;
    ctx.strokeRect(left, top, width, height);
    ctx.restore();
  },
};

export default class BalanceChart {
  constructor(response, monthesToSubtract, handleClick = false, onClick) {
    this.currentBalance = response.balance;
    this._startBalance = this.currentBalance;
    this.transArray = response.transactions;
    this.countId = response.account;
    this.monthesToSubtract = monthesToSubtract;
    this.onClick = onClick;
    this.handleClick = handleClick; // Параметр для определения, нужно ли обрабатывать клик

    // Проверка на null для response
    if (response === null) {
      console.error('Response is null:', response);
      return;
    }

    // Проверка на null для transactions
    if (this.transArray === null) {
      console.error('Transactions array is null:', this.transArray);
      return;
    }

    this.monthNames = [
      'янв', 'фев', 'мар', 'апр', 'май', 'июн',
      'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
    ];
    this.getStartDate();
    this.balanceData = this.balanceData();

    // Создаем DOM-элементы
    this.canvas = el('canvas', { 
      id: 'balance-chart',
      style: 'width: 100%; max-height: 220px;' // Занимает всю ширину и высоту контейнера
    });
    this.el = el('div', { class: 'balance-chart-container',
      onclick: this.handleClick ? () => this.onClick() : null // Обработчик клика добавляется только если handleClick === true
     }, [
      el('h2', { class: 'balance-chart-title'}, 'Динамика баланса'),
      this.canvas,
    ]);

    this.initChart();
  }

  // Получаем дату, с которой начинаем отсчет
  getStartDate() {
    this.nowDate = new Date();
    let startMonth = this.nowDate.getMonth() - this.monthesToSubtract;
    let startYear = this.nowDate.getFullYear();
    if (startMonth < 0) {
      const yearToSubtract = Math.ceil(Math.abs(startMonth) / 12);
      startYear = startYear - yearToSubtract;
      startMonth = startMonth + yearToSubtract * 12;
    }
    this.startDate = new Date(startYear, startMonth);
  }

  // Создаем базовую структуру конечного массива с данными
  getBaseStructureOfFinalDataArr() {
    const transByMonths = [];
    const beginFrom = new Date(this.startDate);
    while (beginFrom < this.nowDate) {
      const monthNum = beginFrom.getMonth();
      const monthName = this.monthNames[monthNum];
      const year = beginFrom.getFullYear();
      const checkArray = transByMonths.find((item) => item.month === monthName && item.year === year);
      if (!checkArray) {
        transByMonths.push({
          month: monthName,
          year: year,
          transactions: [],
        });
      }
      beginFrom.setMonth(monthNum + 1);
    }
    return transByMonths;
  }

  // Распределяем транзакции по месяцам
  divideTransPerMonth() {
    const finalArray = this.getBaseStructureOfFinalDataArr();
    const searchIndex = this.transArray.findIndex((el) => new Date(el.date) >= this.startDate);
    if (searchIndex === -1) {
      console.log('Нет транзакций, соответствующих диапазону дат.');
      return finalArray;
    }

    const newTransArr = this.transArray.slice(searchIndex);
    for (let item of newTransArr) {
      const transDate = new Date(item.date);
      const transMonthName = this.monthNames[transDate.getMonth()];
      const transYear = transDate.getFullYear();
      const itemToChangeInd = finalArray.findIndex(
        (elem) => elem.month === transMonthName && elem.year === transYear
      );

      if (itemToChangeInd !== -1) {
        finalArray[itemToChangeInd].transactions.push(item);
      } else {
        console.error(`Не найден месяц ${transMonthName} ${transYear} в finalArray.`);
      }
    }

    return finalArray;
  }

  // Считаем разницу баланса по месяцам
  calculateBalancePerMonth(monthArr) {
    let difference = 0;
    if (monthArr.length > 0) {
      monthArr.forEach((item) => {
        if (item.from === this.countId) {
          difference -= item.amount;
        } else if (item.to === this.countId) {
          difference += item.amount;
        }
      });
    }
    return difference;
  }

  // Формируем данные для графика
  balanceData() {
    const transPerMonth = this.divideTransPerMonth();
    let toSubtractDifference = 0;
    const balancePerMonth = transPerMonth.reverse().map(item => {
      const difference = this.calculateBalancePerMonth(item.transactions);
      this._startBalance -= toSubtractDifference;
      toSubtractDifference = difference;
      item.balance = this._startBalance;
      return item;
    }).reverse();
    return balancePerMonth;
  }

  // Инициализация графика
  initChart() {
    const monthes = this.balanceData.map((item) => item.month);
    monthes.unshift('');
    monthes.push('');

    const balanceValues = this.balanceData.map((item) => item.balance);
    const maxBalance = Math.max(...balanceValues);

    const data = {
      labels: monthes,
      datasets: [
        {
          label: 'Баланс',
          data: balanceValues,
          backgroundColor: '#116ACC', // Цвет столбцов
          borderColor: '#116ACC',
          barThickness: 'flex', // Фиксированная ширина столбцов
          categoryPercentage: 0.7, // 80% ширины категории для столбцов
          barPercentage: 0.8, // 90% ширины категории для каждого столбца
        },
      ],
    };

    data.datasets[0].data.unshift(null);
    data.datasets[0].data.push(null);

    const chartConfig = {
      type: 'bar',
      data: data,
      options: {
        responsive: true, // Отключаем автоматическое изменение размеров
        maintainAspectRatio: true, // Не сохраняем пропорции
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (context) => {
                const month = context[0].label;
                const year = this.balanceData.find((item) => item.month === month).year;
                return `${month} ${year}`;
              },
              label: (context) => {
                const value = context.raw || 0;
                return `Баланс: ${Math.floor(value)} ₽`; // Форматируем значение
              },
            },
          },
          chartAreaBorder: {
            borderColor: '#000000',
            borderWidth: 1,
          },
        },
        scales: {
          y: {
            position: 'right',
            responsive: true,
            maintainAspectRatio: false,
            beginAtZero: true,
            max: maxBalance,
            ticks: {
              callback: (value) => {
                if (value === 0 || value === maxBalance) {
                  return `${Math.floor(value)} ₽`; // Отображаем только 0 и максимальное значение
                }
                return ''; // Остальные значения не отображаем
              },              
              color: '#000000',
              font: { weight: '500', size: 16 },
              padding: 0,
            },
          },
          x: {
            responsive: true,
            maintainAspectRatio: false,
            ticks: {
              color: '#000000',
              font: { weight: '700', size: 16 },
            },
            grid: {
              display: false,
            },
          },
        },
      },
      plugins: [chartAreaBorder],
    };

    try {
      this.chart = new Chart(this.canvas, chartConfig);
    } catch (error) {
      console.error('Ошибка при инициализации графика:', error);
    }
  }

  // destroy() {
  //   if (this.chart) {
  //     this.chart.destroy(); // Уничтожаем график перед удалением компонента
  //   }
  // }
}