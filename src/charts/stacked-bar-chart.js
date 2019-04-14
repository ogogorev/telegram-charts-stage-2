import { ChartBase, getScreenXByInd, getYCoords, getScreenY } from './chart';
import { BarChart } from './bar-chart';
import { AnimatedValue, AnimatedArray, main } from '../animations';
import { createInfo } from './point-info';
import {
  createLabelFromDate,
  getMin, getMax,
  debounce, getGridValuesByMax,
  sum, round, transpose
} from '../utils';
import { OXLABELS_HEIGHT, CHART_GRID_PADDING, GRID_LINES_COUNT, PREVIEW_HEIGHT } from '../consts';

const Y_ANIMATION_TIME = 0.3;
const OX_LABELS_ANIMATION_DURATION = 0.25;
const OY_LABELS_MARGIN_TOP = -10;

const MINI_CHART_HEIGHT = 50;
const MINI_CHART_MARGIN = 30;



function getStackedArraySums(values) {
  return transpose(transpose(values).map((row, i) => {
    return row.map((p, i) => {
      return round(sum(row.slice(0, i+1)), 2)
    })
  }))
}


export function stackedBarChart(w, h, data) {
  var chart = new StackedBarChart(w, h, data);
  return chart.container;
}

function StackedBarChart(w, h, data) {
  // console.log(data);
  BarChart.apply(this, arguments);
  // this.L++;
  // this.init();

}

StackedBarChart.prototype = Object.create(BarChart.prototype);
StackedBarChart.prototype.constructor = StackedBarChart;

StackedBarChart.prototype.initData = function() {
  ChartBase.prototype.initData.call(this, 50);

  this.stackedColumns = this.columns.map(c => c.values.map(
    v => 0
  ));

  this.stackedColumnsAnimated = this.columns.map(c => c.values.map(
    v => new AnimatedValue(0, Y_ANIMATION_TIME)
  ));

  this.updateStackedColumns();
}

StackedBarChart.prototype.updateStackedColumns = function() {
  var sums = getStackedArraySums(
    this.columns.map(c => (
      (!c.isOn) ? c.values.map(v => 0) : c.values
    ))
  );

  var now = performance.now();
  for (var i = 0; i < sums.length; i++) {
    for (var j = 0; j < sums[i].length; j++) {
      this.stackedColumns[i][j] = sums[i][j];
      this.stackedColumnsAnimated[i][j].set(sums[i][j], now, true);
    }
  }
}

StackedBarChart.prototype.initOyProps = function() {
  ChartBase.prototype.initOyProps.apply(this);

  this.gridMiniMaxY = new AnimatedValue(0, Y_ANIMATION_TIME);
  this.gridMiniMaxY.set(this.calculateGridMiniMaxY(), performance.now(), true);
}

StackedBarChart.prototype.calculateGridMiniMaxY = function () {
  var arr = this.stackedColumns[this.stackedColumns.length-1];
  return getMax(arr);
};

StackedBarChart.prototype.initButtons = ChartBase.prototype.initButtons;

StackedBarChart.prototype.buttonClicked = function(name, isOn) {
  var now = performance.now();
  for (var i = 0; i < this.columns.length; i++) {
    if (this.columns[i].name === name) {
      this.columns[i].isOn = isOn;
      this.updateStackedColumns();
      this.gridMiniMaxY.set(Math.max(this.calculateGridMiniMaxY(), 0), now, true);
      this.update();
    }
  }
}

StackedBarChart.prototype.calculateValuesMaxY = function() {
  var arr = this.stackedColumns[this.stackedColumns.length-1]
  .slice(this.startInd, this.endInd+1);

  return getMax(arr);
}

StackedBarChart.prototype.checkRedrawChartsContent = function(now) {
  for (var i = 0; i < this.stackedColumnsAnimated.length; i++) {
    for (var j = 0; j < this.stackedColumnsAnimated[i].length; j++) {
      if (this.stackedColumnsAnimated[i][j].nextTick(now)) {
        this.needRedraw = this.needDrawMini = true;
      }
    }
  }
  if (this.gridMiniMaxY.nextTick(now)) this.needDrawMini = true;
}

StackedBarChart.prototype.drawChartContent = function() {
  var barW = Math.round(this.barWidth*this.round)/this.round;
  var sI = Math.max(this.startInd-1, 0);
  var eI = Math.min(this.endInd+1, this.L);

  var X = [];
  for (var i = sI; i < eI+1; i++) {
    X.push(getScreenXByInd(i, barW, this.offsetX));
  }

  var YCoords = this.stackedColumnsAnimated.map(c => c.slice(sI, eI+1))
    .map(c => getYCoords(this.bottomY, c.map(v => v.value), this.gridMaxY.value));
  YCoords.splice(0, 0, YCoords[1].map(c => this.bottomY));


  for (var i = this.columns.length-1; i >= 0; i--) {
    this.ctx.beginPath();
    this.ctx.globalAlpha = 1; // FIXME Alpha to const

    for (var j = 0; j < X.length; j++) {
      if (j !== this.selectedInd - sI) {
        this.ctx.rect(X[j], YCoords[i+1][j], barW, YCoords[i][j] - YCoords[i+1][j]);
      }
    }

    this.ctx.fillStyle = this.columns[i].color;
    this.ctx.fill();
  }
}

StackedBarChart.prototype.drawMini = function() {
  this.clearDrawMini();

  var X = [];
  for (var i = 0; i < this.oxLabels.length; i++) {
    X.push(getScreenXByInd(i, this.miniChartStep, this.miniChartX));
  }
  var barWidth = X[1] - X[0];

  var YCoords = this.stackedColumnsAnimated.map(
    c => getYCoords(this.miniChartHeight, c.map(v => v.value), this.gridMiniMaxY.value).map(y => this.miniChartY + y)
  );
  YCoords.splice(0, 0, YCoords[1].map(c => this.h));

  for (var i = this.columns.length-1; i >= 0; i--) {

    this.ctx.beginPath();
    this.ctx.globalAlpha = 1; // FIXME Alpha to const

    for (var j = 0; j < X.length; j++) {
      this.ctx.rect(X[j], YCoords[i+1][j], barWidth, YCoords[i][j] - YCoords[i+1][j]);
    }

    this.ctx.fillStyle = this.columns[i].color;
    this.ctx.fill();
  }
}