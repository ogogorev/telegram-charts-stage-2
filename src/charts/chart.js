import { barChart } from './bar-chart';
import { preview } from './preview-canvas';
import { createInfo } from './point-info';
import { createButton } from './button';
import { AnimatedValue } from '../animations';
import {
  createLabelFromDate,
  getMin, getMax,
  getMatrixMax,
  debounce, getGridValuesByMax,
  getStepForGridValues,
  getDataColumnByName
} from '../utils';
import { OXLABELS_HEIGHT, CHART_GRID_PADDING, GRID_LINES_COUNT, PREVIEW_HEIGHT } from '../consts';


const Y_ANIMATION_TIME = .3;
const OX_LABELS_ANIMATION_DURATION = 0.25;
const OY_LABELS_MARGIN_TOP = -10;

const MINI_CHART_HEIGHT = 50;
const MINI_CHART_MARGIN = 30;

export function ChartBase(w, h, data) {
  this.w = w;
  this.h = h;
  this.container = document.createElement('div');
  // me.container.id = 'chart container';
  this.container.style.width = w + 'px';
  this.container.style.height = h + 'px';
  this.container.style.position = 'relative';

  this.canvas = document.createElement('canvas');
  this.canvas.width = w;
  this.canvas.height = h;
  // this.canvas.onclick = this.onCanvasClick.bind(this);
  this.canvas.onmouseenter = this.onMouseEnter.bind(this);
  this.container.append(this.canvas);
  this.ctx = this.canvas.getContext('2d');

  this.preview = preview(this.w - CHART_GRID_PADDING*2, PREVIEW_HEIGHT);
  this.preview.style.position = 'absolute';
  this.preview.style.bottom = 0;
  this.preview.style.left = CHART_GRID_PADDING + 'px';
  this.container.append(this.preview);
  this.preview.onupdate = function(state) {
    this.updateRange(state.left, state.right);
  }.bind(this);

  this.previewLeftX = 0.8;
  this.previewRightX = 1;

  this.data = data;

  this.info;
  this.round = 1000;

  this.initData();
  this.L = this.oxLabels.length - 1; // FIXME Rename
}

ChartBase.prototype.initData = function(dataLength=Number.POSITIVE_INFINITY) {
  this.oxLabels = getDataColumnByName('x', this.data.columns).slice(0, dataLength).map(date => createLabelFromDate(date));

  this.columnNames = Object.keys(this.data.names); // FIXME Remove
  this.columns = [];
  for (var i = 0; i < this.columnNames.length; i++) {
    this.columns.push({
      id: this.columnNames[i],
      name: this.data.names[this.columnNames[i]],
      isOn: true,
      color: this.data.colors[this.columnNames[i]],
      alpha: new AnimatedValue(1, Y_ANIMATION_TIME),
      values: getDataColumnByName(this.columnNames[i], this.data.columns).slice(0, dataLength)
    });
  }
}

ChartBase.prototype.init = function() {
  this.initDrawProps();
  this.initOxProps();
  this.initOyProps();
  this.initMiniChartProps();

  // this.drawMini();
  this.initInfo();
  this.initButtons();
  this.update();
}

ChartBase.prototype.initDrawProps = function() {
  this.bottomY = this.h - OXLABELS_HEIGHT - MINI_CHART_HEIGHT - MINI_CHART_MARGIN; // FIXME rename to mainChartY
  this.oxLabelsBottomY = this.h - MINI_CHART_HEIGHT - MINI_CHART_MARGIN; // FIXME rename to oxLabelsY

  this.needRedraw = false;
  this.needDrawMini = true;

  this.gridWidth = this.w - CHART_GRID_PADDING*2;

  this.barWidth = 0; // FIXME rename to step
  this.offsetX = 0;

  this.startInd = 0;
  this.endInd = 0;
  this.selectedInd = -1;
  this.selectedScreenX = 0;
  this.selectedScreenY = 0;
}

ChartBase.prototype.initOxProps = function() {
  this.oxLabelWidth = 50;
  this.labelWidthHalf = 15; // FIXME Rename
  this.oxLabelsOffsetX = 0;

  this.countOnScreen = this.w/this.oxLabelWidth;
  this.currOxLabelsStep = 1;
  this.staticOxLabels = { step: 1, lastInd: 0, alpha: new AnimatedValue(1, OX_LABELS_ANIMATION_DURATION) };
  this.dynamicOxLabels = { step: 1, lastInd: 0, alpha: new AnimatedValue(1, OX_LABELS_ANIMATION_DURATION) };
}

ChartBase.prototype.initOyProps = function() {
  this.gridStepY = 0;
  this.gridMaxY = new AnimatedValue(0, Y_ANIMATION_TIME);

  this.gridLinesHeight = Math.round(this.bottomY / GRID_LINES_COUNT);
  this.oldOyLabels = {
    alpha: new AnimatedValue(0, Y_ANIMATION_TIME),
    offsetY: this.gridLinesHeight/2,
    labels: [0, 1, 2, 3, 4, 5, 6]
  };
  this.newOyLabels = {
    alpha: new AnimatedValue(1, Y_ANIMATION_TIME),
    offsetY: -this.gridLinesHeight/2,
    labels: [0, 1, 2, 3, 4, 5]
  };
}

ChartBase.prototype.initMiniChartProps = function(dataLength=this.L) {
  this.miniChartX = CHART_GRID_PADDING;
  this.miniChartY = this.h - MINI_CHART_HEIGHT + 1;
  this.miniChartWidth = this.w - CHART_GRID_PADDING*2;
  this.miniChartHeight = MINI_CHART_HEIGHT;
  this.miniChartStep = Math.round((this.miniChartWidth/(dataLength))*this.round)/this.round;
}

ChartBase.prototype.initInfo = function() {
  this.info = createInfo();
  for (var i = 0; i < this.columns.length; i++) {
    this.info.addRow(this.columns[i].name, 0);
  }
  this.container.append(this.info);
}

// ChartBase.prototype.onCanvasClick = function(e) {
//   if (e.layerY <= this.bottomY) {
//     select(e.layerX)
//   }
//   else {
//     this.selectedInd = -1;
//   }
//   this.draw();
// };

ChartBase.prototype.select = function(x, y) {
  this.selectedScreenX = x;
  this.selectedScreenY = y;
  this.selectedInd = this.getIndByScreenX(x);
  this.info.setTitle(this.oxLabels[this.selectedInd]);
  this.columns.forEach(c => {
    this.info.setRowValue(c.name, c.values[this.selectedInd]);
  });
}

ChartBase.prototype.updateRange = function(left, right) {
  this.previewLeftX = left;
  this.previewRightX = right;
  this.update();
}

ChartBase.prototype.drawBg = function() {
  this.drawOxLabels(this.staticOxLabels, this.oxLabels.length - 1);
  this.drawOxLabels(this.dynamicOxLabels, this.oxLabels.length - 1 - this.dynamicOxLabels.step/2); // Говно какое-то
  this.drawOyLabels(this.oldOyLabels);
  this.drawOyLabels(this.newOyLabels);
  this.drawZeroLine();
}

ChartBase.prototype.drawZeroLine = function () {
  this.ctx.beginPath();
  this.ctx.globalAlpha = 1;
  this.ctx.fillText(0, CHART_GRID_PADDING, this.bottomY + OY_LABELS_MARGIN_TOP);
  this.ctx.moveTo(CHART_GRID_PADDING, this.bottomY + 0.5);
  this.ctx.lineTo(this.w - CHART_GRID_PADDING, this.bottomY + 0.5);
  this.ctx.stroke();
};

ChartBase.prototype.calculateOxLabelsOffsetX = function () {
  this.oxLabelsOffsetX = this.offsetX - this.labelWidthHalf;
};

ChartBase.prototype.drawOxLabels = function(oxLabelsProps, lastInd) {
  if (oxLabelsProps.alpha.value <= 0) return;
  while(lastInd > this.endInd) lastInd -= oxLabelsProps.step;

  this.ctx.beginPath();
  this.ctx.globalAlpha = oxLabelsProps.alpha.value;
  this.ctx.fillStyle = 'black'; // FIXME color to consts

  for (var i = lastInd; i >= this.startInd; i-=oxLabelsProps.step) {
    this.ctx.fillText(this.oxLabels[i], Math.floor(i * this.barWidth + this.oxLabelsOffsetX), this.oxLabelsBottomY - OXLABELS_HEIGHT/2);
  }
}

ChartBase.prototype.updateOxLabels = function() {
  var step = Math.max(1, (this.endInd - this.startInd + 1) / this.countOnScreen); // FIXME если range не изменился, то и сюда не надо
  var p = 1;
  while (step > p) p *= 2;
  step = p;

  if (step === this.currOxLabelsStep) return;

  var now = performance.now();

  if (step > this.currOxLabelsStep) {
    this.currOxLabelsStep *= 2;
    this.dynamicOxLabels.alpha.set(1);
    this.dynamicOxLabels.alpha.set(0, now, true);
    this.staticOxLabels.step = this.currOxLabelsStep;
    this.dynamicOxLabels.step = this.currOxLabelsStep;
  }
  else if (step < this.currOxLabelsStep) {
    this.dynamicOxLabels.alpha.set(0);
    this.dynamicOxLabels.alpha.set(1, now, true);
    this.staticOxLabels.step = this.currOxLabelsStep;
    this.dynamicOxLabels.step = this.currOxLabelsStep;
    this.currOxLabelsStep /= 2;
  }
}

ChartBase.prototype.drawOyLabels = function(oyLabels) {
  if (oyLabels.alpha.value <= 0) return;
  this.ctx.globalAlpha = oyLabels.alpha.value;
  this.ctx.strokeStyle = 'black'; // FIXME color to const
  this.ctx.lineWidth = 1;
  this.ctx.beginPath();

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
    y -= 0.5;
    this.ctx.moveTo(CHART_GRID_PADDING, y);
    this.ctx.lineTo(this.w - CHART_GRID_PADDING, y);
  }
  this.ctx.stroke();
}

ChartBase.prototype.xToInd = function(x) {


  console.log('=======================');
  console.log('x', x/this.barWidth);
  console.log('floor', Math.floor(x/this.barWidth));
  console.log('ceil', Math.ceil(x/this.barWidth));
  console.log('round', Math.round(x/this.barWidth));


  var indOnScreen = Math.round(x/this.barWidth);
  var ind = this.startInd + indOnScreen;
  return ind;
}

ChartBase.prototype.initButtons = function() {
  var buttonsContainer = document.createElement('div')
  // for (var i = 0; i < this.columnNames.length; i++) {
  for (var i = 0; i < this.columns.length; i++) {
    var b = createButton(this.columns[i].color, this.columns[i].name, function(name, isOn) {
      this.buttonClicked(name, isOn);
    }.bind(this));
    buttonsContainer.append(b);
  }
  this.container.append(buttonsContainer);
}

ChartBase.prototype.buttonClicked = function() {}

ChartBase.prototype.draw = function() {
  requestAnimationFrame(function() {
    // this.ctx.clearRect(0, 0, this.w, this.oxLabelsBottomY);
    this.ctx.clearRect(0, 0, this.w, this.miniChartY);

    this.ctx.beginPath();
    this.ctx.rect(0, 0, this.w, this.bottomY);
    this.ctx.stroke()

    var now = performance.now();

    this.checkRedrawBg(now);
    this.checkRedrawChartsContent(now);

    this.drawBg();
    this.drawChartContent();
    this.drawSelected();

    if (this.needDrawMini) {
      this.needDrawMini = false;
      this.drawMini();
    }

    if (this.needRedraw) {
      this.needRedraw = false;
      this.draw();
    }

  }.bind(this));
}

ChartBase.prototype.checkRedrawBg = function(now) {
  if (this.gridMaxY.nextTick(now)) this.needRedraw = true;
  if (this.oldOyLabels.alpha.nextTick(now)) this.needRedraw = true;
  if (this.newOyLabels.alpha.nextTick(now)) this.needRedraw = true;
  if (this.dynamicOxLabels.alpha.nextTick(now)) this.needRedraw = true;
}

ChartBase.prototype.checkRedrawChartsContent = function(now) {
  for (var i = 0; i < this.columns.length; i++) {
    if (this.columns[i].alpha.nextTick(now)) {
      this.needRedraw = this.needDrawMini = true;
    }
  }
}

ChartBase.prototype.drawChartContent = function() {}

ChartBase.prototype.clearDrawMini = function() {
  this.ctx.clearRect(this.miniChartX-2, this.miniChartY, this.miniChartWidth+4, this.miniChartY);
}

ChartBase.prototype.calculateValuesMaxY = function() {
  return getMatrixMax(this.columns.filter(c => c.isOn).map(c => c.values.slice(this.startInd, this.endInd+1)));
}

ChartBase.prototype.updateY = function () {
  var maxY = this.calculateValuesMaxY();
  var newGridStepY = getStepForGridValues(maxY);

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
    this.newOyLabels.labels = [0, 1, 2, 3, 4, 5].map(n => n*newGridStepY);
  }
};

ChartBase.prototype.update = function() {
  // startInd = Math.floor(me.previewLeftX * L);
  this.startInd = Math.max(Math.ceil(this.previewLeftX * this.L) - 1, 0);
  this.endInd = Math.ceil(this.previewRightX * this.L);
  this.barWidth = this.gridWidth/(this.L*(this.previewRightX-this.previewLeftX));
  this.offsetX = calculateOffsetX(this.gridWidth, CHART_GRID_PADDING, this.previewLeftX, this.previewRightX);

  this.calculateOxLabelsOffsetX();
  this.updateOxLabels();

  this.updateY();

  this.draw();
}

ChartBase.prototype.onMouseEnter = function(e) {
  this.canvas.onmousemove = this.onMouseMove.bind(this);
  this.canvas.onmouseleave = this.onMouseLeave.bind(this);
}

ChartBase.prototype.onMouseMove = function (e) {
  if (e.layerY <= this.bottomY) {
    this.select(e.layerX, e.layerY)
  }
  else {
    this.selectedInd = -1;
  }
  this.draw();
}

ChartBase.prototype.onMouseLeave = function () {
  this.selectedInd = -1;
  this.canvas.onmousemove = null;
  this.canvas.onmouseleave = null;
  this.draw();
}

ChartBase.prototype.getScreenXByInd = function (i, step=this.barWidth, offset=this.offsetX) {
  return i*step + offset;
};

ChartBase.prototype.getIndByScreenX = function (x, step=this.barWidth, offset=this.offsetX) {
  return Math.round((x - offset)/step);
};

export function calculateOffsetX(w, padding, left, right) {
  return w + padding - right*w/(right-left);
}

export function getScreenXByInd(i, step, offset=0) {
  return i*step + offset;
}

export function getIndByScreenX(x, step, offset=0) {
  return Math.round((x - offset)/step);
}

export function getYCoords(height, Y, max) { // FIXME Можно удалить, потому что есть getScreenY
  var coords = []
  for (var i = 0; i < Y.length; i++) {
    coords.push(Math.floor(height - (Y[i]/max) * height));
  }
  return coords;
}

export function getScreenY(height, y, max) {
  var screenY = height - y*height/max;
  return Math.floor(screenY);
}
