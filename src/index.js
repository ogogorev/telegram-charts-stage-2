import chart_data1 from '../data/chart1.json';
import chart_data2 from '../data/chart2.json';
import chart_data3 from '../data/chart3.json';
import chart_data4 from '../data/chart4.json';
import chart_data5 from '../data/chart5.json';
import chart_data_old_contest from '../data/chart_data.json';

// import { createChart } from './charts/chart';
import { lineChart } from './charts/line-chart';
import { twoAxesLineChart } from './charts/two-axes-line-chart';
import { stackedBarChart } from './charts/stacked-bar-chart';
import { barChart } from './charts/bar-chart';
import { percentageStackedAreaChart } from './charts/stacked-area-chart';

function main() {
  var appContainer = document.getElementById('app-container');

  var charts = [];

  // testCanvas();


  // console.log(chart_data_old_contest);

  // charts.push(lineChart(appContainer, chart_data_old_contest[0], 'Line chart'));
  charts.push(lineChart(appContainer, chart_data1, 'Line chart'));
  // charts.push(twoAxesLineChart(appContainer, chart_data2, 'Two axes line chart'));
  // charts.push(stackedBarChart(appContainer, chart_data3, 'Stacked bar chart'));
  // charts.push(barChart(appContainer, chart_data4, 'Bar chart'));
  // charts.push(percentageStackedAreaChart(appContainer, chart_data5, 'Stacked area chart'));

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
  // testCanvas();
  // test();
}

function test() {

}

function testCanvas() {
  var size = 400;
  var canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  var ctx = canvas.getContext('2d');

  function draw() {
    requestAnimationFrame(function() {
      ctx.clearRect(0, 0, size, size)

      var x = Math.floor(Math.random() * size - size/2);
      var y = Math.floor(Math.random() * size - size/2);

      ctx.beginPath();
      ctx.strokeStyle = '#FF0000';
      ctx.rect(x, y, 100, 100)
      ctx.stroke();

      draw();
    });
  }
  draw();

  document.body.append(canvas);
}
