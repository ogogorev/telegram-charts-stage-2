import { getScreenXByInd, getYCoords } from './chart';
import { LineChart } from './line-chart';
import { AnimatedValue, AnimatedArray, main } from '../animations';
import {
  getMax,
  debounce, getGridValuesByMax,
  getStepForGridValues,
  getDataColumnByName
} from '../utils';
import {
  CHART_GRID_PADDING,
  CHART_HEADER_HEIGHT,
  CHART_HEADER_MARGIN_BOTTOM,
  CHART_MAX_WIDTH,
  CHART_MIN_HEIGHT,
  CHART_MAX_HEIGHT,
  OY_LABELS_MARGIN_TOP,
  Y_ANIMATION_TIME,
} from '../consts';

export function twoAxesLineChart(container, data, name) {
  var chart = new TwoAxesLineChart(container, data, name);
  return chart;
}

function TwoAxesLineChart(container, data) {
  // console.log(data);
  LineChart.apply(this, arguments);
  // this.init();
}

TwoAxesLineChart.prototype = Object.create(LineChart.prototype);
TwoAxesLineChart.prototype.constructor = TwoAxesLineChart;

TwoAxesLineChart.prototype.initOyProps = function() {
  LineChart.prototype.initOyProps.apply(this);

  this.gridStepYRight = 0;
  this.gridMaxYRight = new AnimatedValue(0, Y_ANIMATION_TIME);
  this.gridPreviewMaxYRight = new AnimatedValue(0, Y_ANIMATION_TIME);
  this.gridPreviewMaxYRight.set(getMax(this.columns[1].values), performance.now(), true);

  this.oldOyLabels.alphaRight = new AnimatedValue(0, Y_ANIMATION_TIME);
  this.oldOyLabels.labelsRight = [0, 1, 2, 3, 4, 5, 6];

  this.newOyLabels.alphaRight = new AnimatedValue(0, Y_ANIMATION_TIME);
  this.newOyLabels.labelsRight = [0, 1, 2, 3, 4, 5, 6];
}

TwoAxesLineChart.prototype.checkRedrawChartsContent = function(now) {
  LineChart.prototype.checkRedrawChartsContent.call(this, now);

  if (this.gridPreviewMaxYRight.nextTick(now)) this.needDrawPreview = true;
}

TwoAxesLineChart.prototype.drawZeroLine = function () {
  this.ctx.beginPath();
  this.ctx.globalAlpha = 1;

  this.ctx.fillStyle = this.columns[0].color;
  this.ctx.fillText(0, CHART_GRID_PADDING, this.bottomY + OY_LABELS_MARGIN_TOP);
  this.ctx.fillStyle = this.columns[1].color;
  this.ctx.fillText(
    0,
    CHART_GRID_PADDING + this.gridWidth - this.ctx.measureText(0).width,
    this.bottomY + OY_LABELS_MARGIN_TOP
  );
  this.ctx.moveTo(CHART_GRID_PADDING, this.bottomY + 0.5);
  this.ctx.lineTo(this.w - CHART_GRID_PADDING, this.bottomY + 0.5);
  this.ctx.stroke();
};

TwoAxesLineChart.prototype.drawOyLabels = function(oyLabels) {
  // if (oyLabels.alpha.value <= 0 && oyLabels.alphaRight.value <= 0) return;
  if (oyLabels.alpha.value > 0) {
    this.ctx.fillStyle = this.columns[0].color;
    this.ctx.globalAlpha = oyLabels.alpha.value;
    var offset = Math.round(
      oyLabels.labels.length * this.gridLinesHeight + oyLabels.offsetY*(1-oyLabels.alpha.value)
    );

    for (var i = 1; i < oyLabels.labels.length; i++) {
      var y = offset - i * this.gridLinesHeight;

      this.ctx.fillText(
        oyLabels.labels[i],
        CHART_GRID_PADDING,
        y + OY_LABELS_MARGIN_TOP
      );
    }
  }

  this.ctx.beginPath();
  this.ctx.globalAlpha = 1;
  this.ctx.lineWidth = 1;
  this.ctx.strokeStyle = this.gridLinesColor;
  for (var i = 1; i < 6; i++) {
    var y = (oyLabels.labels.length - i) * this.gridLinesHeight;

    y -= 0.5;
    this.ctx.moveTo(CHART_GRID_PADDING, y);
    this.ctx.lineTo(this.w - CHART_GRID_PADDING, y);
  }
  this.ctx.stroke();

  if (oyLabels.alphaRight.value > 0) {
    this.ctx.fillStyle = this.columns[1].color;
    this.ctx.globalAlpha = oyLabels.alphaRight.value;
    var offset = Math.round(
      oyLabels.labelsRight.length * this.gridLinesHeight + oyLabels.offsetY*(1-oyLabels.alphaRight.value)
    );

    for (var i = 1; i < oyLabels.labelsRight.length; i++) {
      var y = offset - i * this.gridLinesHeight;

      this.ctx.fillText(
        oyLabels.labelsRight[i],
        CHART_GRID_PADDING + this.gridWidth - this.ctx.measureText(oyLabels.labelsRight[i]).width,
        y + OY_LABELS_MARGIN_TOP
      );
    }
  }
}

TwoAxesLineChart.prototype.checkRedrawBg = function(now) {
  LineChart.prototype.checkRedrawBg.call(this, now);

  if (this.gridMaxYRight.nextTick(now)) this.needRedraw = true;
  if (this.oldOyLabels.alphaRight.nextTick(now)) this.needRedraw = true;
  if (this.newOyLabels.alphaRight.nextTick(now)) this.needRedraw = true;
}

TwoAxesLineChart.prototype.updateY = function () {
  var maxY = (this.columns[0].isOn) ? getMax(this.columns[0].values.slice(this.startInd, this.endInd+1)) : 0;
  var maxYRight = (this.columns[1].isOn) ? getMax(this.columns[1].values.slice(this.startInd, this.endInd+1)) : 0;
  var newGridStepY = getStepForGridValues(maxY);
  var newGridStepYRight = getStepForGridValues(maxYRight);

  if (this.gridStepY !== newGridStepY) {
    var now = performance.now();

    this.gridMaxY.set(newGridStepY*6, now, true);

    if (
      (this.oldOyLabels.offsetY > 0 && this.gridStepY > newGridStepY) ||
      (this.oldOyLabels.offsetY < 0 && this.gridStepY < newGridStepY)
    ) {
      this.oldOyLabels.offsetY *= -1;
      this.newOyLabels.offsetY *= -1;
    }

    this.gridStepY = newGridStepY;

    this.oldOyLabels.alpha.set(1);
    this.oldOyLabels.alpha.set(0, now, true);
    this.newOyLabels.alpha.set(0);
    this.newOyLabels.alpha.set(1, now, true);

    this.oldOyLabels.labels = this.newOyLabels.labels;
    this.newOyLabels.labels = (maxY !== 0) ? [0, 1, 2, 3, 4, 5].map(n => n*newGridStepY) : 0;
  }

  if (this.gridStepYRight !== newGridStepYRight) {
    var now = performance.now();

    this.gridMaxYRight.set(newGridStepYRight*6, now, true);
    this.gridStepYRight = newGridStepYRight;

    this.oldOyLabels.alphaRight.set(1);
    this.oldOyLabels.alphaRight.set(0, now, true);
    this.newOyLabels.alphaRight.set(0);
    this.newOyLabels.alphaRight.set(1, now, true);

    this.oldOyLabels.labelsRight = this.newOyLabels.labelsRight;
    this.newOyLabels.labelsRight = (maxYRight !== 0) ? [0, 1, 2, 3, 4, 5].map(n => n*newGridStepYRight) : [0];
  }
}

TwoAxesLineChart.prototype.getGridMaxForColumn = function(column) {
  return (this.columns[0].id === column.id) ? this.gridMaxY.value : this.gridMaxYRight.value;
}

TwoAxesLineChart.prototype.getGridMaxForColumnPreview = function(column) {
  return (this.columns[0].id === column.id) ? this.gridPreviewMaxY.value : this.gridPreviewMaxYRight.value;
}
