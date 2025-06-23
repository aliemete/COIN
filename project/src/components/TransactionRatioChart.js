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

export default class TransactionRatioChart {
  constructor(response, monthesToSubtract) {
    this.currentBalance = response.balance;
    this._startBalance = this.currentBalance;
    this.transArray = response.transactions;
    this.countId = response.account;
    this.monthesToSubtract = monthesToSubtract;
    this.monthNames = [
      'янв', 'фев', 'мар', 'апр', 'май', 'июн',
      'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
    ];
    this.getStartDate();
    this.balanceData = this.balanceData();

    // Создаем DOM-элементы
    this.canvas = el('canvas', { id: 'transaction-ratio-chart',
      style: 'width: 100%; max-height: 220px;' // Занимает всю ширину и высоту контейнера
    });
    this.el = el('div', { class: 'transaction-ratio-container' }, [
      el('h2', { class: 'transaction-ratio-title'}, 'Соотношение входящих и исходящих транзакций'),
      this.canvas,
    ]);

    this.initChart();
  }

  // Получаем дату, с которой начинаем отсчет
  getStartDate() {
    console.log('getStartDate');
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
    console.log('getBaseStructureOfFinalDataArr');
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
  console.log('divideTransPerMonth');
  const finalArray = this.getBaseStructureOfFinalDataArr();

  // Находим индекс первой транзакции, которая попадает в диапазон
  const searchIndex = this.transArray.findIndex((el) => new Date(el.date) >= this.startDate);
  if (searchIndex === -1) {
    console.log('Нет транзакций, соответствующих диапазону дат.');
    return finalArray; // Возвращаем пустой массив, если нет подходящих транзакций
  }

  // Создаем новый массив транзакций, начиная с searchIndex
  const newTransArr = this.transArray.slice(searchIndex);

  // Распределяем транзакции по месяцам
  for (let item of newTransArr) {
    const transDate = new Date(item.date);
    const transMonthName = this.monthNames[transDate.getMonth()];
    const transYear = transDate.getFullYear();

    // Находим индекс элемента в finalArray, куда добавить транзакцию
    const itemToChangeInd = finalArray.findIndex(
      (elem) => elem.month === transMonthName && elem.year === transYear
    );

    // Если элемент найден, добавляем транзакцию
    if (itemToChangeInd !== -1) {
      finalArray[itemToChangeInd].transactions.push(item);
    } else {
      console.error(`Не найден месяц ${transMonthName} ${transYear} в finalArray.`);
    }
  }
  return finalArray;
}

  // Считаем сумму входящих и исходящих транзакций
  calculateBalancePerMonth(monthArr) {
    let incoming = 0;
    let outgoing = 0;
    if (monthArr.length > 0) {
      monthArr.forEach((item) => {
        if (item.to === this.countId) {
          incoming += item.amount;
        }
        if (item.from === this.countId) {
          outgoing += item.amount;
        }
      });
    }
    return { incoming, outgoing };
  }

  // Формируем данные для графика
  balanceData() {
    const transPerMonth = this.divideTransPerMonth();
    let toSubtractDifference = 0;
    const balancePerMonth = transPerMonth.reverse().map(item => {
      const { incoming, outgoing } = this.calculateBalancePerMonth(item.transactions);
      const difference = incoming - outgoing;
      const commonTransSum = incoming + outgoing;
      this._startBalance -= toSubtractDifference;
      toSubtractDifference = difference;
      item.transactions = {
        incoming: incoming,
        outgoing: outgoing,
        difference: difference,
        commonTransSum: commonTransSum,
        balance: this._startBalance,
      };
      return item;
    }).reverse();
    return balancePerMonth;
  }

  // Инициализация графика
  initChart() {
    console.log('initChart');
    // this.canvas.width = 1340; // Ширина
    // this.canvas.height = 288; // Высота
  
    const monthes = this.balanceData.map((item) => item.month);
    monthes.unshift('');
    monthes.push('');
  
    const outgoing = this.balanceData.map((item) => item.transactions.outgoing);
    const incoming = this.balanceData.map((item) => item.transactions.incoming);
    const maxOutgoing = Math.max(...outgoing);
    const maxIncoming = Math.max(...incoming);
    const max = Math.max(maxOutgoing, maxIncoming);
  
    // Функция для форматирования значений (убираем числа после запятой)
    const formatValue = (value) => {
      return `${Math.floor(value)} ₽`; // Округляем до целого числа
    };
  
    const data = {
      labels: monthes,
      datasets: [
        {
          data: outgoing,
          backgroundColor: '#FD4E5D',
          borderColor: '#FD4E5D',
          barThickness: 'flex', // Фиксированная ширина столбцов
          categoryPercentage: 0.7, // 80% ширины категории для столбцов
          barPercentage: 0.8, // 90% ширины категории для каждого столбца
        },
        {
          data: incoming,
          backgroundColor: '#76CA66',
          borderColor: '#76CA66',
          barThickness: 'flex', // Фиксированная ширина столбцов
          categoryPercentage: 0.7, // 80% ширины категории для столбцов
          barPercentage: 0.8, // 90% ширины категории для каждого столбца
        },
      ],
    };
  
    data.datasets[0].data.unshift(null);
    data.datasets[0].data.push(null);
  
    data.datasets[1].data.unshift(null);
    data.datasets[1].data.push(null);
  
    const chartConfig = {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: true,
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
                const label = context.dataset.label || '';
                const value = context.raw || 0;
                return `${label}: ${formatValue(value)} ₽`; // Форматируем значение в подсказке
              },
            },
          },
        },
        scales: {
          y: {
            position: 'right',
            responsive: true,
            maintainAspectRatio: false,
            beginAtZero: true,
            beforeTickToLabelConversion: (ctx) => {
              ctx.ticks = [];
              ctx.ticks.push({ value: 0, label: `      0 ₽` });
              ctx.ticks.push({ value: maxOutgoing, label: `      ${formatValue(maxOutgoing)}` }); // Форматируем значение
              ctx.ticks.push({ value: maxIncoming, label: `      ${formatValue(maxIncoming)}` }); // Форматируем значение
            },
            max: max,
            ticks: {
              color: '#000000',
              font: { weight: '500', size: 16 },
              padding: 0,
            },
          },
          x: {
            responsive: true,
            maintainAspectRatio: false,
            stacked: true,
            grid: {
              display: false,
            },
            ticks: {
              color: '#000000',
              font: { weight: '700', size: 16 },
            },
          },
        },
      },
      plugins: [chartAreaBorder],
    };
  
    new Chart(this.canvas, chartConfig);
  }
}