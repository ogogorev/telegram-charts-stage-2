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

  // console.log(chart_data1);
  // console.log(chart_data2);
  // console.log(chart_data3);
  // console.log(chart_data4);
  // console.log(chart_data5);


  // var chart = createChart(400, 450, chart_data);

  // var chart = lineChart(400, 450, chart_data1);
  // document.body.append(chart);

  // var chart = twoAxesLineChart(400, 450, chart_data2);
  // document.body.append(chart);

  var chart = stackedBarChart(400, 450, chart_data3);
  document.body.append(chart);

  // var chart = barChart(400, 450, chart_data4);
  // document.body.append(chart);

  // var chart = percentageStackedAreaChart(400, 450, chart_data5);
  // document.body.append(chart);
}


window.onload = function() {
  main();
}

function testCanvas() {
  var canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  var ctx = canvas.getContext('2d');

  var X = [0, 50, 100, 150, 200, 250, 400]
  var Y = [200, 0, 200, 0, 200, 0, 200]

  var lastY = 0;

  ctx.beginPath();
  ctx.moveTo(X[0], Y[0]);

  X.forEach((x, i) => {
    ctx.lineTo(x, Y[i]);
  })
  ctx.lineTo(400, 400)
  ctx.lineTo(0, 400)
  ctx.fill();
  document.body.append(canvas);
}
