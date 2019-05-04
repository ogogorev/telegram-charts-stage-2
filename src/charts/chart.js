import { preview } from './preview-ui';
import { createInfo } from './point-info';
import { createButton } from './button';
import { AnimatedValue } from '../animations';
import {
  createLabelFromDate,
  getMatrixMax,
  getStepForGridValues,
  getDataColumnByName,
  debounce
} from '../utils';
import {
  OXLABELS_HEIGHT,
  CHART_GRID_PADDING,
  GRID_LINES_COUNT,
  PREVIEW_HEIGHT,
  PREVIEW_INNER_MARGIN_TOP,
  CHART_HEADER_HEIGHT,
  CHART_HEADER_MARGIN_BOTTOM,
  CHART_MAX_WIDTH,
  CHART_MIN_HEIGHT,
  CHART_MAX_HEIGHT,
  Y_ANIMATION_TIME,
  OY_LABELS_MARGIN_TOP,
  PREVIEW_DAY_THEME,
  PREVIEW_NIGHT_THEME,
  CHART_DAY_THEME,
  CHART_NIGHT_THEME,
  OX_LABELS_ANIMATION_DURATION,
  PREVIEW_CHART_HEIGHT,
  PREVIEW_CHART_MARGIN,
} from '../consts';

export function ChartBase(container, data, name) {
  this.container = container;
  this.chartContainer = document.createElement('div');
  this.chartContainer.classList.add('chart');

  this.pixelRatio = window.devicePixelRatio;

  this.w = Math.min(container.getBoundingClientRect().width, CHART_MAX_WIDTH);
  this.h = 400;

  this.name = name;
  this.chartContainer.style.width = this.w + 'px';
  this.chartContainer.style.position = 'relative';

  this.initHeader();
  this.initCanvas();
  this.initPreviewUI();

  this.previewUILeftX = 0.8;
  this.previewUIRightX = 1;

  this.data = data;

  this.info;
  this.round = 1000;

  this.initData();
  this.L = this.oxLabels.length - 1; // FIXME Rename

  this.addListeners();

  container.append(this.chartContainer);
}

ChartBase.prototype.addListeners = function () {
  window.addEventListener('resize', debounce(this.onResize, 20).bind(this));
}

ChartBase.prototype.switchMode = function (isDay=true) {
  if (isDay) {
    this.previewUI.switchTheme(PREVIEW_DAY_THEME);
    this.initColors(CHART_DAY_THEME);
    this.header.style.color = CHART_DAY_THEME.chartTitleColor;
    this.info.style.backgroundColor = CHART_DAY_THEME.infoBackgroundColor;
    this.info.style.color = CHART_DAY_THEME.infoTextColor;
  }
  else {
    this.previewUI.switchTheme(PREVIEW_NIGHT_THEME);
    this.initColors(CHART_NIGHT_THEME);
    this.header.style.color = CHART_NIGHT_THEME.chartTitleColor;
    this.info.style.backgroundColor = CHART_NIGHT_THEME.infoBackgroundColor;
    this.info.style.color = CHART_NIGHT_THEME.infoTextColor;
  }
  this.draw();
}

ChartBase.prototype.initColors = function (theme) {
  this.gridLinesColor = theme.gridLinesColor;
  this.gridTextsColor = theme.gridTextsColor;
  this.chartTitleColor = theme.chartTitleColor;
};

ChartBase.prototype.initCanvas = function () {
  this.canvas = document.createElement('canvas');
  this.canvas.width = this.w * this.pixelRatio;
  this.canvas.height = this.h * this.pixelRatio;
  this.canvas.style.width = this.w + 'px';
  this.canvas.style.height = this.h + 'px';

  this.canvas.onmouseenter = this.onMouseEnter.bind(this);
  this.chartContainer.append(this.canvas);
  this.ctx = this.canvas.getContext('2d');
  this.ctx.scale(this.pixelRatio, this.pixelRatio);
}

ChartBase.prototype.initPreviewUI = function () {
  this.previewUI = preview(this.w - CHART_GRID_PADDING*2, PREVIEW_HEIGHT, this.pixelRatio);
  this.previewUI.style.position = 'absolute';
  this.previewUI.style.top = this.h - PREVIEW_INNER_MARGIN_TOP + 'px';
  this.previewUI.style.left = CHART_GRID_PADDING + 'px';

  this.previewUI.onupdate = function(state) {
    this.updateRange(state.left, state.right);
  }.bind(this);

  this.chartContainer.append(this.previewUI);
}

ChartBase.prototype.updateWidth = function() {
  this.canvas.width = this.w * this.pixelRatio;
  this.canvas.height = this.h * this.pixelRatio;
  this.canvas.style.width = this.w + 'px'
  this.ctx.scale(this.pixelRatio, this.pixelRatio);

  this.previewUI.updateWidth(this.w - CHART_GRID_PADDING*2, this.pixelRatio);

  this.header.style.width = this.w - CHART_GRID_PADDING*2 + 'px';
  this.gridWidth = this.w - CHART_GRID_PADDING*2;
  this.countOnScreen = this.w/this.oxLabelWidth;
  this.previewChartWidth = this.w - CHART_GRID_PADDING*2;
  this.previewChartStep = Math.round((this.previewChartWidth/(this.L))*this.round)/this.round;
  if (this.buttonsContainer) {
    this.buttonsContainer.style.width = this.w - CHART_GRID_PADDING*2 + 'px';
  }

  this.needDrawPreview = true;
  this.update();
}

ChartBase.prototype.updateHeight = function () {
  this.previewUI.style.top = this.h - PREVIEW_CHART_HEIGHT - PREVIEW_INNER_MARGIN_TOP + 'px';
  this.canvas.height = this.h;

  this.bottomY = this.h - OXLABELS_HEIGHT - PREVIEW_CHART_HEIGHT - PREVIEW_CHART_MARGIN;
  this.oxLabelsBottomY = this.h - PREVIEW_CHART_HEIGHT - PREVIEW_CHART_MARGIN;
  this.previewChartY = this.h - PREVIEW_CHART_HEIGHT + 1;
};

ChartBase.prototype.onResize = function(e) {
  var newWidth = this.container.getBoundingClientRect().width;
  var newHeight = this.container.getBoundingClientRect().height;

  newWidth = Math.min(newWidth, CHART_MAX_WIDTH);
  newHeight = Math.min(newHeight, CHART_MAX_HEIGHT);
  newHeight = Math.max(newHeight, CHART_MIN_HEIGHT);

  if (newWidth !== this.w || this.pixelRatio !== window.devicePixelRatio) {
    this.pixelRatio = window.devicePixelRatio;
    this.w = newWidth;
    this.updateWidth();
  }

  if (newHeight !== this.h) { }

};

ChartBase.prototype.initHeader = function () {
  this.header = document.createElement('div');
  this.header.classList.add('chart-header');
  this.header.style.width = this.w - CHART_GRID_PADDING*2 + 'px';
  this.header.style.height = CHART_HEADER_HEIGHT + 'px';
  // header.style.marginLeft = CHART_GRID_PADDING + 'px';
  this.header.style.margin = '0 0 ' + CHART_HEADER_MARGIN_BOTTOM + 'px ' + CHART_GRID_PADDING + 'px';

  var title = document.createElement('h4');
  title.innerHTML = this.name + ' ' + this.pixelRatio;
  this.header.append(title);

  this.dateRange = document.createElement('h5');
  // this.dateRange.id = this.name + 'date-range';
  this.dateRange.innerHTML = 'Sat, 11 Apr 2020 - Mon, 12 Mar 2021';
  this.header.append(this.dateRange);

  this.chartContainer.append(this.header);
}

ChartBase.prototype.updateDateRange = function (sI=this.startInd, eI=this.endInd) {
  this.dateRange.innerHTML = createLabelFromDate(this.dateColumn[sI], true) + ' - ' + createLabelFromDate(this.dateColumn[eI], true);
}

ChartBase.prototype.initData = function(dataLength=Number.POSITIVE_INFINITY) {
  this.dateColumn = getDataColumnByName('x', this.data.columns);
  this.oxLabels = this.dateColumn.slice(0, dataLength).map(date => createLabelFromDate(date));

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
  this.initPreviewChartProps();

  //test
  this.addUpdateButton();

  // this.drawpreview();
  this.initInfo();
  this.initButtons();
  this.update();
}

ChartBase.prototype.addUpdateButton = function() { // delete me
  var bm = document.createElement('button');
  var br = document.createElement('button');
  br.innerHTML = 'resize';
  bm.innerHTML = 'move';
  bm.onclick = function() {
    this.manualMove();
  }.bind(this)
  br.onclick = function() {
    this.manualResize();
  }.bind(this)
  this.container.append(br);
  this.container.append(bm);
}

ChartBase.prototype.manualResize = function() {

  var step = -0.03;
  var range = this.previewUIRightX - this.previewUILeftX;

  var interval = setInterval(function() {
    // if (this.previewUILeftX + step < 0 || this.previewUILeftX + step > 0.8) {
    //   step = -step;
    // }
    // this.previewUILeftX += step

    if (this.previewUIRightX + step > 1 || this.previewUIRightX + step < this.previewUILeftX + range) {
      step = -step;
    }
    this.previewUIRightX += step

    this.startUpdate();
    // this.update();
  }.bind(this), 10);

  setTimeout(() => {
    clearInterval(interval);
    console.log('interval cleared');
  }, 10000);

}

ChartBase.prototype.manualMove = function() {

  var step = -0.04;
  var range = this.previewUIRightX - this.previewUILeftX;

  var interval = setInterval(function() {
    if (this.previewUILeftX + step < 0 || this.previewUILeftX + step > 1 - range) {
      step = -step;
    }
    this.previewUILeftX += step
    this.previewUIRightX = this.previewUILeftX + range;
    this.startUpdate();
    // this.update();
  }.bind(this), 10);

  setTimeout(() => {
    clearInterval(interval);
    console.log('interval cleared');

  }, 10000);

}

ChartBase.prototype.initDrawProps = function() {
  this.initColors(CHART_DAY_THEME);

  this.drawIndOffset = 10;

  this.bottomY = this.h - OXLABELS_HEIGHT - PREVIEW_CHART_HEIGHT - PREVIEW_CHART_MARGIN; // FIXME rename to mainChartY
  this.oxLabelsBottomY = this.h - PREVIEW_CHART_HEIGHT - PREVIEW_CHART_MARGIN; // FIXME rename to oxLabelsY

  // this.needRedraw = false;
  this.needRedraw = true;
  this.needDrawPreview = true;

  this.gridWidth = this.w - CHART_GRID_PADDING*2;

  this.barWidth = 0; // FIXME rename to step
  this.offsetX = 0;

  this.oldRangeX = 0;
  this.currRangeX = 1;

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

ChartBase.prototype.initPreviewChartProps = function() {
  this.previewChartX = CHART_GRID_PADDING;
  this.previewChartY = this.h - PREVIEW_CHART_HEIGHT + 1;
  this.previewChartWidth = this.w - CHART_GRID_PADDING*2;
  this.previewChartHeight = PREVIEW_CHART_HEIGHT;
  this.previewChartStep = Math.round((this.previewChartWidth/(this.L))*this.round)/this.round;
}

ChartBase.prototype.initInfo = function() {
  this.info = createInfo();
  for (var i = 0; i < this.columns.length; i++) {
    this.info.addRow(this.columns[i].name, 0, this.columns[i].color);
  }
  this.chartContainer.append(this.info);
}

ChartBase.prototype.select = function(x, y) {
  this.selectedScreenX = x;
  this.selectedScreenY = y;
  this.selectedInd = this.getIndByScreenX(x);
  this.info.setTitle(createLabelFromDate(this.dateColumn[this.selectedInd], true));
  this.columns.filter(c => c.isOn).forEach(c => {
    this.info.setRowValue(c.name, c.values[this.selectedInd]);
  });
}

ChartBase.prototype.updateRange = function(left, right) {
  this.previewUILeftX = left;
  this.previewUIRightX = right;
  // this.update();
  this.startUpdate();
}

ChartBase.prototype.drawBg = function() {
  this.drawOxLabels(this.staticOxLabels, this.oxLabels.length - 1);
  this.drawOxLabels(this.dynamicOxLabels, this.oxLabels.length - 1 - Math.floor(this.dynamicOxLabels.step/2)); // Говно какое-то
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

  // if (this.name) console.log('draw ox', this.name);

  while(lastInd > this.endInd) lastInd -= oxLabelsProps.step;

  this.ctx.beginPath();
  this.ctx.globalAlpha = oxLabelsProps.alpha.value;
  this.ctx.fillStyle = this.gridTextsColor;

  for (var i = lastInd; i >= this.startInd; i-=oxLabelsProps.step) {
    this.ctx.fillText(this.oxLabels[i], Math.floor(i * this.barWidth + this.oxLabelsOffsetX), this.oxLabelsBottomY - OXLABELS_HEIGHT/2);
  }
}

ChartBase.prototype.updateOxLabels = function() {
  var step = Math.max(1, (this.endInd - this.startInd + 1) / this.countOnScreen); // FIXME если range не изменился, то и сюда не надо
  var p = 1;
  while (step > p) p *= 2;
  step = p;


  // if (this.name === 'Stacked bar chart') {
  //   console.log('update ox', this.name);
  //   console.log('step', step);
  //   console.log('curr step', this.currOxLabelsStep);
  // }

  if (step === this.currOxLabelsStep) return false;


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

  // this.draw();
  return true;
}

ChartBase.prototype.drawOyLabels = function(oyLabels) {
  if (oyLabels.alpha.value <= 0) return;
  this.ctx.globalAlpha = oyLabels.alpha.value;
  this.ctx.strokeStyle = this.gridLinesColor;
  this.ctx.fillStyle = this.gridTextsColor;
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

ChartBase.prototype.initButtons = function() {
  this.buttonsContainer = document.createElement('div');
  this.buttonsContainer.style.width = this.w - CHART_GRID_PADDING*2 + 'px';
  this.buttonsContainer.style.marginLeft = CHART_GRID_PADDING + 'px';
  this.buttonsContainer.classList.add('buttons-container');

  for (var i = 0; i < this.columns.length; i++) {
    var b = createButton(this.columns[i].color, this.columns[i].name, function(name, isOn) {
      this.buttonClicked(name, isOn);
    }.bind(this));
    this.buttonsContainer.append(b);
  }

  this.chartContainer.append(this.buttonsContainer);
}

ChartBase.prototype.buttonClicked = function() {}

ChartBase.prototype.drawFrame = function() {
  // this.ctx.beginPath();
  // this.ctx.strokeStyle = '#000000'
  // this.ctx.rect(0, 0, this.w, this.bottomY);
  // this.ctx.stroke()
}

ChartBase.prototype.drawSequence = function() {
  this.drawBg();
  this.drawChartContent();
  this.drawSelected();
}


ChartBase.prototype.drawSelectedChartContent = function () {}

ChartBase.prototype.drawSelected = function() {
  if (this.selectedInd >= 0) {
    this.drawSelectedChartContent();

    this.info.style.left = Math.max(this.selectedScreenX - this.info.offsetWidth - 30, 0) + 'px'; // FIXME this.info margin
    this.info.style.top = Math.max(this.selectedScreenY - this.info.offsetHeight, 0) + 'px';
    this.info.appear();
  }
  else {
    this.info.disappear()
  }
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
      this.needRedraw = this.needDrawPreview = true;
    }
  }
}

ChartBase.prototype.drawChartContent = function() {}

ChartBase.prototype.clearDrawPreview = function() {
  this.ctx.clearRect(this.previewChartX-2, this.previewChartY, this.previewChartWidth+4, this.previewChartY);
}

ChartBase.prototype.calculateValuesMaxY = function() {
  var t = getMatrixMax(this.columns.filter(c => c.isOn).map(c => c.values.slice(this.startInd, this.endInd+1)));
  return getMatrixMax(this.columns.filter(c => c.isOn).map(c => c.values.slice(this.startInd, this.endInd+1)));
}

ChartBase.prototype.updateY = function () {
  var maxY = this.calculateValuesMaxY();
  var newGridStepY = getStepForGridValues(maxY);

  if (this.gridStepY !== newGridStepY) {
    var now = performance.now();

    // console.log('new grid step', newGridStepY)
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

ChartBase.prototype.onMouseEnter = function(e) {
  this.canvas.onmousemove = this.onMouseMove.bind(this);
  this.canvas.onmouseleave = this.onMouseLeave.bind(this);
}

ChartBase.prototype.onMouseMove = function (e) {
  if (e.layerY <= this.bottomY) {
    if (e.layerX > CHART_GRID_PADDING && e.layerX < this.w - CHART_GRID_PADDING) {
      this.select(e.layerX, e.layerY)
    }
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

ChartBase.prototype.update = function() {
  requestAnimationFrame(function() {

  this.startInd = Math.max(Math.ceil(this.previewUILeftX * this.L) - 1, 0);
  this.endInd = Math.ceil(this.previewUIRightX * this.L);
  this.barWidth = this.gridWidth/(this.L*(this.previewUIRightX-this.previewUILeftX));
  this.offsetX = calculateOffsetX(this.gridWidth, CHART_GRID_PADDING, this.previewUILeftX, this.previewUIRightX);

  this.updateDateRange();
  this.calculateOxLabelsOffsetX();
  this.updateY();

  // this.update();

  // ------------------- DRAW -------------------

  this.ctx.clearRect(0, 0, this.w, this.previewChartY);

  var now = performance.now();
  this.needRedraw = false;

  if (this.updateOxLabels()) this.needRedraw = true;

  this.checkRedrawBg(now);
  this.checkRedrawChartsContent(now);

  this.previewUI.draw();

  this.drawSequence();

  if (this.needDrawPreview) {
    this.needDrawPreview = false;
    this.drawPreview();
  }

  if (this.needRedraw) {
    // this.needRedraw = false;
    // this.draw();
    this.update();
  }

  }.bind(this));
}

ChartBase.prototype.startUpdate = function () {
  if (!this.needRedraw) {
    this.needRedraw = true;
    this.update();
  }
};

ChartBase.prototype.draw = function() {
  this.update();
  return;
  // requestAnimationFrame(function() {
  //   this.ctx.clearRect(0, 0, this.w, this.previewChartY);
  //
  //   if (this.updateOxLabels()) this.needRedraw = true;
  //
  //   var now = performance.now();
  //
  //   this.checkRedrawBg(now);
  //   this.checkRedrawChartsContent(now);
  //
  //   this.previewUI.draw();
  //
  //   this.drawSequence();
  //
  //   if (this.needDrawPreview) {
  //     this.needDrawPreview = false;
  //     this.drawPreview();
  //   }
  //
  //   if (this.needRedraw) {
  //     this.needRedraw = false;
  //     this.draw();
  //   }
  // }.bind(this));
}

export function calculateOffsetX(w, padding, left, right) {
  return w + padding - right*w/(right-left);
}

export function getScreenXByInd(i, step, offset=0) {
  return i*step + offset;
}

export function getIndByScreenX(x, step, offset=0) {
  return Math.round((x - offset)/step);
}

export function getYCoords(height, Y, max) {
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
