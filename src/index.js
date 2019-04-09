import chart_data from '../data/chart4.json';

import { createChart } from './charts/chart';

function main() {
  var chart = createChart(400, 400, chart_data);
  document.body.append(chart);
}


window.onload = function() {
  main();
}
