import { chartBase } from './chart';
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


// var arr = Array(1000).fill(0).map(e => 1 + Math.floor(Math.random() * 99));
// var bigArr = Array(1000).fill(0).map(e => 1000000 + Math.floor(Math.random() * 50000000));
// sum(arr);
// sum(bigArr);
// function sum(arr) {
//   console.time('start ' + arr[0]);
//   arr.reduce((a, c) => a + c);
//   console.timeEnd('start ' + arr[0]);
// }







export function barChart(w, h, data) {
  console.log(data);
  var me = chartBase(w, h, w - CHART_GRID_PADDING*2, PREVIEW_HEIGHT);
  var ctx = me.canvas.getContext('2d');

  // data

  var dataLength = 120; // FIXME Remove
  // var dataLength = data.columns[0].slice(1).length;

  var oxLabels = data.columns[0].slice(1, 1+dataLength).map(date => createLabelFromDate(date));
  var values = data.columns[1].slice(1, 1+dataLength);
  // var values = Array(dataLength).fill(0).map((e, i) => 1 + i*2);
  var color = data.colors[Object.keys(data.names)[0]];

  // draw props

  var bottomY = h - OXLABELS_HEIGHT - MINI_CHART_HEIGHT - MINI_CHART_MARGIN;
  var oxLabelsBottomY = h - MINI_CHART_HEIGHT - MINI_CHART_MARGIN;
  var miniChartTopY = h - MINI_CHART_HEIGHT;

  var xCoords = getXCoords(w, oxLabels);
  // var yCoords = getYCoords(bottomY, values, getMax(values));
  var yCoords = values;

  var barWidth = 0;
  var offsetX = 0;

  var startInd = 0;
  var endInd = 0;
  var selectedInd = -1;

  // ox props

  var currStepOxLabelsStep = 1;
  const oxLabelWidth = 50;
  const countOnScreen = w/oxLabelWidth;
  var staticOxLabels = { step: 1, lastInd: 0, alpha: new AnimatedValue(1, OX_LABELS_ANIMATION_DURATION) };
  var dynamicOxLabels = { step: 1, lastInd: 0, alpha: new AnimatedValue(1, OX_LABELS_ANIMATION_DURATION) };

  // oy props

  var currMaxY = 0;
  var gridMaxY = new AnimatedValue(0, Y_ANIMATION_TIME);

  var gridLinesHeight = bottomY / GRID_LINES_COUNT;
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

    var maxY = getMax(values.slice(startInd, endInd));
    xCoords = getXCoords(w, oxLabels.slice(startInd, endInd), barWidth, offsetX);

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

    if (step === currStepOxLabelsStep) return;

    var now = performance.now();

    if (step > currStepOxLabelsStep) {
      currStepOxLabelsStep *= 2;
      dynamicOxLabels.alpha.set(1);
      dynamicOxLabels.alpha.set(0, now, true);
      staticOxLabels.step = currStepOxLabelsStep;
      dynamicOxLabels.step = currStepOxLabelsStep;
    }
    else if (step < currStepOxLabelsStep) {
      currStepOxLabelsStep /= 2;
      dynamicOxLabels.alpha.set(0);
      dynamicOxLabels.alpha.set(1, now, true);
      staticOxLabels.step = currStepOxLabelsStep*2;
      dynamicOxLabels.step = currStepOxLabelsStep*2;
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

  function drawOxLabels(oxLabelsProps, lastInd) {
    while(lastInd > endInd-1) lastInd -= oxLabelsProps.step;

    ctx.beginPath();
    ctx.globalAlpha = oxLabelsProps.alpha.value;
    ctx.fillStyle = 'black'; // FIXME color to consts

    for (var i = lastInd; i >= startInd; i-=oxLabelsProps.step) {
      var labelOffsetX = (barWidth - ctx.measureText(oxLabels[i]).width) / 2;
      var x = Math.floor((i - startInd) * barWidth + offsetX + labelOffsetX);
      ctx.fillText(oxLabels[i], x, oxLabelsBottomY - OXLABELS_HEIGHT/2);
    }
  }

  function drawOyLabels(oyLabels) {
    if (oyLabels.alpha.value <= 0) return;
    ctx.beginPath();
    ctx.globalAlpha = oyLabels.alpha.value;
    ctx.fillStyle = 'black'; // FIXME color to const

    for (var i = 1; i < oyLabels.labels.length; i++) {
      var y = (oyLabels.labels.length - i) * gridLinesHeight + oyLabels.offsetY.value;
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

    ctx.beginPath();
    ctx.globalAlpha = 0.4; // FIXME Alpha to const
    var Y = getYCoords(bottomY, yCoords.slice(startInd, endInd), gridMaxY.value);
    for (var i = 0; i < xCoords.length; i++) {
      if (i !== selectedInd - startInd) {
        ctx.rect(xCoords[i], Y[i], barWidth, bottomY - Y[i]);
        // ctx.fillText(startInd + i, xCoords[i], Y[i]);
      }
    }
    ctx.fillStyle = color;
    ctx.fill();

    if (selectedInd >= startInd && selectedInd <= endInd) {
      var ind = selectedInd - startInd;
      ctx.beginPath();
      ctx.fillStyle = 'black';
      ctx.rect(xCoords[ind], Y[ind], barWidth, bottomY - Y[ind]);
      ctx.fill();

      info.style.left = xCoords[ind] + (barWidth - info.offsetWidth)/2 + 'px';
      info.style.top = Y[ind] - info.offsetHeight  - 15 + 'px'; // FIXME Info margin
      info.appear();
    }
    else {
      info.disappear()
    }

  }

  function drawMini(x, y, w, h) {
    ctx.beginPath();
    ctx.globalAlpha = 0.4; // FIXME Alpha to const
    ctx.fillStyle = color;
    var X = getXCoords(w, oxLabels, w/oxLabels.length, CHART_GRID_PADDING);
    var Y = getYCoords(h, values, getMax(values));

    var barWidth = X[1] - X[0];
    for (var i = 0; i < X.length; i++) {
      ctx.rect(X[i], miniChartTopY + Y[i], barWidth, h - Y[i]);
    }
    ctx.fill();
  }

  // requestAnimationFrame(me.draw);
  // me.update();
  init();
  return me.container;
}

function getXCoords(width, X, step, offset=0) {
  var coords = [];
  for (var i = 0; i < X.length; i++) {
    coords.push(i*step + offset);
  }
  return coords;
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

var arr = []
function perf(func, ...args) {
  var before = performance.now();
  func(...args);
  var after = performance.now();
  arr.push(after - before);
  // console.warn('PERFORMANCE CHECK, ', func.name, ': ', after - before);
  showArr()
  // console.warn(getAverage(arr) ,'PERFORMANCE CHECK, ', func.name, ': ', after - before);
}

var showArr = debounce(function() {
  console.log('perf average', getAverage(arr));
  arr = []
}, 300);

function getAverage(arr) {
  return arr.reduce((a, c) => a+c)/arr.length
}

// perf(foo)
// perf(foo)
//
// function foo() {
//   console.log('a')
// }
