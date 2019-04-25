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

  // charts.push(lineChart(appContainer, chart_data_old_contest[4], 'Line chart'));
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
  // test();
}

function testCanvas() {

  var pixelRatio = window.devicePixelRatio;

  var canvas = document.createElement('canvas');
  var size = 400;

  canvas.style.width = size + 'px'
  canvas.style.height = size + 'px'

  canvas.width = size * pixelRatio;
  canvas.height = size * pixelRatio;


  console.log(canvas.getBoundingClientRect());
  var ctx = canvas.getContext('2d');
  ctx.scale(pixelRatio, pixelRatio);

  // var lastY = 0;

  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#FF0000';
  // ctx.rect(10, 10, 100, 100)

  ctx.moveTo(0, 50)
  ctx.lineTo(50, 100)
  ctx.lineTo(100, 25)
  ctx.lineTo(150, 100)
  ctx.lineTo(200, 25)
  ctx.lineTo(250, 100)
  ctx.lineTo(300, 25)

  ctx.stroke();
  document.body.append(canvas);
}


function test() {
  function Parent(name) {
    this.name = name;

    this.div = document.createElement('div')
    this.div.innerHTML = this.name;
    document.body.append(this.div);

    window.addEventListener('resize', this.onResize.bind(this))
  }

  Parent.prototype.onResize = function() {
    this.div.innerHTML = this.name + 'resized';
  }

  function Child1(name) {
    Parent.apply(this, arguments);
  }
  Child1.prototype = Object.create(Parent.prototype);
  Child1.prototype.constructor = Child1;

  function Child2(name) {
    Parent.apply(this, arguments);
  }
  Child2.prototype = Object.create(Parent.prototype);
  Child2.prototype.constructor = Child2;

  var c1 = new Child1('child 1 ');
  var c2 = new Child1('child 2 ');
}
