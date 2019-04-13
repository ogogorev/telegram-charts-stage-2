import { ChartBase, getScreenXByInd, getYCoords } from './chart';
import { AnimatedValue, AnimatedArray, main } from '../animations';
import {
  createLabelFromDate,
  getMin, getMax,
  getMatrixMax,
  debounce, getGridValuesByMax,
  getStepForGridValues,
  getDataColumnByName
} from '../utils';
import { OXLABELS_HEIGHT, CHART_GRID_PADDING, GRID_LINES_COUNT, PREVIEW_HEIGHT } from '../consts';

export function lineChart(w, h, data) {
  var chart = new LineChart(w, h, data);
  return chart.container;
}

function LineChart(w, h, data) {
  console.log(data);
  ChartBase.apply(this, arguments);
  this.init();
}

LineChart.prototype = Object.create(ChartBase.prototype);
LineChart.prototype.constructor = LineChart;

LineChart.prototype.initData = function() {
  ChartBase.prototype.initData.call(this, 150);
}

LineChart.prototype.buttonClicked = function(name, isOn) {
  var now = performance.now();
  for (var i = 0; i < this.columns.length; i++) {
    if (this.columns[i].name === name) {
      if (isOn) this.columns[i].alpha.set(1, now, true)
      else this.columns[i].alpha.set(0, now, true)
      this.columns[i].isOn = isOn;
      this.update();
    }
  }
}

LineChart.prototype.drawChartContent = function() {
  var barW = Math.round(this.barWidth*this.round)/this.round;
  var sI = Math.max(this.startInd-1, 0);
  var eI = Math.min(this.endInd+1, this.L);

  var X = [];
  for (var i = sI; i < eI+1; i++) {
    X.push(getScreenXByInd(i, barW, this.offsetX));
  }

  for (var i = 0; i < this.columns.length; i++) {
    var Y = getYCoords(this.bottomY, this.columns[i].values.slice(sI, eI+1), this.gridMaxY.value);
    this.drawLine(X, Y, this.columns[i].color, this.columns[i].alpha.value);
  }
}

LineChart.prototype.drawLine = function(X, Y, color, alpha=1) {
  if (alpha > 0) {
    this.ctx.beginPath();
    this.ctx.globalAlpha = alpha;
    this.ctx.strokeStyle = color;
    this.ctx.lineCap = 'round';
    this.ctx.lineWidth = 2;

    this.ctx.moveTo(X[0], Y[0]);
    for (let i=1; i < X.length; i++) {
      this.ctx.lineTo(X[i], Y[i]);
    }
    this.ctx.stroke();
  }
}

LineChart.prototype.drawSelected = function() {
  if (this.selectedInd >= this.startind && this.selectedInd <= this.endInd) {
    var ind = this.selectedInd - this.startind;
    var filteredColumns = this.columns.filter(c => c.isOn);

    this.ctx.beginPath();
    this.ctx.strokeStyle = '#000000';
    this.ctx.moveTo(selectedScreenX, 0);
    this.ctx.lineTo(selectedScreenX, bottomY);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.fillStyle = '#FFFFFF'; // FIXME Color
    filteredColumns.forEach(c => {
      // this.ctx.arc(Math.floor(X[ind]), Math.floor(getScreenY(bottomY, c.values[this.selectedInd], gridMaxY.value)), 5.5, 0, 2 * Math.PI);
      // this.ctx.arc(Math.floor(X[ind]), Math.floor(getScreenY(bottomY, c.values[this.selectedInd], gridMaxY.value)), 5.5, 0, 2 * Math.PI);
    });
    this.ctx.fill();

    filteredColumns.forEach(c => {
      this.ctx.beginPath();
      this.ctx.strokeStyle = data.colors[c.id]; // FIXME Color
      // this.ctx.arc(Math.floor(X[ind]), Math.floor(getScreenY(bottomY, c.values[this.selectedInd], gridMaxY.value)), 5.5, 0, 2 * Math.PI);
      this.ctx.arc(Math.floor(getScreenXByInd(this.selectedInd, barW, this.offsetX)), Math.floor(getScreenY(bottomY, c.values[this.selectedInd], gridMaxY.value)), 5.5, 0, 2 * Math.PI);
      this.ctx.stroke();
      this.ctx.closePath();
    });

    this.info.style.left = X[ind] + (this.barWidth - this.info.offsetWidth)/2 + 'px';
    this.info.style.top = Y[ind] - this.info.offsetHeight  - 15 + 'px'; // FIXME this.info margin
    this.info.appear();
  }
  else {
    this.info.disappear()
  }
}

LineChart.prototype.drawMini = function() {
  this.ctx.clearRect(this.miniChartX, this.miniChartY, this.miniChartWidth, this.miniChartHeight);

  var X = [];
  for (var i = 0; i < this.oxLabels.length; i++) {
    X.push(getScreenXByInd(i, this.miniChartStep, this.miniChartX));
  }
  var max = getMatrixMax(this.columns.filter(c => c.isOn).map(c => c.values));

  this.ctx.beginPath();
  for (var i = 0; i < this.columns.length; i++) {
    var Y = getYCoords(this.miniChartHeight, this.columns[i].values, max).map(y => this.miniChartY + y);
    this.drawLine(X, Y, this.columns[i].color, this.columns[i].alpha.value);
  }
}
