import { ChartBase, getScreenXByInd, getYCoords, getScreenY } from './chart';
import { AnimatedValue, AnimatedArray, main } from '../animations';
import { createInfo } from './point-info';
import {
  createLabelFromDate,
  getMin, getMax,
  debounce, getGridValuesByMax
} from '../utils';
import { OXLABELS_HEIGHT, CHART_GRID_PADDING, GRID_LINES_COUNT, PREVIEW_HEIGHT } from '../consts';

const Y_ANIMATION_TIME = 0.3;
const OX_LABELS_ANIMATION_DURATION = 0.25;
const OY_LABELS_MARGIN_TOP = -10;

const MINI_CHART_HEIGHT = 50;
const MINI_CHART_MARGIN = 30;


export function barChart(w, h, data) {
  var chart = new BarChart(w, h, data);
  return chart.container;
}

function BarChart(w, h, data) {
  console.log(data);
  ChartBase.apply(this, arguments);
  this.L++;
  this.init();

}

BarChart.prototype = Object.create(ChartBase.prototype);
BarChart.prototype.constructor = BarChart;

BarChart.prototype.initData = function() {
  ChartBase.prototype.initData.call(this, 50);
}

BarChart.prototype.calculateOxLabelsOffsetX = function () {
  this.oxLabelsOffsetX = this.offsetX + this.barWidth/2 - this.labelWidthHalf;
};

ChartBase.prototype.calculateValuesMaxY = function() {
  return getMax(this.columns[0].values.slice(Math.max(0, this.startInd-1), this.endInd+1));
}

BarChart.prototype.drawMini = function() {
  this.ctx.clearRect(this.miniChartX, this.miniChartY, this.miniChartWidth, this.miniChartHeight);

  this.ctx.beginPath();
  this.ctx.globalAlpha = 0.4; // FIXME Alpha to const
  this.ctx.fillStyle = this.columns[0].color;

  var X = [];
  for (var i = 0; i < this.oxLabels.length; i++) {
    X.push(getScreenXByInd(i, this.miniChartStep, this.miniChartX));
  }
  var max = getMax(this.columns[0].values);
  var Y = getYCoords(this.miniChartHeight, this.columns[0].values, max).map(y => this.miniChartY + y);

  var barWidth = X[1] - X[0];
  for (var i = 0; i < X.length; i++) {
    this.ctx.rect(X[i], Y[i], barWidth, this.h - Y[i]);
  }
  this.ctx.fill();
}

BarChart.prototype.initButtons = function () {};

BarChart.prototype.drawChartContent = function() {
  this.ctx.beginPath();
  this.ctx.globalAlpha = 0.4; // FIXME Alpha to const
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
}

BarChart.prototype.getIndByScreenX = function (x, step=this.barWidth, offset=this.offsetX) {
  return Math.floor((x - offset)/step);
};

BarChart.prototype.drawSelected = function () {
  if (this.selectedInd > 0) {

    var barW = Math.round(this.barWidth*this.round)/this.round;

    var selectedIndX = this.getScreenXByInd(this.selectedInd);
    var selectedIndY = Math.floor(getScreenY(this.bottomY, this.columns[0].values[this.selectedInd], this.gridMaxY.value));

    this.ctx.beginPath();
    this.ctx.fillStyle = 'black';
    this.ctx.rect(selectedIndX, selectedIndY, barW, this.bottomY - selectedIndY);
    this.ctx.fill();

    this.info.style.left = this.selectedScreenX - this.info.offsetWidth - 30 + 'px';
    // this.info.style.top = Y[ind] - this.info.offsetHeight  - 15 + 'px'; // FIXME this.info margin
    this.info.style.top = this.selectedScreenY - this.info.offsetHeight/2 + 'px'; // FIXME this.info margin
    this.info.appear();
  }
  else {
    this.info.disappear()
  }

};











export function barChart1(w, h, data) {
  console.log(data);
  var me = chartBase(w, h, w - CHART_GRID_PADDING*2, PREVIEW_HEIGHT);
  var ctx = me.canvas.getContext('2d');

  var oxLabels = data.columns[0].slice(1, 1+dataLength).map(date => createLabelFromDate(date));
  var values = data.columns[1].slice(1, 1+dataLength);
  // var values = Array(dataLength).fill(0).map((e, i) => 1 + i*2);
  var color = data.colors[Object.keys(data.names)[0]];

  // ox props

  var currOxLabelsStep = 1;
  const oxLabelWidth = 50;
  const countOnScreen = w/oxLabelWidth;
  var staticOxLabels = { step: 1, lastInd: 0, alpha: new AnimatedValue(1, OX_LABELS_ANIMATION_DURATION) };
  var dynamicOxLabels = { step: 1, lastInd: 0, alpha: new AnimatedValue(1, OX_LABELS_ANIMATION_DURATION) };

  // oy props

  var currMaxY = 0;
  var gridMaxY = new AnimatedValue(0, Y_ANIMATION_TIME);

  var gridLinesHeight = Math.round(bottomY / GRID_LINES_COUNT);
  var oldOyLabels = {
    alpha: new AnimatedValue(0, Y_ANIMATION_TIME),
    offsetY: new AnimatedValue(0, Y_ANIMATION_TIME),
    labels: [0, 1, 2, 3, 4, 5, 6]
  };
  var newOyLabels = {
    alpha: new AnimatedValue(1, Y_ANIMATION_TIME),
    offsetY: new AnimatedValue(0, Y_ANIMATION_TIME),
    labels: [0, 1, 2, 3, 4, 5]
  };

  var info = createInfo();
  info.addRow('Views', 0);
  me.container.append(info);

  function init() {
    drawMini(CHART_GRID_PADDING, h - MINI_CHART_HEIGHT, w - CHART_GRID_PADDING*2, MINI_CHART_HEIGHT);
    me.update();
  }

  me.canvas.onclick = function(e) {
    if (e.layerY <= bottomY) {
      selectedInd = xToInd(e.layerX);
      info.setTitle(oxLabels[selectedInd]);
      info.setRowValue('Views', values[selectedInd]);
    }
    else {
      selectedInd = -1;
    }
    me.draw();
  }

  function xToInd(x) {
    var indOnScreen = Math.floor((x - offsetX)/barWidth);
    var ind = startInd + indOnScreen;
    return ind;
  }

  me.update = function() {

    startInd = Math.floor(me.previewLeftX * dataLength);
    endInd = Math.ceil(me.previewRightX * dataLength);
    barWidth = w/(dataLength*(me.previewRightX-me.previewLeftX));
    offsetX = -barWidth * (dataLength*me.previewLeftX - startInd);

    // console.log('update', barWidth, offsetX);

    var maxY = getMax(values.slice(startInd, endInd));
    // xCoords = getXCoords(w, oxLabels.slice(startInd, endInd), barWidth, offsetX);

    updateOxLabels();

    if (currMaxY !== maxY) {
      updateY(maxY);
    }

    me.draw();
  }

  var updateY = debounce(function(max) {
    var newGridValues = getGridValuesByMax(max);
    var now = performance.now();

    gridMaxY.set(newGridValues.splice(-1, 1)[0], now, true);

    oldOyLabels.labels = newOyLabels.labels;

    var k = 1;
    if (currMaxY > max) k = -1; // Если надо вверх
    currMaxY = max;

    oldOyLabels.alpha.set(1);
    oldOyLabels.offsetY.set(-1);
    oldOyLabels.alpha.set(0, now, true);
    oldOyLabels.offsetY.set(k*gridLinesHeight/2, now, true);

    newOyLabels.alpha.set(-1);
    newOyLabels.offsetY.set(-k*gridLinesHeight/2);
    newOyLabels.alpha.set(1, now, true);
    newOyLabels.offsetY.set(0, now, true);

    newOyLabels.labels = newGridValues;

    me.draw();
  }, 300);

  function updateOxLabels() {
    var step = Math.max(1, (endInd-1 - startInd) / countOnScreen);
    var p = 1;
    while (step > p) p *= 2;
    step = p;

    if (step === currOxLabelsStep) return;

    var now = performance.now();

    if (step > currOxLabelsStep) {
      currOxLabelsStep *= 2;
      dynamicOxLabels.alpha.set(1);
      dynamicOxLabels.alpha.set(0, now, true);
      staticOxLabels.step = currOxLabelsStep;
      dynamicOxLabels.step = currOxLabelsStep;
    }
    else if (step < currOxLabelsStep) {
      dynamicOxLabels.alpha.set(0);
      dynamicOxLabels.alpha.set(1, now, true);
      staticOxLabels.step = currOxLabelsStep;
      dynamicOxLabels.step = currOxLabelsStep;
      currOxLabelsStep /= 2;
    }
  }

  me.draw = function() {
    requestAnimationFrame(function() {
      // perf(function() {
      ctx.clearRect(0, 0, w, oxLabelsBottomY);

      var now = performance.now();

      // var needRedraw = yCoords.nextTick(now) |
      var needRedraw = gridMaxY.nextTick(now) |
      oldOyLabels.alpha.nextTick(now) |
      oldOyLabels.offsetY.nextTick(now) |
      newOyLabels.alpha.nextTick(now) |
      newOyLabels.offsetY.nextTick(now) |
      dynamicOxLabels.alpha.nextTick(now);

      drawBg();
      drawBars();

      if (needRedraw) {
        me.draw();
      }
    // });
    });
  }

  function drawBg() {
    drawOxLabels(staticOxLabels, oxLabels.length - 1);
    drawOxLabels(dynamicOxLabels, oxLabels.length - 1 - dynamicOxLabels.step/2); // Говно какое-то
    drawOyLabels(oldOyLabels);
    drawOyLabels(newOyLabels);
  }

  const labelWidthHalf = 15;
  function drawOxLabels(oxLabelsProps, lastInd) {
    if (oxLabelsProps.alpha.value <= 0) return;
    while(lastInd > endInd-1) lastInd -= oxLabelsProps.step;

    ctx.beginPath();
    ctx.globalAlpha = oxLabelsProps.alpha.value;
    ctx.fillStyle = 'black'; // FIXME color to consts

    var labelOffsetX = barWidth/2 - labelWidthHalf;
    var offset = -startInd * barWidth + offsetX + labelOffsetX;
    for (var i = lastInd; i >= startInd; i-=oxLabelsProps.step) {
      ctx.fillText(oxLabels[i], Math.floor(i * barWidth + offset), oxLabelsBottomY - OXLABELS_HEIGHT/2);
    }
  }

  function drawOyLabels(oyLabels) {
    if (oyLabels.alpha.value <= 0) return;
    ctx.beginPath();
    ctx.globalAlpha = oyLabels.alpha.value;
    ctx.fillStyle = 'black'; // FIXME color to const

    var offset = Math.round(oyLabels.labels.length * gridLinesHeight + oyLabels.offsetY.value);
    for (var i = 1; i < oyLabels.labels.length; i++) {
      var y = offset - i * gridLinesHeight;
      ctx.fillText(
        oyLabels.labels[i],
        CHART_GRID_PADDING,
        y + OY_LABELS_MARGIN_TOP
      );
      ctx.moveTo(CHART_GRID_PADDING, y);
      ctx.lineTo(w - CHART_GRID_PADDING, y);
    }
    ctx.stroke();

    ctx.beginPath();
    ctx.globalAlpha = 1;
    ctx.fillText(0, CHART_GRID_PADDING, bottomY + OY_LABELS_MARGIN_TOP);
    ctx.moveTo(CHART_GRID_PADDING, bottomY);
    ctx.lineTo(w - CHART_GRID_PADDING, bottomY);

    ctx.stroke();
  }

  function drawBars() {

    // ctx.beginPath();
    // ctx.globalAlpha = 0.4; // FIXME Alpha to const
    // var barW = Math.round(barWidth*round)/round;
    // // var X = getXCoords(w, oxLabels.slice(startInd, endInd), barW, Math.round(offsetX));
    // var X = getXCoords(w, oxLabels.slice(startInd, endInd), barW, Math.round(offsetX*round)/round);
    // // console.log('X', X);
    // var Y = getYCoords(bottomY, yCoords.slice(startInd, endInd), gridMaxY.value);
    // for (var i = 0; i < X.length; i++) {
    //   if (i !== selectedInd - startInd) {
    //     ctx.rect(X[i], Y[i], barW, bottomY - Y[i]);
    //   }
    // }
    // ctx.fillStyle = color;
    // ctx.fill();
    //
    // if (selectedInd >= startInd && selectedInd <= endInd) {
    //   var ind = selectedInd - startInd;
    //   ctx.beginPath();
    //   ctx.fillStyle = 'black';
    //   ctx.rect(X[ind], Y[ind], barWidth, bottomY - Y[ind]);
    //   ctx.fill();
    //
    //   info.style.left = X[ind] + (barWidth - info.offsetWidth)/2 + 'px';
    //   info.style.top = Y[ind] - info.offsetHeight  - 15 + 'px'; // FIXME Info margin
    //   info.appear();
    // }
    // else {
    //   info.disappear()
    // }

  }

  // requestAnimationFrame(me.draw);
  // me.update();
  init();
  return me.container;
}
