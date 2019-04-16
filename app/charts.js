const PREVIEW_HEIGHT = 44;
const PREVIEW_INNER_MARGIN_TOP = 2;
const PREVIEW_INIT_W = 0.2;

const PREVIEW_CHART_HEIGHT = 40;
const PREVIEW_CHART_MARGIN = 30;

const CHART_GRID_PADDING = 10;
const GRID_LINES_COUNT = 6;
const OXLABELS_HEIGHT = 30;
const OX_LABELS_ANIMATION_DURATION = 0.25;

const CHART_HEADER_HEIGHT = 20;
const CHART_HEADER_MARGIN_BOTTOM = 20;

const CHART_MAX_WIDTH = 500;
const CHART_MIN_HEIGHT = 150 + CHART_HEADER_HEIGHT + CHART_HEADER_MARGIN_BOTTOM + 80;
const CHART_MAX_HEIGHT = 400 + CHART_HEADER_HEIGHT + CHART_HEADER_MARGIN_BOTTOM + 80;

const Y_ANIMATION_TIME = .3;
const OY_LABELS_MARGIN_TOP = -5;

const CHART_DAY_THEME = {
  gridLinesColor: '#182D3B1A',
  gridTextsColor: '#8E8E93',
  chartTitleColor: '#000000',
  infoBackgroundColor: '#FFFFFF',
  infoTextColor: '#000000',
};

const CHART_NIGHT_THEME = {
  gridLinesColor: '#FFFFFF1A',
  gridTextsColor: '#A3B1C299',
  chartTitleColor: '#FFFFFF',
  infoBackgroundColor: '#242F3E',
  infoTextColor: '#FFFFFF',
};

const PREVIEW_DAY_THEME = {
  previewMaskColor: '#E2EEF9',
  previewMaskAlpha: .6,
  previewBorderColor: '#C0D1E1',
  previewCornersFillColor: '#FFFFFF'
};

const PREVIEW_NIGHT_THEME = {
  previewMaskColor: '#304259',
  previewMaskAlpha: .6,
  previewBorderColor: '#56626D',
  previewCornersFillColor: '#242F3E'
};

function ChartBase(container, data, name) {
  this.container = container;
  this.chartContainer = document.createElement('div');
  this.chartContainer.classList.add('chart');

  this.w = Math.min(container.getBoundingClientRect().width, CHART_MAX_WIDTH);
  this.h = 400
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
  this.L = this.oxLabels.length - 1;

  this.addListeners();

  container.append(this.chartContainer);
}

ChartBase.prototype.addListeners = function () {}

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
  this.canvas.width = this.w;
  this.canvas.height = this.h;
  this.canvas.onmouseenter = this.onMouseEnter.bind(this);
  this.chartContainer.append(this.canvas);
  this.ctx = this.canvas.getContext('2d');
}

ChartBase.prototype.initPreviewUI = function () {
  this.previewUI = preview(this.w - CHART_GRID_PADDING*2, PREVIEW_HEIGHT);
  this.previewUI.style.position = 'absolute';
  this.previewUI.style.top = this.h - PREVIEW_INNER_MARGIN_TOP + 'px';
  this.previewUI.style.left = CHART_GRID_PADDING + 'px';

  this.previewUI.onupdate = function(state) {
    this.updateRange(state.left, state.right);
  }.bind(this);

  this.chartContainer.append(this.previewUI);
}

ChartBase.prototype.updateWidth = function() {
  this.chartContainer.style.width = this.w + 'px';
  this.canvas.width = this.w;
  this.previewUI.updateWidth(this.w - CHART_GRID_PADDING*2);

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

ChartBase.prototype.onResize = debounce(function(e) {
  var newWidth = this.container.getBoundingClientRect().width;
  var newHeight = this.container.getBoundingClientRect().height;

  newWidth = Math.min(newWidth, CHART_MAX_WIDTH);
  newHeight = Math.min(newHeight, CHART_MAX_HEIGHT);
  newHeight = Math.max(newHeight, CHART_MIN_HEIGHT);

  if (newWidth !== this.w) {
    this.w = newWidth;
    this.updateWidth();
  }

  if (newHeight !== this.h) {}

}, 20);

ChartBase.prototype.initHeader = function () {
  this.header = document.createElement('div');
  this.header.classList.add('chart-header');
  this.header.style.width = this.w - CHART_GRID_PADDING*2 + 'px';
  this.header.style.height = CHART_HEADER_HEIGHT + 'px';
  this.header.style.margin = '0 0 ' + CHART_HEADER_MARGIN_BOTTOM + 'px ' + CHART_GRID_PADDING + 'px';

  var title = document.createElement('h4');
  title.innerHTML = this.name;
  this.header.append(title);

  this.dateRange = document.createElement('h5');
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

  this.columnNames = Object.keys(this.data.names);
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

  this.initInfo();
  this.initButtons();
  this.update();
}

ChartBase.prototype.initDrawProps = function() {
  this.initColors(CHART_DAY_THEME);

  this.drawIndOffset = 10;

  this.bottomY = this.h - OXLABELS_HEIGHT - PREVIEW_CHART_HEIGHT - PREVIEW_CHART_MARGIN;
  this.oxLabelsBottomY = this.h - PREVIEW_CHART_HEIGHT - PREVIEW_CHART_MARGIN;

  this.needRedraw = false;
  this.needDrawPreview = true;

  this.gridWidth = this.w - CHART_GRID_PADDING*2;

  this.barWidth = 0;
  this.offsetX = 0;

  this.startInd = 0;
  this.endInd = 0;
  this.selectedInd = -1;
  this.selectedScreenX = 0;
  this.selectedScreenY = 0;
}

ChartBase.prototype.initOxProps = function() {
  this.oxLabelWidth = 50;
  this.labelWidthHalf = 15;
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
  this.update();
}

ChartBase.prototype.drawBg = function() {
  this.drawOxLabels(this.staticOxLabels, this.oxLabels.length - 1);
  this.drawOxLabels(this.dynamicOxLabels, this.oxLabels.length - 1 - Math.floor(this.dynamicOxLabels.step/2));
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
  this.ctx.fillStyle = this.gridTextsColor;

  for (var i = lastInd; i >= this.startInd; i-=oxLabelsProps.step) {
    this.ctx.fillText(this.oxLabels[i], Math.floor(i * this.barWidth + this.oxLabelsOffsetX), this.oxLabelsBottomY - OXLABELS_HEIGHT/2);
  }
}

ChartBase.prototype.updateOxLabels = function() {
  var step = Math.max(1, (this.endInd - this.startInd + 1) / this.countOnScreen);
  var p = 1;
  while (step > p) p *= 2;
  step = p;

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

ChartBase.prototype.draw = function() {
  requestAnimationFrame(function() {
    this.ctx.clearRect(0, 0, this.w, this.previewChartY);

    if (this.updateOxLabels()) this.needRedraw = true;

    var now = performance.now();

    this.checkRedrawBg(now);
    this.checkRedrawChartsContent(now);

    this.drawSequence();

    if (this.needDrawPreview) {
      this.needDrawPreview = false;
      this.drawPreview();
    }

    if (this.needRedraw) {
      this.needRedraw = false;
      this.draw();
    }

  }.bind(this));
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

    this.info.style.left = Math.max(this.selectedScreenX - this.info.offsetWidth - 30, 0) + 'px';
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
  this.startInd = Math.max(Math.ceil(this.previewUILeftX * this.L) - 1, 0);
  this.endInd = Math.ceil(this.previewUIRightX * this.L);
  this.barWidth = this.gridWidth/(this.L*(this.previewUIRightX-this.previewUILeftX));
  this.offsetX = calculateOffsetX(this.gridWidth, CHART_GRID_PADDING, this.previewUILeftX, this.previewUIRightX);

  this.updateDateRange();
  this.calculateOxLabelsOffsetX();
  this.updateY();

  this.draw();
}

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

function calculateOffsetX(w, padding, left, right) {
  return w + padding - right*w/(right-left);
}

function getScreenXByInd(i, step, offset=0) {
  return i*step + offset;
}

function getIndByScreenX(x, step, offset=0) {
  return Math.round((x - offset)/step);
}

function getYCoords(height, Y, max) {
  var coords = []
  for (var i = 0; i < Y.length; i++) {
    coords.push(Math.floor(height - (Y[i]/max) * height));
  }
  return coords;
}

function getScreenY(height, y, max) {
  var screenY = height - y*height/max;
  return Math.floor(screenY);
}

function lineChart(container, data, name) {
  var chart = new LineChart(container, data, name);
  return chart;
}

function LineChart(container, data) {
  ChartBase.apply(this, arguments);
  this.init();
}

LineChart.prototype = Object.create(ChartBase.prototype);
LineChart.prototype.constructor = LineChart;

LineChart.prototype.addListeners = function () {
  window.addEventListener('resize', this.onResize.bind(this));
}

LineChart.prototype.onResize = debounce(function(e) {
  var newWidth = this.container.getBoundingClientRect().width;
  var newHeight = this.container.getBoundingClientRect().height;


  newWidth = Math.min(newWidth, CHART_MAX_WIDTH);
  newHeight = Math.min(newHeight, CHART_MAX_HEIGHT);
  newHeight = Math.max(newHeight, CHART_MIN_HEIGHT);

  if (newWidth !== this.w) {
    this.w = newWidth;
    this.updateWidth();
  }

  if (newHeight !== this.h) {}

}, 20);

LineChart.prototype.initData = function() {
  ChartBase.prototype.initData.call(this);
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
      if (isOn) {
        this.columns[i].alpha.set(1, now, true);
        this.info.enableRow(this.columns[i].name);
      }
      else {
        this.columns[i].alpha.set(0, now, true);
        this.info.disableRow(this.columns[i].name);
      }
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
  var sI = Math.max(this.startInd - this.drawIndOffset, 0);
  var eI = Math.min(this.endInd + this.drawIndOffset, this.L);

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

LineChart.prototype.drawSelectedChartContent = function() {
    var barW = Math.round(this.barWidth*this.round)/this.round;
    var selectedIndX = Math.floor(this.getScreenXByInd(this.selectedInd, barW));
    var maxScreenY = 0;


    var ind = this.selectedInd - this.startInd;
    var filteredColumns = this.columns.filter(c => c.isOn);

    this.ctx.beginPath();
    this.ctx.globalAlpha = 1;
    this.ctx.strokeStyle = this.gridLinesColor;
    this.ctx.lineWidth = 1;
    this.ctx.moveTo(this.selectedScreenX + 0.5, 0);
    this.ctx.lineTo(this.selectedScreenX + 0.5, this.bottomY);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.fillStyle = '#FFFFFF';
    filteredColumns.forEach(c => {
      var y = Math.floor(getScreenY(this.bottomY, c.values[this.selectedInd], this.getGridMaxForColumn(c)));
      if (y > maxScreenY) maxScreenY = y;

      this.ctx.arc(
        selectedIndX,
        y,
        5.5,
        0,
        2 * Math.PI
      );
    });
    this.ctx.fill();

    filteredColumns.forEach(c => {
      this.ctx.beginPath();
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = this.data.colors[c.id];
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
  X[0] += 1
  X[X.length-1] -= 1;

  this.ctx.beginPath();
  for (var i = 0; i < this.columns.length; i++) {
    var Y = getYCoords(this.previewChartHeight, this.columns[i].values, this.getGridMaxForColumnPreview(this.columns[i]))
    .map(y => Math.max(this.previewChartY + y, this.previewChartY));

    this.drawLine(X, Y, this.columns[i].color, this.columns[i].alpha.value);
  }
}

function twoAxesLineChart(container, data, name) {
  var chart = new TwoAxesLineChart(container, data, name);
  return chart;
}

function TwoAxesLineChart(container, data) {
  LineChart.apply(this, arguments);
}

TwoAxesLineChart.prototype = Object.create(LineChart.prototype);
TwoAxesLineChart.prototype.constructor = TwoAxesLineChart;

TwoAxesLineChart.prototype.addListeners = function () {
  window.addEventListener('resize', this.onResize.bind(this));
}

TwoAxesLineChart.prototype.onResize = debounce(function(e) {
  var newWidth = this.container.getBoundingClientRect().width;
  var newHeight = this.container.getBoundingClientRect().height;

  newWidth = Math.min(newWidth, CHART_MAX_WIDTH);
  newHeight = Math.min(newHeight, CHART_MAX_HEIGHT);
  newHeight = Math.max(newHeight, CHART_MIN_HEIGHT);

  if (newWidth !== this.w) {
    this.w = newWidth;
    this.updateWidth();
  }

  if (newHeight !== this.h) {
  }

}, 20)

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

function barChart(container, data, name) {
  var chart = new BarChart(container, data, name);
  return chart;
}

function BarChart(container, data) {
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

  newWidth = Math.min(newWidth, CHART_MAX_WIDTH);
  newHeight = Math.min(newHeight, CHART_MAX_HEIGHT);
  newHeight = Math.max(newHeight, CHART_MIN_HEIGHT);

  if (newWidth !== this.w) {
    this.w = newWidth;
    this.updateWidth();
  }

  if (newHeight !== this.h) {}

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
  this.ctx.globalAlpha = 1;
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
  this.ctx.globalAlpha = (this.selectedInd > -1) ? 0.6 : 1;
  var barW = Math.round(this.barWidth*this.round)/this.round;
  var sI = Math.max(this.startInd - this.drawIndOffset, 0);
  var eI = Math.min(this.endInd + this.drawIndOffset, this.L);

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
    this.info.style.left = Math.max(this.selectedScreenX - this.info.offsetWidth - 30, 0) + 'px';
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

function stackedBarChart(container, data, name) {
  var chart = new StackedBarChart(container, data, name);
  return chart;
}

function StackedBarChart(container, data) {
  BarChart.apply(this, arguments);
}

StackedBarChart.prototype = Object.create(BarChart.prototype);
StackedBarChart.prototype.constructor = StackedBarChart;

StackedBarChart.prototype.addListeners = function () {
  window.addEventListener('resize', this.onResize.bind(this));
}

StackedBarChart.prototype.onResize = debounce(function(e) {
  var newWidth = this.container.getBoundingClientRect().width;
  var newHeight = this.container.getBoundingClientRect().height;

  newWidth = Math.min(newWidth, CHART_MAX_WIDTH);
  newHeight = Math.min(newHeight, CHART_MAX_HEIGHT);
  newHeight = Math.max(newHeight, CHART_MIN_HEIGHT);

  if (newWidth !== this.w) {
    this.w = newWidth;
    this.updateWidth();
  }

  if (newHeight !== this.h) {}

}, 20);

StackedBarChart.prototype.initData = function() {
  ChartBase.prototype.initData.call(this);

  this.stackedColumns = this.columns.map(c => c.values.map(
    v => 0
  ));

  this.stackedColumnsAnimated = this.columns.map(c => c.values.map(
    v => new AnimatedValue(0, Y_ANIMATION_TIME)
  ));

  this.updateStackedColumns();
}

StackedBarChart.prototype.initInfo = function() {
  ChartBase.prototype.initInfo.apply(this);
  this.info.addRow('All', 0, '#000000');
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

  this.gridPreviewMaxY = new AnimatedValue(0, Y_ANIMATION_TIME);
  this.gridPreviewMaxY.set(this.calculateGridPreviewMaxY(), performance.now(), true);
}

StackedBarChart.prototype.calculateGridPreviewMaxY = function () {
  var arr = this.stackedColumns[this.stackedColumns.length-1];
  return getMax(arr);
};

StackedBarChart.prototype.initButtons = ChartBase.prototype.initButtons;

StackedBarChart.prototype.buttonClicked = function(name, isOn) {
  var now = performance.now();
  for (var i = 0; i < this.columns.length; i++) {
    if (this.columns[i].name === name) {
      this.columns[i].isOn = isOn;
      if (isOn) this.info.enableRow(this.columns[i].name);
      else this.info.disableRow(this.columns[i].name);
      this.updateStackedColumns();

      if (this.columns.filter(c => c.isOn).length < 1) {
        this.info.disableRow('All')
      }
      else {
        this.info.enableRow('All')
      }

      this.gridPreviewMaxY.set(Math.max(this.calculateGridPreviewMaxY(), 0), now, true);
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
        this.needRedraw = this.needDrawPreview = true;
      }
    }
  }
  if (this.gridPreviewMaxY.nextTick(now)) this.needDrawPreview = true;
}

StackedBarChart.prototype.drawChartContent = function() {
  var barW = Math.round(this.barWidth*this.round)/this.round;
  var sI = Math.max(this.startInd - this.drawIndOffset, 0);
  var eI = Math.min(this.endInd + this.drawIndOffset, this.L);

  var X = [];
  for (var i = sI; i < eI+1; i++) {
    X.push(getScreenXByInd(i, barW, this.offsetX));
  }

  var YCoords = this.stackedColumnsAnimated.map(c => c.slice(sI, eI+1))
    .map(c => getYCoords(this.bottomY, c.map(v => v.value), this.gridMaxY.value));
  YCoords.splice(0, 0, YCoords[1].map(c => this.bottomY));

  this.ctx.globalAlpha = (this.selectedInd > -1) ? 0.6 : 1;

  for (var i = this.columns.length-1; i >= 0; i--) {
    this.ctx.beginPath();

    for (var j = 0; j < X.length; j++) {
      if (j !== this.selectedInd - sI) {
        this.ctx.rect(X[j], YCoords[i+1][j], barW, YCoords[i][j] - YCoords[i+1][j]);
      }
    }

    this.ctx.fillStyle = this.columns[i].color;
    this.ctx.fill();
  }

  if (this.selectedInd > -1) {
    this.drawSelectedChartContent();
  }

}

StackedBarChart.prototype.select = function(x, y) {
  this.selectedScreenX = x;
  this.selectedScreenY = y;
  this.selectedInd = this.getIndByScreenX(x);
  this.info.setTitle(createLabelFromDate(this.dateColumn[this.selectedInd], true));
  this.columns.filter(c => c.isOn).forEach(c => {
    this.info.setRowValue(c.name, c.values[this.selectedInd]);
    this.info.setRowValue('All', this.stackedColumns[this.stackedColumns.length-1][this.selectedInd]);
  });
}

StackedBarChart.prototype.drawSelectedChartContent = function () {
  var barW = Math.round(this.barWidth*this.round)/this.round;
  var selectedIndX = this.getScreenXByInd(this.selectedInd);

  this.ctx.globalAlpha = 1;

  for (var i = this.columns.length-1; i >= 0; i--) {
    var y = Math.floor(getScreenY(this.bottomY, this.stackedColumnsAnimated[i][this.selectedInd].value, this.gridMaxY.value))
    this.ctx.beginPath();
    this.ctx.fillStyle = this.columns[i].color;
    this.ctx.rect(selectedIndX, y, barW, this.bottomY - y);
    this.ctx.fill();
  }
}

StackedBarChart.prototype.drawPreview = function() {
  this.clearDrawPreview();

  var X = [];
  for (var i = 0; i < this.oxLabels.length; i++) {
    X.push(getScreenXByInd(i, this.previewChartStep, this.previewChartX));
  }
  var barWidth = X[1] - X[0];

  var YCoords = this.stackedColumnsAnimated.map(
    c => getYCoords(this.previewChartHeight, c.map(v => v.value), this.gridPreviewMaxY.value).map(y => this.previewChartY + y)
  );
  YCoords.splice(0, 0, YCoords[1].map(c => this.h));

  for (var i = this.columns.length-1; i >= 0; i--) {

    this.ctx.beginPath();
    this.ctx.globalAlpha = 1;

    for (var j = 0; j < X.length; j++) {
      this.ctx.rect(X[j], YCoords[i+1][j], barWidth, YCoords[i][j] - YCoords[i+1][j]);
    }

    this.ctx.fillStyle = this.columns[i].color;
    this.ctx.fill();
  }
}

function percentageStackedAreaChart(container, data, name) {
  var chart = new PercentageStackedAreaChart(container, data, name);
  return chart;
}

function PercentageStackedAreaChart(container, data) {
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

  newWidth = Math.min(newWidth, CHART_MAX_WIDTH);
  newHeight = Math.min(newHeight, CHART_MAX_HEIGHT);
  newHeight = Math.max(newHeight, CHART_MIN_HEIGHT);

  if (newWidth !== this.w) {
    this.w = newWidth;
    this.updateWidth();
  }

  if (newHeight !== this.h) {}

}, 20);

PercentageStackedAreaChart.prototype.initData = function() {
  ChartBase.prototype.initData.call(this);

  this.percents = this.columns[0].values.map(v => this.columns.map(c => new AnimatedValue(0, Y_ANIMATION_TIME)))
  this.updatePercents();
}

PercentageStackedAreaChart.prototype.updateY = function() {}

PercentageStackedAreaChart.prototype.initOyProps = function() {
  ChartBase.prototype.initOyProps.apply(this);

  this.marginTop = 20;

  this.percentageLabels = {
    alpha: { value: 1},
    offsetY: 0,
    labels: [0, 25, 50, 75, 100]
  };
  this.gridLinesHeight = Math.round((this.bottomY - this.marginTop) / 4);

  this.gridOyTextsColor = '#25252990';
}


PercentageStackedAreaChart.prototype.drawOyLabels = function(oyLabels) {
  this.ctx.globalAlpha = oyLabels.alpha.value;
  this.ctx.strokeStyle = this.gridLinesColor;
  this.ctx.fillStyle = this.gridOyTextsColor;
  this.ctx.lineWidth = 1;
  this.ctx.beginPath();

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

PercentageStackedAreaChart.prototype.checkRedrawChartsContent = function(now) {
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
      this.columns[i].isOn = isOn;
      this.updatePercents();
      this.update();
    }
  }
}

PercentageStackedAreaChart.prototype.drawChartContent = function() {
  var barW = Math.round(this.barWidth*this.round)/this.round;
  var sI = Math.max(this.startInd - this.drawIndOffset, 0);
  var eI = Math.min(this.endInd + this.drawIndOffset, this.L);

  var X = [];
  for (var i = sI; i < eI+1; i++) {
    X.push(getScreenXByInd(i, barW, this.offsetX));
  }

  var mins = transpose(this.percents).map(c => getMin(c.map(v => v.value)));

  X = X.concat(X[X.length-1], X[0]);
  for (var i = this.columns.length - 1; i >= 0 ; i--) {
    var values = this.percents.map(p => p[i]).slice(sI, eI+1);
    var Y = values.map(v => getScreenY(this.bottomY - this.marginTop, v.value, 100) + this.marginTop);

    var m = getScreenY(this.bottomY - this.marginTop, (mins[i-1]) ? mins[i-1] : 0, 100) + this.marginTop;
    Y = Y.concat(m, m);
    this.drawArea(X, Y, this.columns[i].color);
  }

  this.drawOyLabels(this.percentageLabels);
  this.drawZeroLine();
}

PercentageStackedAreaChart.prototype.drawArea = function (X, Y, color, alpha=1) {
    this.ctx.beginPath();
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = color;
    this.ctx.lineWidth = 1;

    this.ctx.moveTo(X[0], Y[0]);
    for (let i=1; i < X.length; i++) {
      this.ctx.lineTo(X[i], Y[i]);
    }
    this.ctx.fill();
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

  var mins = transpose(this.percents).map(c => getMin(c.map(v => v.value)));

  for (var i = this.columns.length - 1; i >= 0 ; i--) {
    var values = this.percents.map(p => p[i]);
    var Y = values.map(v => getScreenY(this.previewChartHeight, v.value, 100));
    var m = getScreenY(this.previewChartHeight, (mins[i-1]) ? mins[i-1] : 0, 100);
    Y = Y.concat(m, m).map(y => Math.max(this.previewChartY + y, this.previewChartY));

    this.drawArea(X, Y, this.columns[i].color);
  }
}

PercentageStackedAreaChart.prototype.drawSelectedChartContent = function() {
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.gridLinesColor;
    this.ctx.lineWidth = 1;
    this.ctx.moveTo(this.selectedScreenX + 0.5, 0);
    this.ctx.lineTo(this.selectedScreenX + 0.5, this.bottomY);
    this.ctx.stroke();
}

function createButton(color, text, onClick) {
  var button = document.createElement('button');
  button.name = text;
  button.isOn = true;
  button.classList.add('chart-button');
  button.classList.add('checkmark');
  button.style.backgroundColor = color;

  var i = document.createElement('img');
  i.setAttribute('src', 'check.svg');
  button.append(i)
  button.append(document.createTextNode(text));

  button.onclick = function() {
    button.isOn = !button.isOn;
    if (!button.isOn) {}
    if (onClick) onClick(button.name, button.isOn);
  };

  return button;
}

const INFO_ANIMATION_TIME = 0.3;

function createInfo(name) {
  var container = document.createElement('div');
  container.classList.add('point-info');
  container.style.transition = 'opacity ' + INFO_ANIMATION_TIME + 's';
  container.style.opacity = 0;
  container.style.display = 'none';
  container.isOn = false;

  var title = document.createElement('h4');
  title.classList.add('point-info-title');
  title.innerHTML = 'Title';

  container.appear = function() {
    container.isOn = true;
    container.style.display = 'block';

    setTimeout(function() {
      container.style.opacity = 1;
    }, 0)
  }

  container.disappear = function() {
    if (container.isOn) {
      container.isOn = false;
      container.style.opacity = 0;
      setTimeout(function() {
        container.style.display = 'none';
      }, INFO_ANIMATION_TIME * 1000)
    }
  }

  container.setTitle = function(text) {
    title.innerHTML = text;
  }

  var rows = {};

  container.addRow = function(text, value, color='black') {
    var newRow = document.createElement('div');
    newRow.id = 'row' + text;
    newRow.classList.add('point-info-row')

    var textSpan = document.createElement('span');
    textSpan.innerHTML = text;

    var valueSpan = document.createElement('span');
    valueSpan.classList.add('point-info-row-value')
    valueSpan.id = text;
    valueSpan.style.color = color;
    valueSpan.innerHTML = value;

    rows[text] = valueSpan;

    newRow.append(textSpan);
    newRow.append(valueSpan);
    container.append(newRow);
  }

  container.enableRow = function(text) {
    var e = document.getElementById('row' + text);
    if (e) {
      e.style.display = 'flex';
    }
  }

  container.disableRow = function(text) {
    var e = document.getElementById('row' + text);
    if (e) {
      e.style.display = 'none';
    }
  }

  container.setRowValue = function(key, value) {
    rows[key].innerHTML = value;
  }

  container.append(title);
  return container;
}

const PREVIEW_RESIZE_AREA_WIDTH = 10;
const PREVIEW_MIN_WIDTH = 30;

const PREVIEW_BORDERS_WIDTH = 10;
const PREVIEW_BORDER_RADIUS = 5;

function preview(w, h) {
  var canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;

  var previewMaskColor = '#000000';
  var previewMaskAlpha = '#000000';
  var previewBorderColor = '#000000';
  var previewCornersFillColor = '#000000';

  var previewHeight = canvas.height - PREVIEW_INNER_MARGIN_TOP * 2;
  var ctx = canvas.getContext('2d');

  var leftX = (1 - PREVIEW_INIT_W) * canvas.width;
  var rightX = 1 * canvas.width;

  var state = { left: 1 - PREVIEW_INIT_W, right: 1 };
  function updateState() {
    state.left = leftX/canvas.width;
    state.right = rightX/canvas.width;

    if (canvas.onupdate) {
      canvas.onupdate(state);
    }
  }
  updateState();


  canvas.updateWidth = function(w) {
    canvas.width = w;

    leftX = state.left * canvas.width;
    rightX = state.right * canvas.width;

    draw();
  }

  canvas.switchTheme = function(theme) {
    setTheme(theme);
    draw();
  }

  function setTheme(theme) {
    previewMaskColor = theme.previewMaskColor;
    previewMaskAlpha = theme.previewMaskAlpha;
    previewBorderColor = theme.previewBorderColor;
    previewCornersFillColor = theme.previewCornersFillColor;
  }
  setTheme(PREVIEW_DAY_THEME);

  function leftZoneUpdate(x) {
    if (leftX > rightX - PREVIEW_MIN_WIDTH) leftX = rightX - PREVIEW_MIN_WIDTH;
    else if (leftX < 0) leftX = 0;

    requestAnimationFrame(function() {
      draw();
      updateState();
    });
  }

  function centralZoneUpdate(currWidth) {
    if (leftX < 0) leftX = 0;
    if (leftX > canvas.width - currWidth) leftX = canvas.width - currWidth;
    rightX = leftX + currWidth;

    requestAnimationFrame(function() {
      draw();
      updateState();
    });
  }

  function rightZoneUpdate(x) {
    if (rightX < leftX + PREVIEW_MIN_WIDTH) rightX = leftX + PREVIEW_MIN_WIDTH;
    else if (rightX > canvas.width) rightX = canvas.width;

    requestAnimationFrame(function() {
      draw();
      updateState();
    });
  }

  canvas.onmousedown = function(e) {
    if (isLeftZone(e.clientX - canvas.getBoundingClientRect().x)) {
      var offsetLeftX = leftX - e.clientX;

      onmousemove = function(e) {
        leftX = e.clientX + offsetLeftX;
        leftZoneUpdate();
      };
    }
    else if (isCentralZone(e.clientX - canvas.getBoundingClientRect().x)) {

      var offsetLeftX = leftX - e.clientX;
      var currWidth = rightX - leftX;

      onmousemove = function(e) {
        leftX = e.clientX + offsetLeftX;
        centralZoneUpdate(currWidth);
      };
    }
    else if (isRightZone(e.clientX - canvas.getBoundingClientRect().x)) {
      var offsetRightX = rightX - e.clientX;

      onmousemove = function(e) {
        rightX = e.clientX + offsetRightX;
        rightZoneUpdate();
      };
    }

    onmouseup = function(e) {
      onmousemove = null;
      onmouseup = null;
    }

    return false;
  }

  canvas.ontouchstart = function(e) {
    if (isLeftZone(e.touches[0].clientX - canvas.getBoundingClientRect().x)) {
      var offsetLeftX = leftX - e.touches[0].clientX;

      ontouchmove = function(e) {
        leftX = e.touches[0].clientX + offsetLeftX;
        leftZoneUpdate();
      };
    }
    else if (isCentralZone(e.touches[0].clientX - canvas.getBoundingClientRect().x)) {
      var offsetLeftX = leftX - e.touches[0].clientX;
      var currWidth = rightX - leftX;

      ontouchmove = function(e) {
        leftX = e.touches[0].clientX + offsetLeftX;
        centralZoneUpdate(currWidth);
      };
    }
    else if (isRightZone(e.touches[0].clientX - canvas.getBoundingClientRect().x)) {
      var offsetRightX = rightX - e.touches[0].clientX;

      ontouchmove = function(e) {
        rightX = e.touches[0].clientX + offsetRightX;
        rightZoneUpdate();
      };
    }

    ontouchend = function(e) {
      ontouchmove = null;
      ontouchend = null;
    }

    return false;
  }

  var offX = 1;
  var maskOverlayX = 4;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.fillStyle = previewMaskColor;
    ctx.globalAlpha = previewMaskAlpha;

    var left = leftX;
    var right = rightX;
    ctx.rect(0, PREVIEW_INNER_MARGIN_TOP, left + maskOverlayX, previewHeight);
    ctx.rect(right - maskOverlayX, PREVIEW_INNER_MARGIN_TOP, canvas.width - right + maskOverlayX, previewHeight);
    ctx.fill();


    ctx.globalAlpha = 1;
    ctx.fillStyle = previewCornersFillColor;

    ctx.beginPath();
    ctx.arc(
      PREVIEW_BORDER_RADIUS,
      PREVIEW_BORDER_RADIUS + PREVIEW_INNER_MARGIN_TOP,
      PREVIEW_BORDER_RADIUS,
      1*Math.PI,
      1.5*Math.PI
    );
    ctx.moveTo(PREVIEW_BORDER_RADIUS, PREVIEW_INNER_MARGIN_TOP);
    ctx.lineTo(0, PREVIEW_INNER_MARGIN_TOP);
    ctx.lineTo(0, PREVIEW_BORDER_RADIUS + PREVIEW_INNER_MARGIN_TOP);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(
      canvas.width - PREVIEW_BORDER_RADIUS,
      PREVIEW_BORDER_RADIUS + PREVIEW_INNER_MARGIN_TOP,
      PREVIEW_BORDER_RADIUS,
      1.5*Math.PI,
      0*Math.PI
    );
    ctx.moveTo(canvas.width, PREVIEW_BORDER_RADIUS + PREVIEW_INNER_MARGIN_TOP);
    ctx.lineTo(canvas.width, PREVIEW_INNER_MARGIN_TOP);
    ctx.lineTo(canvas.width - PREVIEW_BORDER_RADIUS, PREVIEW_INNER_MARGIN_TOP);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(
      canvas.width - PREVIEW_BORDER_RADIUS,
      canvas.height - PREVIEW_BORDER_RADIUS - PREVIEW_INNER_MARGIN_TOP,
      PREVIEW_BORDER_RADIUS,
      0*Math.PI,
      0.5*Math.PI
    );
    ctx.moveTo(canvas.width - PREVIEW_BORDER_RADIUS, canvas.height - PREVIEW_INNER_MARGIN_TOP);
    ctx.lineTo(canvas.width, canvas.height - PREVIEW_INNER_MARGIN_TOP);
    ctx.lineTo(canvas.width, canvas.height - PREVIEW_BORDER_RADIUS - PREVIEW_INNER_MARGIN_TOP);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(
      PREVIEW_BORDER_RADIUS,
      canvas.height - PREVIEW_BORDER_RADIUS - PREVIEW_INNER_MARGIN_TOP,
      PREVIEW_BORDER_RADIUS,
      0.5*Math.PI,
      1*Math.PI
    );
    ctx.moveTo(0, canvas.height - PREVIEW_BORDER_RADIUS - PREVIEW_INNER_MARGIN_TOP);
    ctx.lineTo(0, canvas.height - PREVIEW_INNER_MARGIN_TOP);
    ctx.lineTo(PREVIEW_BORDER_RADIUS, canvas.height - PREVIEW_INNER_MARGIN_TOP);
    ctx.fill();

    ctx.strokeStyle = previewBorderColor;
    ctx.lineWidth = 1 + offX;
    ctx.globalAlpha = 1;
    roundRect(
      ctx,
      left+offX,
      PREVIEW_INNER_MARGIN_TOP,
      right - left - offX*2,
      previewHeight,
      [PREVIEW_BORDER_RADIUS, PREVIEW_BORDER_RADIUS, PREVIEW_BORDER_RADIUS, PREVIEW_BORDER_RADIUS]
    );

    ctx.fillStyle = previewBorderColor;
    roundRect(
      ctx,
      left + offX,
      PREVIEW_INNER_MARGIN_TOP,
      8,
      previewHeight,
      [PREVIEW_BORDER_RADIUS, 0, 0, PREVIEW_BORDER_RADIUS],
      true
    );
    roundRect(
      ctx,
      right - 8 - offX,
      PREVIEW_INNER_MARGIN_TOP,
      8,
      previewHeight,
      [0, PREVIEW_BORDER_RADIUS, PREVIEW_BORDER_RADIUS, 0],
      true
    );
  }

  function isLeftZone(x) {
    return Math.abs(x - leftX) < PREVIEW_RESIZE_AREA_WIDTH;
  }

  function isRightZone(x) {
    return Math.abs(x - rightX) < PREVIEW_RESIZE_AREA_WIDTH;
  }

  function isCentralZone(x) {
    return x > leftX + PREVIEW_RESIZE_AREA_WIDTH && x < rightX - PREVIEW_RESIZE_AREA_WIDTH;
  }

  requestAnimationFrame(draw);
  return canvas;
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke == 'undefined') {
    stroke = true;
  }
  if (typeof radius === 'undefined') {
    radius = 5;
  }
  if (typeof radius === 'number') {
    radius = {tl: radius, tr: radius, br: radius, bl: radius};
  }
  if (typeof radius === 'object') {
    radius = {tl: radius[0], tr: radius[1], br: radius[2], bl: radius[3]};
  } else {
    var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
    for (var side in defaultRadius) {
      radius[side] = radius[side] || defaultRadius[side];
    }
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) {
    ctx.fill();
  }
  else if (stroke) {
    ctx.stroke();
  }

}

function AnimatedValue(value, duration) {
  duration = duration || 0.5;
  this.value = value;
  this.duration = duration * 1000;
  this.ease = function(t) {
    return t*(2-t);
  }
}
AnimatedValue.prototype.set = function(newValue, now, animated) {
  now = now || performance.now();
  animated = animated || false;
  if (!animated) { this.value = newValue;return; }
  if (newValue === this.toValue) { return; }

  if (isNaN(this.value)) {
    return;
  }

  this.started = now;
  this.from = this.value;
  this.to = newValue;
  this.nextTick(now);
}
AnimatedValue.prototype.nextTick = function(now, name) {
  if (this.started) {
    var p = (now - this.started)/this.duration;

    if (p > 1) p = 1;
    if (p < 0) p = 0;
    this.value = Math.round((this.from + (this.to - this.from) * this.ease(p))*100)/100;

    if (p === 1) this.started = false;
    return true;
  }
  else {
    return false;
  }
};

function createLabelFromDate(date, withYear=false) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var l = new Date(date).getDate() + ' ' + months[new Date(date).getMonth()];
  if (withYear) {
    l = l + ' ' + new Date(date).getFullYear();
  }
  return l;
}

function getMatrixMin(m) {
  return Math.min.apply(
    null,
    m.map(
      row => Math.min.apply(null, row)
    )
  );
}

function getMatrixMax(m) {
  return Math.max.apply(
    null,
    m.map(
      row => Math.max.apply(null, row)
    )
  );
}

function getMin(arr) {
  return Math.min.apply(null, arr);
}

function getMax(arr) {
  return Math.max.apply(null, arr);
}

function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
}

function getGridValuesByMax(max) {
  const k = getStepForGridValues(max);
  return [0, 1, 2, 3, 4, 5, 6].map(i => i*k/5);
}

function getStepForGridValues(max, k=1) {
  if (max == Number.POSITIVE_INFINITY || max == Number.NEGATIVE_INFINITY || max === 0) return 0;

  if (max > 100) return getStepForGridValues(max/10, k*10);
  if (max < 1) return getStepForGridValues(max*10, k/10);

  if (max % 5 == 0) return k*max/5;
  const a = max*5/6;
  if (a % 5 == 0) return k*a/5;

  const ds = [5, 4, 2, 1];
  return s(a, max, ds);

  function s(a, b, ds) {
    let d = ds.shift();
    for (let i=Math.floor(b);i>=Math.ceil(a);i--) {
      if (i % d == 0) return k*i/5;
    }
    return s(a, b, ds);
  }
}

function getDataColumnByName(name, data) {
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === name) {
      return data[i].slice(1);
    }
  }
  return [];
}

function transpose(arr) {
  return arr[0].map((col, i) => arr.map(row => row[i]));
}

function round(n, c=0) {
  return Math.round(n*Math.pow(10, c))/Math.pow(10, c);
}

function sum(array) {
  return array.reduce((a, c) => a + c);
}

function getPercents(values) {
  return values[0].map((_, i) => {
    var sum = values.map(c => c[i]).reduce((a, c) => a+c);
    if (sum === 0) return values.map(c => 0);
    return values.map(c => {
      return Math.round(10000*c[i]/sum)/100;
    });
  });
}

function getStackedPercents(values) {
  return getPercents(values).map((row, i) => {
    return row.map((p, i) => {
      return round(sum(row.slice(0, i+1)), 2)
    })
  })
}

function getStackedArraySums(values) {
  return transpose(transpose(values).map((row, i) => {
    return row.map((p, i) => {
      return round(sum(row.slice(0, i+1)), 2)
    })
  }))
}
