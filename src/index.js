import chart_data1 from '../data/chart1.json';
import chart_data2 from '../data/chart2.json';
import chart_data3 from '../data/chart3.json';
import chart_data4 from '../data/chart4.json';
import chart_data5 from '../data/chart5.json';

// import { createChart } from './charts/chart';
import { barChart } from './charts/bar-chart';
import { lineChart } from './charts/line-chart';

function main() {

  // console.log(chart_data1);
  // console.log(chart_data2);
  // console.log(chart_data3);
  // console.log(chart_data4);
  // console.log(chart_data5);


  // var chart = createChart(400, 450, chart_data);

  var chart = lineChart(400, 450, chart_data1);
  document.body.append(chart);

  // var chart = barChart(400, 450, chart_data4);
  // document.body.append(chart);
}


window.onload = function() {
  main();
}

/*

line-chart
- select



*/
