import { ChartBase, getScreenXByInd, getYCoords, getScreenY } from './chart';
import { AnimatedValue, AnimatedArray, main } from '../animations';
import {
  createLabelFromDate,
  getMin, getMax,
  getMatrixMax,
  debounce, getGridValuesByMax,
  getStepForGridValues,
  getDataColumnByName,
  transpose,
  round, sum, getPercents, getStackedPercents
} from '../utils';
import {
  CHART_GRID_PADDING,
  GRID_LINES_COLOR,
  CHART_HEADER_HEIGHT,
  CHART_HEADER_MARGIN_BOTTOM,
  CHART_MAX_WIDTH,
  CHART_MIN_HEIGHT,
  CHART_MAX_HEIGHT,
  OY_LABELS_MARGIN_TOP,
  Y_ANIMATION_TIME,
} from '../consts';

const MARGIN_TOP = 20; // FIXME Move inside

export function percentageStackedAreaChart(container, data, name) {
  var chart = new PercentageStackedAreaChart(container, data, name);
  return chart.container;
}

export function PercentageStackedAreaChart(container, data) {
  console.log(data);
  ChartBase.apply(this, arguments);
  this.init();
}

PercentageStackedAreaChart.prototype = Object.create(ChartBase.prototype);
PercentageStackedAreaChart.prototype.constructor = PercentageStackedAreaChart;

PercentageStackedAreaChart.prototype.addListeners = function () {
  window.addEventListener('resize', this.onResize.bind(this));
}

PercentageStackedAreaChart.prototype.onResize = debounce(function(e) {
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

PercentageStackedAreaChart.prototype.initData = function() {
  ChartBase.prototype.initData.call(this);

  this.percents = this.columns[0].values.map(v => this.columns.map(c => new AnimatedValue(0, Y_ANIMATION_TIME)))
  this.updatePercents();
}

PercentageStackedAreaChart.prototype.updateY = function() {}

PercentageStackedAreaChart.prototype.initOyProps = function() {
  ChartBase.prototype.initOyProps.apply(this);

  this.percentageLabels = {
    alpha: { value: 1},
    offsetY: 0,
    labels: [0, 25, 50, 75, 100]
  };
  this.gridLinesHeight = Math.round((this.bottomY - MARGIN_TOP) / 4); // move to const

  this.gridOyTextsColor = '#25252990'; // 50%
}


PercentageStackedAreaChart.prototype.drawOyLabels = function(oyLabels) {
  // if (oyLabels.alpha.value <= 0) return;
  this.ctx.globalAlpha = oyLabels.alpha.value;
  this.ctx.strokeStyle = GRID_LINES_COLOR; // FIXME color to const
  this.ctx.fillStyle = this.gridOyTextsColor; // FIXME color to const
  this.ctx.lineWidth = 1;
  this.ctx.beginPath();

  // var offset = Math.round(this.gridLinesHeight * (oyLabels.labels.length - 1));

  for (var i = 1; i < oyLabels.labels.length; i++) {
    var y = this.bottomY - i * this.gridLinesHeight;
    this.ctx.fillText(
      oyLabels.labels[i],
      CHART_GRID_PADDING,
      y + OY_LABELS_MARGIN_TOP
    );
    y -= 0.5;
    this.ctx.moveTo(CHART_GRID_PADDING, y);
    this.ctx.lineTo(this.w - CHART_GRID_PADDING, y);
  }
  this.ctx.stroke();
}

PercentageStackedAreaChart.prototype.updatePercents = function () {
  // this.percents = getStackedPercents(this.columns.filter(c => c.isOn).map(c => c.values));
  var now = performance.now();

  var stackedPercents = getStackedPercents(this.columns.map(c => {
    if (!c.isOn) {
      return c.values.map(v => 0)
    }
    return c.values;
  }));

  for (var i = 0; i < stackedPercents.length; i++) {
    for (var j = 0; j < stackedPercents[i].length; j++) {
      this.percents[i][j].set(Math.min(100, stackedPercents[i][j]), now, true);
    }
  }
};

PercentageStackedAreaChart.prototype.drawBg = function() {
  this.drawOxLabels(this.staticOxLabels, this.oxLabels.length - 1);
  this.drawOxLabels(this.dynamicOxLabels, this.oxLabels.length - 1 - this.dynamicOxLabels.step/2);
}

// PercentageStackedAreaChart.prototype.drawOyLabels = function(oyLabels) {
//   console.log('draw oy');
// }


PercentageStackedAreaChart.prototype.checkRedrawChartsContent = function(now) {
  // console.log('check redraw');
  for (var i = 0; i < this.percents.length; i++) {
    for (var j = 0; j < this.percents[i].length; j++) {
      if (this.percents[i][j].nextTick(now)) {
        this.needRedraw = this.needDrawPreview = true;
      }
    }
  }
}

PercentageStackedAreaChart.prototype.buttonClicked = function(name, isOn) {
  var now = performance.now();
  for (var i = 0; i < this.columns.length; i++) {
    if (this.columns[i].name === name) {
      // if (isOn) this.columns[i].alpha.set(1, now, true)
      // else this.columns[i].alpha.set(0, now, true)
      this.columns[i].isOn = isOn;
      this.updatePercents();

      // this.gridPreviewMaxY.set(Math.max(this.calculateGridPreviewMaxY(), 0), now, true);

      this.update();
    }
  }
}

PercentageStackedAreaChart.prototype.drawChartContent = function() {
  var barW = Math.round(this.barWidth*this.round)/this.round;
  var sI = Math.max(this.startInd-1, 0);
  var eI = Math.min(this.endInd+1, this.L);

  var X = [];
  for (var i = sI; i < eI+1; i++) {
    X.push(getScreenXByInd(i, barW, this.offsetX));
  }

  var mins = transpose(this.percents).map(c => getMin(c.map(v => v.value)));

  X = X.concat(X[X.length-1], X[0]);
  for (var i = this.columns.length - 1; i >= 0 ; i--) {
    var values = this.percents.map(p => p[i]).slice(sI, eI+1);
    var Y = values.map(v => getScreenY(this.bottomY - MARGIN_TOP, v.value, 100) + MARGIN_TOP);

    var m = getScreenY(this.bottomY - MARGIN_TOP, (mins[i-1]) ? mins[i-1] : 0, 100) + MARGIN_TOP;
    Y = Y.concat(m, m);
    this.drawArea(X, Y, this.columns[i].color);
  }

  this.drawOyLabels(this.percentageLabels);
  this.drawZeroLine();
}

PercentageStackedAreaChart.prototype.drawArea = function (X, Y, color, alpha=1) {
  // if (alpha > 0) {
    this.ctx.beginPath();
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = color;
    this.ctx.lineWidth = 1;

    this.ctx.moveTo(X[0], Y[0]);
    for (let i=1; i < X.length; i++) {
      this.ctx.lineTo(X[i], Y[i]);
    }
    this.ctx.fill();
  // }
}

PercentageStackedAreaChart.prototype.drawPreview = function() {
  this.clearDrawPreview();

  var X = [];
  for (var i = 0; i < this.oxLabels.length; i++) {
    X.push(getScreenXByInd(i, this.previewChartStep, this.previewChartX));
  }
  X[0] = Math.ceil(X[0]);
  X[X.length-1] = Math.floor(X[X.length-1]);
  X = X.concat(X[X.length-1], X[0]);

  var mins = transpose(this.percents).map(c => getMin(c.map(v => v.value))); // Убрать отсюда, можно пересчитывать при изменениях в данных

  for (var i = this.columns.length - 1; i >= 0 ; i--) {
    var values = this.percents.map(p => p[i]);
    var Y = values.map(v => getScreenY(this.previewChartHeight, v.value, 100));
    var m = getScreenY(this.previewChartHeight, (mins[i-1]) ? mins[i-1] : 0, 100);
    Y = Y.concat(m, m).map(y => Math.max(this.previewChartY + y, this.previewChartY));

    this.drawArea(X, Y, this.columns[i].color);
  }
}

PercentageStackedAreaChart.prototype.drawSelectedChartContent = function() {
  // if (this.selectedInd > 0) {

    this.ctx.beginPath();
    this.ctx.strokeStyle = GRID_LINES_COLOR;
    this.ctx.lineWidth = 1;
    this.ctx.moveTo(this.selectedScreenX + 0.5, 0);
    this.ctx.lineTo(this.selectedScreenX + 0.5, this.bottomY);
    this.ctx.stroke();

  //   this.info.style.left = this.selectedScreenX - this.info.offsetWidth - 30 + 'px'; // FIXME this.info margin
  //   this.info.style.top = this.selectedScreenY - this.info.offsetHeight/2 + 'px'; // FIXME this.info margin
  //   this.info.appear();
  // }
  // else {
  //   this.info.disappear()
  // }
}
