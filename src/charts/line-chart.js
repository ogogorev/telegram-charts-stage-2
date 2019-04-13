import { chartBase } from './chart';
import { AnimatedValue, AnimatedArray, main } from '../animations';
import { createInfo } from './point-info';
import { createButton } from './button';
import {
  createLabelFromDate,
  getMin, getMax,
  getMatrixMax,
  debounce, getGridValuesByMax,
  getStepForGridValues,
  getDataColumnByName
} from '../utils';
import { OXLABELS_HEIGHT, CHART_GRID_PADDING, GRID_LINES_COUNT, PREVIEW_HEIGHT } from '../consts';

const Y_ANIMATION_TIME = 0.3; // to base
const OX_LABELS_ANIMATION_DURATION = 0.25; // to base
const OY_LABELS_MARGIN_TOP = -10; // to base

const MINI_CHART_HEIGHT = 50; // to base
const MINI_CHART_MARGIN = 30; // to base

export function lineChart(w, h, data) {
  console.log(data);
  var me = chartBase(w, h);
  var ctx = me.canvas.getContext('2d');

  var gridWidth = w - CHART_GRID_PADDING*2; // to base

  // data

  // var dataLength = data.columns[0].slice(1).length;
  var dataLength = 50; // FIXME Remove
  var oxLabels = getDataColumnByName('x', data.columns).slice(0, dataLength).map(date => createLabelFromDate(date));

  var columnNames = Object.keys(data.names);
  var columns = [];
  var colors = [];
  for (var i = 0; i < columnNames.length; i++) {
    columns.push({
      id: columnNames[i],
      name: data.names[columnNames[i]],
      isOn: true,
      alpha: new AnimatedValue(1, Y_ANIMATION_TIME),
      values: getDataColumnByName(columnNames[i], data.columns).slice(0, dataLength)
    });
    colors.push(data.colors[columnNames[i]]);
  }

  var info; // to base

  // draw props

  var bottomY = h - OXLABELS_HEIGHT - MINI_CHART_HEIGHT - MINI_CHART_MARGIN; // to base, rename to mainChartY
  var oxLabelsBottomY = h - MINI_CHART_HEIGHT - MINI_CHART_MARGIN; // to base, rename to oxLabelsY
  // var miniChartTopY = h - MINI_CHART_HEIGHT + 1;

  var barWidth = 0; // to base, rename to step
  var offsetX = 0; // to base

  var startInd = 0; // to base
  var endInd = 0; // to base
  var selectedInd = -1; // to base
  var selectedScreenX = 0; // to base

  // ox props

  const oxLabelWidth = 50; // to base
  const countOnScreen = w/oxLabelWidth; // to base
  var currOxLabelsStep = 1; // to base
  var staticOxLabels = { step: 1, lastInd: 0, alpha: new AnimatedValue(1, OX_LABELS_ANIMATION_DURATION) }; // to base
  var dynamicOxLabels = { step: 1, lastInd: 0, alpha: new AnimatedValue(1, OX_LABELS_ANIMATION_DURATION) }; // to base

  // oy props

  // var currMaxY = 0; // to base
  var gridMaxY = new AnimatedValue(0, Y_ANIMATION_TIME); // to base

  var gridLinesHeight = Math.round(bottomY / GRID_LINES_COUNT); // to base
  var oldOyLabels = {
    alpha: new AnimatedValue(0, Y_ANIMATION_TIME),
    offsetY: new AnimatedValue(0, Y_ANIMATION_TIME),
    labels: [0, 1, 2, 3, 4, 5, 6]
  }; // to base
  var newOyLabels = {
    alpha: new AnimatedValue(1, Y_ANIMATION_TIME),
    offsetY: new AnimatedValue(0, Y_ANIMATION_TIME),
    labels: [0, 1, 2, 3, 4, 5]
  }; // to base

  function init() { // to base
    initGridMaxY();
    drawMini();
    initInfo();
    initButtons();
    me.update();
  }

  function initGridMaxY() {
    var max = getStepForGridValues(getMatrixMax(columns.map(c => c.values)));
    gridMaxY.set(max*6/5);
  }

  function initInfo() {
    info = createInfo();
    for (var i = 0; i < columnNames.length; i++) {
      info.addRow(data.names[columnNames[i]], 0);
    }
    me.container.append(info);
  }

  function initButtons() {
    var buttonsContainer = document.createElement('div')
    for (var i = 0; i < columnNames.length; i++) {
      var b = createButton(colors[i], data.names[columnNames[i]], function(name, isOn) {
        toggleLine(name, isOn);
      });
      buttonsContainer.append(b);
    }
    me.container.append(buttonsContainer);
  }

  function toggleLine(name, isOn) {
    // console.log('toggle', name, isOn);
    var now = performance.now();
    for (var i = 0; i < columns.length; i++) {
      if (columns[i].name === name) {
        if (isOn) columns[i].alpha.set(1, now, true)
        else columns[i].alpha.set(0, now, true)
        columns[i].isOn = isOn;
        me.update();
      }
    }
  }

  me.canvas.onclick = function(e) {
    if (e.layerY <= bottomY) {
      selectedScreenX = e.layerX;
      selectedInd = xToInd(e.layerX);
      info.setTitle(oxLabels[selectedInd]);
      columns.forEach(c => {
        info.setRowValue(c.name, c.values[selectedInd]);
      });
    }
    else {
      selectedInd = -1;
    }
    me.draw();
  }

  function xToInd(x) {
    var indOnScreen = Math.round((x - offsetX)/barWidth);
    var ind = startInd + indOnScreen;
    return ind;
  }

  function calculateOffsetX(w, padding, left, right) {
    return w + padding - right*w/(right-left);
  }

  const L = dataLength - 1;
  var gridStepY = 0;
  me.update = function() {
    // startInd = Math.floor(me.previewLeftX * L);
    startInd = Math.max(Math.ceil(me.previewLeftX * L) - 1, 0);
    endInd = Math.ceil(me.previewRightX * L);
    barWidth = gridWidth/(L*(me.previewRightX-me.previewLeftX));
    offsetX = calculateOffsetX(gridWidth, CHART_GRID_PADDING, me.previewLeftX, me.previewRightX); // новый

    var maxY = getMatrixMax(columns.filter(c => c.isOn).map(c => c.values.slice(startInd, endInd+1)));
    var newGridStepY = getStepForGridValues(maxY);

    updateOxLabels();

    if (gridStepY !== newGridStepY) {
      // updateY(maxY);
      // var newGridValues = getGridValuesByMax(maxY);
      var now = performance.now();

      // gridMaxY.set(newGridValues.splice(-1, 1)[0], now, true);
      gridMaxY.set(newGridStepY*6, now, true);


      var k = 1;
      if (gridStepY > newGridStepY) k = -1; // Если надо вверх
      gridStepY = newGridStepY;

      oldOyLabels.labels = newOyLabels.labels;

      oldOyLabels.alpha.set(1);
      oldOyLabels.offsetY.set(-1);
      oldOyLabels.alpha.set(0, now, true);
      oldOyLabels.offsetY.set(k*gridLinesHeight/2, now, true);

      newOyLabels.alpha.set(-1);
      newOyLabels.offsetY.set(-k*gridLinesHeight/2);
      newOyLabels.alpha.set(1, now, true);
      newOyLabels.offsetY.set(0, now, true);

      // newOyLabels.labels = newGridValues;
      newOyLabels.labels = [0, 1, 2, 3, 4, 5].map(n => n*newGridStepY);
    }

    me.draw();
  }

  function updateOxLabels() {
    var step = Math.max(1, (endInd - startInd + 1) / countOnScreen);
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
      ctx.clearRect(0, 0, w, oxLabelsBottomY);

      ctx.beginPath();
      ctx.rect(0, 0, w, oxLabelsBottomY);
      ctx.stroke()

      var now = performance.now();

      var needRedraw = false;
      var needDrawMini = false;
      for (var i = 0; i < columns.length; i++) {
        if (columns[i].alpha.nextTick(now)) {
          needRedraw = needDrawMini = true;
        }
      }
      if (gridMaxY.nextTick(now)) needRedraw = true;
      if (oldOyLabels.alpha.nextTick(now)) needRedraw = true;
      if (oldOyLabels.offsetY.nextTick(now)) needRedraw = true;
      if (newOyLabels.alpha.nextTick(now)) needRedraw = true;
      if (newOyLabels.offsetY.nextTick(now)) needRedraw = true;
      if (dynamicOxLabels.alpha.nextTick(now)) needRedraw = true;

      drawBg();
      drawLines();
      if (needDrawMini) {
        drawMini();
      }

      if (needRedraw) {
        me.draw();
      }
    });
  }

  function drawBg() {
    drawOxLabels(staticOxLabels, oxLabels.length - 1);
    drawOxLabels(dynamicOxLabels, oxLabels.length - 1 - dynamicOxLabels.step/2); // Говно какое-то
    drawOyLabels(oldOyLabels);
    drawOyLabels(newOyLabels);

    ctx.beginPath();
    ctx.globalAlpha = 1;
    ctx.fillText(0, CHART_GRID_PADDING, bottomY + OY_LABELS_MARGIN_TOP);
    ctx.moveTo(CHART_GRID_PADDING, bottomY + 0.5);
    ctx.lineTo(w - CHART_GRID_PADDING, bottomY + 0.5);
    ctx.stroke();
  }

  const labelWidthHalf = 15;
  function drawOxLabels(oxLabelsProps, lastInd) {
    if (oxLabelsProps.alpha.value <= 0) return;
    while(lastInd > endInd) lastInd -= oxLabelsProps.step;

    ctx.beginPath();
    ctx.globalAlpha = oxLabelsProps.alpha.value;
    ctx.fillStyle = 'black'; // FIXME color to consts

    var offset = offsetX - labelWidthHalf;
    for (var i = lastInd; i >= startInd; i-=oxLabelsProps.step) {
      ctx.fillText(oxLabels[i], Math.floor(i * barWidth + offset), oxLabelsBottomY - OXLABELS_HEIGHT/2);
    }
  }

  function drawOyLabels(oyLabels) {
    if (oyLabels.alpha.value <= 0) return;
    ctx.globalAlpha = oyLabels.alpha.value;
    ctx.strokeStyle = 'black'; // FIXME color to const
    ctx.lineWidth = 1;
    ctx.beginPath();

    var offset = Math.round(oyLabels.labels.length * gridLinesHeight + oyLabels.offsetY.value);

    for (var i = 1; i < oyLabels.labels.length; i++) {
      var y = offset - i * gridLinesHeight;
      ctx.fillText(
        oyLabels.labels[i],
        CHART_GRID_PADDING,
        offset - i * gridLinesHeight + OY_LABELS_MARGIN_TOP
      );
      y -= 0.5;
      ctx.moveTo(CHART_GRID_PADDING, y);
      ctx.lineTo(w - CHART_GRID_PADDING, y);
    }
    ctx.stroke();
  }

  function drawLines() {
    var barW = Math.round(barWidth*round)/round;
    var sI = Math.max(startInd-1, 0);
    var eI = Math.min(endInd+1, dataLength-1);

    var X = [];
    for (var i = sI; i < eI+1; i++) {
      X.push(getScreenXByInd(i, barW, offsetX));
    }

    for (var i = 0; i < columns.length; i++) {
      var Y = getYCoords(bottomY, columns[i].values.slice(sI, eI+1), gridMaxY.value);
      drawLine(X, Y, colors[i], columns[i].alpha.value);
    }

    if (selectedInd >= startInd && selectedInd <= endInd) {
      // var ind = selectedInd - sI;
      var ind = selectedInd - startInd;
      var filteredColumns = columns.filter(c => c.isOn);

      ctx.beginPath();
      ctx.strokeStyle = '#000000';
      ctx.moveTo(selectedScreenX, 0);
      ctx.lineTo(selectedScreenX, bottomY);
      ctx.stroke();

      ctx.beginPath();
      ctx.fillStyle = '#FFFFFF'; // FIXME Color
      filteredColumns.forEach(c => {
        // ctx.arc(Math.floor(X[ind]), Math.floor(getScreenY(bottomY, c.values[selectedInd], gridMaxY.value)), 5.5, 0, 2 * Math.PI);
        // ctx.arc(Math.floor(X[ind]), Math.floor(getScreenY(bottomY, c.values[selectedInd], gridMaxY.value)), 5.5, 0, 2 * Math.PI);
      });
      ctx.fill();

      filteredColumns.forEach(c => {
        ctx.beginPath();
        ctx.strokeStyle = data.colors[c.id]; // FIXME Color
        // ctx.arc(Math.floor(X[ind]), Math.floor(getScreenY(bottomY, c.values[selectedInd], gridMaxY.value)), 5.5, 0, 2 * Math.PI);
        ctx.arc(Math.floor(getScreenXByInd(selectedInd, barW, offsetX)), Math.floor(getScreenY(bottomY, c.values[selectedInd], gridMaxY.value)), 5.5, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.closePath();
      });

      info.style.left = X[ind] + (barWidth - info.offsetWidth)/2 + 'px';
      info.style.top = Y[ind] - info.offsetHeight  - 15 + 'px'; // FIXME Info margin
      info.appear();
    }
    else {
      info.disappear()
    }
  }

  function drawLine(X, Y, color, alpha=1) {
    if (alpha > 0) {
      ctx.beginPath();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineCap = 'round';
      ctx.lineWidth = 2;

      ctx.moveTo(X[0], Y[0]);
      for (let i=1; i < X.length; i++) {
        ctx.lineTo(X[i], Y[i]);
      }
      ctx.stroke();
    }
  }

  var miniChartX = CHART_GRID_PADDING;
  var miniChartY = h - MINI_CHART_HEIGHT + 1;
  var miniChartWidth = w - CHART_GRID_PADDING*2;
  var miniChartHeight = MINI_CHART_HEIGHT;
  var miniChartStep = Math.round((miniChartWidth/(oxLabels.length-1))*round)/round;

  function drawMini() {
    ctx.clearRect(miniChartX, miniChartY, miniChartWidth, miniChartHeight);

    var X = [];
    for (var i = 0; i < oxLabels.length; i++) {
      X.push(getScreenXByInd(i, miniChartStep, miniChartX));
    }
    var max = getMatrixMax(columns.filter(c => c.isOn).map(c => c.values));

    ctx.beginPath();
    for (var i = 0; i < columns.length; i++) {
      var Y = getYCoords(miniChartHeight, columns[i].values, max).map(y => miniChartY + y);
      drawLine(X, Y, colors[i], columns[i].alpha.value);
    }
  }

  init();
  return me.container;
}

const round = 1000;

// function getXCoords(width, xLength, step, offset=0) {
//   var coords = [];
//   for (var i = 0; i < xLength; i++) {
//     coords.push(Math.round((i*step + offset)*round)/round);
//   }
//   return coords;
// }

function getScreenXByInd(i, step, offset=0) {
  return i*step + offset;
}

function getYCoords(height, Y, max) { // FIXME Можно удалить, потому что есть getScreenY
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

// LineChart.prototype = Object.create(ChartBase.prototype);
// LineChart.prototype.constructor = LineChart;
