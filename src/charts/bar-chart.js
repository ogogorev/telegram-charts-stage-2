import { ChartBase, getScreenXByInd, getYCoords, getScreenY } from './chart';
import { AnimatedValue, AnimatedArray, main } from '../animations';
import { createInfo } from './point-info';
import {
  createLabelFromDate,
  getMin, getMax,
  debounce, getGridValuesByMax
} from '../utils';
import {
  CHART_GRID_PADDING,
  CHART_HEADER_HEIGHT,
  CHART_HEADER_MARGIN_BOTTOM,
  CHART_MAX_WIDTH,
  CHART_MIN_HEIGHT,
  CHART_MAX_HEIGHT,
  Y_ANIMATION_TIME,
  OY_LABELS_MARGIN_TOP
} from '../consts';

export function barChart(container, data, name) {
  var chart = new BarChart(container, data, name);
  return chart;
}

export function BarChart(container, data) {
  console.log(data);
  ChartBase.apply(this, arguments);
  this.L++;
  this.init();

}

BarChart.prototype = Object.create(ChartBase.prototype);
BarChart.prototype.constructor = BarChart;

BarChart.prototype.updateDateRange = function () {
  ChartBase.prototype.updateDateRange.call(this, this.startInd, this.endInd-1)
}

BarChart.prototype.addListeners = function () {
  window.addEventListener('resize', this.onResize.bind(this));
}

BarChart.prototype.onResize = debounce(function(e) {
  var newWidth = this.container.getBoundingClientRect().width;
  var newHeight = this.container.getBoundingClientRect().height;

  console.log('resize', this.name);

  newWidth = Math.min(newWidth, CHART_MAX_WIDTH);
  newHeight = Math.min(newHeight, CHART_MAX_HEIGHT);
  newHeight = Math.max(newHeight, CHART_MIN_HEIGHT);

  if (newWidth !== this.w) {
    this.w = newWidth;
    this.updateWidth();
  }

  if (newHeight !== this.h) {
    // this.h = newHeight;
    // this.updateHeight();
  }

}, 20);

BarChart.prototype.initData = function() {
  ChartBase.prototype.initData.call(this);
}

BarChart.prototype.calculateOxLabelsOffsetX = function () {
  this.oxLabelsOffsetX = this.offsetX + this.barWidth/2 - this.labelWidthHalf;
};

BarChart.prototype.calculateValuesMaxY = function() {
  return getMax(this.columns[0].values.slice(Math.max(0, this.startInd-1), this.endInd+1));
}

BarChart.prototype.drawPreview = function() {
  this.ctx.clearRect(this.previewChartX, this.previewChartY, this.previewChartWidth, this.previewChartHeight);

  this.ctx.beginPath();
  this.ctx.globalAlpha = 1; // FIXME Alpha to const
  this.ctx.fillStyle = this.columns[0].color;

  var X = [];
  for (var i = 0; i < this.oxLabels.length; i++) {
    X.push(getScreenXByInd(i, this.previewChartStep, this.previewChartX));
  }
  var max = getMax(this.columns[0].values);
  var Y = getYCoords(this.previewChartHeight, this.columns[0].values, max).map(y => this.previewChartY + y);

  var barWidth = X[1] - X[0];
  for (var i = 0; i < X.length; i++) {
    this.ctx.rect(X[i], Y[i], barWidth, this.h - Y[i]);
  }
  this.ctx.fill();
}

BarChart.prototype.drawSequence = function () {
  this.drawChartContent();
  this.drawBg();
  this.drawSelected();
};

BarChart.prototype.initButtons = function () {};

BarChart.prototype.drawChartContent = function() {
  this.ctx.beginPath();
  this.ctx.globalAlpha = (this.selectedInd > -1) ? 0.6 : 1; // FIXME Alpha to const
  var barW = Math.round(this.barWidth*this.round)/this.round;
  var sI = Math.max(this.startInd-1, 0);
  var eI = Math.min(this.endInd+1, this.L);

  var X = [];
  for (var i = sI; i < eI+1; i++) {
    X.push(getScreenXByInd(i, barW, this.offsetX));
  }

  var Y = getYCoords(this.bottomY, this.columns[0].values.slice(sI, eI+1), this.gridMaxY.value);
  for (var i = 0; i < X.length; i++) {
    if (i !== this.selectedInd - sI) {
      this.ctx.rect(X[i], Y[i], barW, this.bottomY - Y[i]);
    }
  }
  this.ctx.fillStyle = this.columns[0].color;
  this.ctx.fill();

  if (this.selectedInd > -1) {
    this.drawSelectedChartContent();
  }
}

BarChart.prototype.getIndByScreenX = function (x, step=this.barWidth, offset=this.offsetX) {
  return Math.floor((x - offset)/step);
}

BarChart.prototype.drawSelected = function() {
  if (this.selectedInd >= 0) {
    // this.drawSelectedChartContent();

    this.info.style.left = Math.max(this.selectedScreenX - this.info.offsetWidth - 30, 0) + 'px'; // FIXME this.info margin
    this.info.style.top = Math.max(this.selectedScreenY - this.info.offsetHeight, 0) + 'px';
    this.info.appear();
  }
  else {
    this.info.disappear()
  }
}

BarChart.prototype.drawSelectedChartContent = function () {
  var barW = Math.round(this.barWidth*this.round)/this.round;

  var selectedIndX = this.getScreenXByInd(this.selectedInd);
  var selectedIndY = Math.floor(getScreenY(this.bottomY, this.columns[0].values[this.selectedInd], this.gridMaxY.value));

  this.ctx.beginPath();
  this.ctx.globalAlpha = 1;
  this.ctx.fillStyle = this.columns[0].color;
  this.ctx.rect(selectedIndX, selectedIndY, barW, this.bottomY - selectedIndY);
  this.ctx.fill();
}
