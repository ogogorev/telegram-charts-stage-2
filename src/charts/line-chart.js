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

const Y_ANIMATION_TIME = 0.3;
const OX_LABELS_ANIMATION_DURATION = 0.25;
const OY_LABELS_MARGIN_TOP = -10;

const MINI_CHART_HEIGHT = 50;
const MINI_CHART_MARGIN = 30;

export function lineChart(w, h, data) {
  console.log(data);
  var me = chartBase(w, h);
  var ctx = me.canvas.getContext('2d');

  var gridWidth = w - CHART_GRID_PADDING*2;

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

  var info;

  // columns.map(c => {
  //
  //   console.log('column', c.name, getMax(c.values));
  // })

  // draw props

  var bottomY = h - OXLABELS_HEIGHT - MINI_CHART_HEIGHT - MINI_CHART_MARGIN;
  var oxLabelsBottomY = h - MINI_CHART_HEIGHT - MINI_CHART_MARGIN;
  // var miniChartTopY = h - MINI_CHART_HEIGHT + 1;

  var barWidth = 0;
  var offsetX = 0;

  var startInd = 0;
  var endInd = 0;
  var selectedInd = -1;
  var selectedScreenX = 0;

  // ox props

  const oxLabelWidth = 50;
  const countOnScreen = w/oxLabelWidth;
  var currOxLabelsStep = 1;
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

  function init() {
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

  // console.log(calculateOffsetX(40, 20, 0.5, 1));
  // console.log(calculateOffsetX(40, 20, 0.2, 1));
  // console.log(calculateOffsetX(40, 20, 0, 1));


  const L = dataLength - 1;
  me.update = function() {
    startInd = Math.floor(me.previewLeftX * L);
    // endInd = Math.ceil(me.previewRightX * L) + 1;
    endInd = Math.ceil(me.previewRightX * L);
    // barWidth = w/(L*(me.previewRightX-me.previewLeftX));
    barWidth = gridWidth/(L*(me.previewRightX-me.previewLeftX));
    offsetX = calculateOffsetX(gridWidth, CHART_GRID_PADDING, me.previewLeftX, me.previewRightX); // новый
    // offsetX = -barWidth * (L*me.previewLeftX - startInd);
    // offsetX = -barWidth * (L*me.previewLeftX - startInd) + CHART_GRID_PADDING;

    var maxY = getMatrixMax(columns.filter(c => c.isOn).map(c => c.values.slice(startInd, endInd+1)));

    updateOxLabels();

    if (currMaxY !== maxY) {
      // updateY(maxY);
      var newGridValues = getGridValuesByMax(maxY);
      var now = performance.now();

      gridMaxY.set(newGridValues.splice(-1, 1)[0], now, true);


      var k = 1;
      if (currMaxY > maxY) k = -1; // Если надо вверх
      currMaxY = maxY;

      oldOyLabels.labels = newOyLabels.labels;

      oldOyLabels.alpha.set(1);
      oldOyLabels.offsetY.set(-1);
      oldOyLabels.alpha.set(0, now, true);
      oldOyLabels.offsetY.set(k*gridLinesHeight/2, now, true);

      newOyLabels.alpha.set(-1);
      newOyLabels.offsetY.set(-k*gridLinesHeight/2);
      newOyLabels.alpha.set(1, now, true);
      newOyLabels.offsetY.set(0, now, true);

      newOyLabels.labels = newGridValues;
    }

    me.draw();
  }

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
  }

  const labelWidthHalf = 15;
  function drawOxLabels(oxLabelsProps, lastInd) {
    if (oxLabelsProps.alpha.value <= 0) return;
    while(lastInd > endInd-1) lastInd -= oxLabelsProps.step;

    ctx.beginPath();
    ctx.globalAlpha = oxLabelsProps.alpha.value;
    ctx.fillStyle = 'black'; // FIXME color to consts

    var offset = -startInd * barWidth + offsetX - labelWidthHalf;
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

    ctx.fillText(0, CHART_GRID_PADDING, bottomY + OY_LABELS_MARGIN_TOP);
    ctx.moveTo(CHART_GRID_PADDING, bottomY + 0.5);
    ctx.lineTo(w - CHART_GRID_PADDING, bottomY + 0.5);

    ctx.stroke();
  }

  function drawLines() {
    var barW = Math.round(barWidth*round)/round;
    var sI = Math.max(startInd-1, 0);
    var eI = Math.min(endInd+1, dataLength-1);

    // console.log(startInd, endInd);
    // console.log(sI, eI);

    var X = [];
    for (var i = sI; i < eI+1; i++) {
      X.push(getScreenXByInd(i, barW, offsetX));
    }
    // var X = getXCoords(w, endInd - startInd, barW, Math.round(offsetX*round)/round);
    // var X = getXCoords(gridWidth, eI - sI, barW, Math.round(offsetX*round)/round);

    for (var i = 0; i < columns.length; i++) {
      // var Y = getYCoords(bottomY, columns[i].values.slice(startInd, endInd), gridMaxY.value);
      var Y = getYCoords(bottomY, columns[i].values.slice(sI, eI+1), gridMaxY.value);
      // console.log(X, Y);
      drawLine(X, Y, colors[i], columns[i].alpha.value);
    }

    if (selectedInd >= startInd && selectedInd <= endInd) {
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
        ctx.arc(Math.floor(X[ind]), Math.floor(getScreenY(bottomY, c.values[selectedInd], gridMaxY.value)), 5.5, 0, 2 * Math.PI);
      });
      ctx.fill();

      filteredColumns.forEach(c => {
        ctx.beginPath();
        ctx.strokeStyle = data.colors[c.id]; // FIXME Color
        ctx.arc(Math.floor(X[ind]), Math.floor(getScreenY(bottomY, c.values[selectedInd], gridMaxY.value)), 5.5, 0, 2 * Math.PI);
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

    ctx.beginPath();
    var X = getXCoords(miniChartWidth, oxLabels.length, miniChartStep, miniChartX);
    // var max = getMatrixMax(columns.map(c => c.values));

    for (var i = 0; i < columns.length; i++) {
      var Y = getYCoords(miniChartHeight, columns[i].values, gridMaxY.value).map(y => miniChartY + y);
      drawLine(X, Y, colors[i], columns[i].alpha.value);
    }
  }

  init();
  return me.container;
}

const round = 1000;

function getXCoords(width, xLength, step, offset=0) {
  var coords = [];
  for (var i = 0; i < xLength; i++) {
    coords.push(Math.round((i*step + offset)*round)/round);
  }
  return coords;
}

function getScreenXByInd(i, step, offset) {
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
