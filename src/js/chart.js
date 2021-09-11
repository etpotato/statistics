import Chart from 'chart.js';

const PARENT_CLASS = 'js-chart-parent';
const CHART_CLASS = 'js-chart';
const TOGGLE_VIEW_CLASS = 'js-chart-toggle';
const TOGGLE_VIEW_CURRENT_CLASS = 'chart__toggle--current';
const PRINT_CLASS = 'js-chart-print';
const CHART_COLORS = [
  {
    name: 'blue',
    r: 80,
    g: 138,
    b: 255,
  },
  {
    name: 'yellow',
    r: 243,
    g: 168,
    b: 62,
  },
  {
    name: 'green',
    r: 49,
    g: 217,
    b: 156,
  },
  {
    name: 'red',
    r: 229,
    g: 77,
    b: 96,
  },
  {
    name: 'purple',
    r: 133,
    g: 103,
    b: 255,
  },
  {
    name: 'pink',
    r: 236,
    g: 121,
    b: 255,
  },
];

const bgColors = CHART_COLORS.map(item => `rgba(${item.r}, ${item.g}, ${item.b}, 1)`);

const getBgGradients = chartElement => {
  const barCtx = chartElement.getContext('2d');
  const gradients = CHART_COLORS.map(item => {
    const gradient = barCtx.createLinearGradient(0, 0, 0, 250);
    gradient.addColorStop(0, `rgba(${item.r}, ${item.g}, ${item.b}, 0.75)`);
    gradient.addColorStop(1, `rgba(${item.r}, ${item.g}, ${item.b}, 0.5)`);
    return gradient;
  });
  return gradients;
};

const getChartConfig = (chartElement, data) => {
  const chartView = chartElement.dataset.chartView;
  // set dataURL for chart
  const setPrint = context => {
    const printLink = chartElement.querySelector(`.${PRINT_CLASS}`);
    if (!printLink) return;
    const base64Image = context.chart.toBase64Image('image/png', 0.8);
    printLink.href = base64Image;
  };

  switch (chartView) {
    case 'bar':
      return {
        type: 'bar',
        data: {
          labels: [null, null ,...data.props, null, null],
          datasets: [{
            label: '',
            data: [null, null, ...data.props, null, null],
          }],
        },
        plugins: [
          {
            id: 'custom_canvas_background_color',
            beforeDraw: chart => {
              const ctx = chart.canvas.getContext('2d');
              ctx.save();
              ctx.globalCompositeOperation = 'destination-over';
              ctx.fillStyle = 'white';
              ctx.fillRect(0, 0, chart.width, chart.height);
              ctx.restore();
            },
          },
        ],
        options: {
          responsive: false,
          maintainAspectRatio: false,
          categoryPercentage: 0.9,
          borderRadius: 4,
          borderskipped: 'bottom',
          borderWidth: 0,
          backgroundColor: [null, null, getBgGradients(), null, null],
          animation: {
            onComplete: setPrint,
          },
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              padding: 8,
              displayColors: true,
              titleFont: {
                size: 14,
                family: 'Roboto',
              },
              bodyFont: {
                size: 14,
                family: 'Roboto',
              },
            },
          },
          scales: {
            x: {
              grid: {
                display: false,
                borderColor: 'rgba(225, 234, 245, 1)',
              },
              ticks: {
                display: false,
              },
            },
            y: {
              grid: {
                tickLength: 0,
                borderDash: [8, 8],
                borderWidth: 0,
                color: 'rgba(225, 234, 245, 1)',
              },
              ticks: {
                count: 4,
                padding: 8,
                font: {
                  size: 12,
                  family: 'Roboto',
                  color: 'rgba(59, 66, 86, 0.5)',
                },
                callback: function(value, index, values) {
                  return +Number.parseInt(value, 10);
                },
              },
            },
          },
        },
      };
    case 'line':
      return {
        type: 'line',
        data: {
          labels: data.dates,
          datasets: data.props.map((item, index) => {
            const dataset = {
              label: item.prop,
              data: item.prop,
              borderColor: bgColors[index],
              pointHoverBackgroundColor: bgColors[index],
            };
            return dataset;
          }),
        },
        plugins: [
          {
            id: 'custom_canvas_background_color',
            beforeDraw: chart => {
              const ctx = chart.canvas.getContext('2d');
              ctx.save();
              ctx.globalCompositeOperation = 'destination-over';
              ctx.fillStyle = 'white';
              ctx.fillRect(0, 0, chart.width, chart.height);
              ctx.restore();
            },
          },
        ],
        options: {
          responsive: false,
          maintainAspectRatio: false,
          borderWidth: 1,
          cubicInterpolationMode: 'monotone',
          fill: false,
          pointRadius: 6,
          pointHitRadius: 20,
          pointBorderWidth: 0,
          pointBackgroundColor: 'rgba(255, 255, 255, 0)',
          pointHoverRadius: 4,
          animation: {
            onComplete: setPrint,
          },
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              padding: 12,
              caretPadding: 5,
              displayColors: false,
              titleFont: {
                size: 14,
                family: 'Roboto',
              },
              bodyColor: 'rgba(255, 255, 255, 1)',
              bodyFont: {
                size: 14,
                family: 'Roboto',
              },
              bodySpacing: 0,
              callbacks: {
                title: function (context) {
                  return context[0].formattedValue;
                },
                label: function (context) {
                  return context.dataset.label;
                },
              },
            },
          },
          scales: {
            x: {
              grid: {
                display: false,
                borderColor: 'rgba(225, 234, 245, 1)',
              },
              ticks: {
                padding: 0,
                font: {
                  size: 12,
                  family: 'Roboto',
                  color: 'rgba(59, 66, 86, 0.5)',
                },
              },
            },
            y: {
              grid: {
                tickLength: 0,
                borderDash: [8, 8],
                borderWidth: 0,
                color: 'rgba(225, 234, 245, 1)',
              },
              ticks: {
                count: 4,
                padding: 8,
                font: {
                  size: 12,
                  family: 'Roboto',
                  color: 'rgba(59, 66, 86, 0.5)',
                },
                callback: function(value, index, values) {
                  return +Number.parseInt(value, 10);
                },
              },
            },
          },
        },
      };
  }
};

const updateConfig = (chart, data) => {
  const chartElement = chart.canvas;
  const newConfig = getChartConfig(chartElement, data);
  chart.config.type = newConfig.type;
  chart.config.data = newConfig.data;
  chart.config.options = newConfig.options;
  chartElement.style.width ='100%';
  const width = chartElement.getBoundingClientRect().width;
  chart.resize(width, 250);
  chart.update();
};

const updateView = (chart, view, data) => {
  const chartElement = chart.canvas;
  chartElement.dataset.chartView = view;
  updateConfig(chart, data);
  const parent = chart.closest(`.${PARENT_CLASS}`);
  const targetToggle = chart.closest(`.${PARENT_CLASS}`).querySelector(`.${TOGGLE_VIEW_CLASS}[data-chart-view="${view}"]`);
  [...parent.querySelectorAll(`.${TOGGLE_VIEW_CLASS}`)].forEach(toggle => toggle.classList.remove(`${TOGGLE_VIEW_CURRENT_CLASS}`));
  targetToggle.classList.add(`${TOGGLE_VIEW_CURRENT_CLASS}`);
};

const setViewToggleHandler = (chart, data) => {
  const handleViewToggle = evt => {
    if (
      !evt.target.matches(`.${TOGGLE_VIEW_CLASS}`)
      || evt.target.matches(`.${TOGGLE_VIEW_CLASS}.${TOGGLE_VIEW_CURRENT_CLASS}`)
    ) return;
    evt.preventDefault();
    const newChartView = evt.target.dataset.chartView;
    updateView(chart, newChartView, data);
  };

  const parentElement = chart.canvas.closest(`.${PARENT_CLASS}`);
  parentElement.addEventListener('click', handleViewToggle);
};

const myChart = (chartParentElement, data) => {
  const chartElement = chartParentElement.querySelector(`.${CHART_CLASS}`);
  return {
    chart: new Chart(chartElement, getChartConfig(chartElement, data)),
    updateConfig,
    updateView,
    setViewToggleHandler,
  };
};

export default myChart;
