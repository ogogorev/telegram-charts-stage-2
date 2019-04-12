import chart_data from '../data/chart4.json';

// import { createChart } from './charts/chart';
import { barChart } from './charts/bar-chart';

function main() {
  // var chart = createChart(400, 450, chart_data);
  var chart = barChart(400, 450, chart_data);
  document.body.append(chart);
}


window.onload = function() {
  main();
}
