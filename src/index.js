import chart_data1 from '../data/chart1.json';
import chart_data2 from '../data/chart2.json';
import chart_data3 from '../data/chart3.json';
import chart_data4 from '../data/chart4.json';
import chart_data5 from '../data/chart5.json';

// import { createChart } from './charts/chart';
import { lineChart } from './charts/line-chart';
import { twoAxesLineChart } from './charts/two-axes-line-chart';
import { stackedBarChart } from './charts/stacked-bar-chart';
import { barChart } from './charts/bar-chart';
import { percentageStackedAreaChart } from './charts/stacked-area-chart';

function main() {


  // var chart = createChart(400, 450, chart_data);

  // var chart = lineChart(document.body, chart_data1, 'Line chart');
  // document.body.append(chart);
  //
  // var chart = twoAxesLineChart(chart_data2, 'Two axes line chart');
  // document.body.append(chart);
  // //
  // var chart = stackedBarChart(chart_data3, 'Stacked bar chart');
  // document.body.append(chart);
  //
  // var chart = barChart(chart_data4, 'Bar chart');
  // document.body.append(chart);
  //
  // var chart = percentageStackedAreaChart(chart_data5, 'Stacked area chart');
  // document.body.append(chart);

  var appContainer = document.getElementById('app-container');

  var charts = [];

  charts.push(lineChart(appContainer, chart_data1, 'Line chart'));
  charts.push(twoAxesLineChart(appContainer, chart_data2, 'Two axes line chart'));
  charts.push(stackedBarChart(appContainer, chart_data3, 'Stacked bar chart'));
  charts.push(barChart(appContainer, chart_data4, 'Bar chart'));
  charts.push(percentageStackedAreaChart(appContainer, chart_data5, 'Stacked area chart'));

  var isDayMode = true;
  var button = document.getElementById('mode');
  button.addEventListener('click', function() {
    isDayMode = !isDayMode;

    for (var i = 0; i < charts.length; i++) {
      charts[i].switchMode(isDayMode);
    }

    if (isDayMode) {
      button.innerHTML = 'Switch to Night Mode';
      document.body.classList.remove('night-theme');
    }
    else {
      button.innerHTML = 'Switch to Day Mode';
      document.body.classList.add('night-theme');
    }

  });

  // testCanvas();
}


window.onload = function() {
  main();
}

function testCanvas() {
  var canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  var ctx = canvas.getContext('2d');

  // var lastY = 0;

  ctx.beginPath();
  ctx.arc(50,50,50,1*Math.PI,1.5*Math.PI)

  ctx.moveTo(50, 0);
  ctx.lineTo(0, 0);
  ctx.lineTo(0, 50);
  ctx.fill();
  document.body.append(canvas);
}
