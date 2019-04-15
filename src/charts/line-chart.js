import { ChartBase, getScreenXByInd, getYCoords, getScreenY } from './chart';
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

const Y_ANIMATION_TIME = .3; // FIXME

export function lineChart(w, h, data) {
  var chart = new LineChart(w, h, data);
  return chart.container;
}

export function LineChart(w, h, data) {
  console.log(data);
  ChartBase.apply(this, arguments);
  this.init();
}

LineChart.prototype = Object.create(ChartBase.prototype);
LineChart.prototype.constructor = LineChart;

LineChart.prototype.initData = function() {
  ChartBase.prototype.initData.call(this, 150);
}

LineChart.prototype.initOyProps = function() {
  ChartBase.prototype.initOyProps.apply(this);

  this.gridPreviewMaxY = new AnimatedValue(0, Y_ANIMATION_TIME);
  this.gridPreviewMaxY.set(this.calculateGridPreviewMaxY(), performance.now(), true);
}

LineChart.prototype.calculateGridPreviewMaxY = function () {
  return getMatrixMax(this.columns.filter(c => c.isOn).map(c => c.values));
}

LineChart.prototype.buttonClicked = function(name, isOn) {
  var now = performance.now();
  for (var i = 0; i < this.columns.length; i++) {
    if (this.columns[i].name === name) {
      if (isOn) this.columns[i].alpha.set(1, now, true)
      else this.columns[i].alpha.set(0, now, true)
      this.columns[i].isOn = isOn;

      this.gridPreviewMaxY.set(Math.max(this.calculateGridPreviewMaxY(), 0), now, true);

      this.update();
    }
  }
}

LineChart.prototype.checkRedrawChartsContent = function(now) {
  ChartBase.prototype.checkRedrawChartsContent.call(this, now);

  if (this.gridPreviewMaxY.nextTick(now)) this.needDrawPreview = true;
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
    var Y = getYCoords(this.bottomY, this.columns[i].values.slice(sI, eI+1), this.getGridMaxForColumn(this.columns[i]));
    this.drawLine(X, Y, this.columns[i].color, this.columns[i].alpha.value);
  }
}

LineChart.prototype.getGridMaxForColumn = function(column) {
  return this.gridMaxY.value;
};

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
  if (this.selectedInd > 0) {

    var barW = Math.round(this.barWidth*this.round)/this.round;
    var selectedIndX = Math.floor(this.getScreenXByInd(this.selectedInd, barW));
    var maxScreenY = 0;

    // console.log('selected');

    var ind = this.selectedInd - this.startInd;
    var filteredColumns = this.columns.filter(c => c.isOn);

    this.ctx.beginPath();
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 1;
    this.ctx.moveTo(this.selectedScreenX + 0.5, 0);
    this.ctx.lineTo(this.selectedScreenX + 0.5, this.bottomY);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.fillStyle = '#FFFFFF'; // FIXME Color
    filteredColumns.forEach(c => {
      var y = Math.floor(getScreenY(this.bottomY, c.values[this.selectedInd], this.getGridMaxForColumn(c)));
      if (y > maxScreenY) maxScreenY = y;

      this.ctx.arc(
        selectedIndX,
        y,
        5.5, // FIXME Radius to const
        0,
        2 * Math.PI
      );
    });
    this.ctx.fill();

    filteredColumns.forEach(c => {
      this.ctx.beginPath();
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = this.data.colors[c.id]; // FIXME Color
      this.ctx.arc(
        selectedIndX,
        Math.floor(getScreenY(this.bottomY, c.values[this.selectedInd], this.getGridMaxForColumn(c))),
        5.5,
        0,
        2 * Math.PI
      );
      this.ctx.stroke();
      this.ctx.closePath();
    });

    // this.info.style.left = selectedIndX + (this.barWidth - this.info.offsetWidth)/2 + 'px';
    this.info.style.left = this.selectedScreenX - this.info.offsetWidth - 30 + 'px';
    // this.info.style.top = Y[ind] - this.info.offsetHeight  - 15 + 'px'; // FIXME this.info margin
    this.info.style.top = this.selectedScreenY - this.info.offsetHeight/2 + 'px'; // FIXME this.info margin
    this.info.appear();
  }
  else {
    this.info.disappear()
  }
}

LineChart.prototype.getGridMaxForColumnPreview = function(column) {
  return this.gridPreviewMaxY.value;
};

LineChart.prototype.drawPreview = function() {
  this.clearDrawPreview();

  var X = [];
  for (var i = 0; i < this.oxLabels.length; i++) {
    X.push(getScreenXByInd(i, this.previewChartStep, this.previewChartX));
  }
  X[0] = Math.ceil(X[0]);
  X[X.length-1] = Math.floor(X[X.length-1]);

  this.ctx.beginPath();
  for (var i = 0; i < this.columns.length; i++) {
    var Y = getYCoords(this.previewChartHeight, this.columns[i].values, this.getGridMaxForColumnPreview(this.columns[i]))
    // .map(y => this.previewChartY + y);
    .map(y => Math.max(this.previewChartY + y, this.previewChartY));

    this.drawLine(X, Y, this.columns[i].color, this.columns[i].alpha.value);
  }
}
