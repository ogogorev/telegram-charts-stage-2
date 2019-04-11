import { chartBase } from './chart';
import { AnimatedValue, AnimatedArray, main } from '../animations';
import {
  createLabelFromDate,
  getMin, getMax,
  debounce, getGridValuesByMax
} from '../utils';
import { OXLABELS_HEIGHT, CHART_GRID_PADDING, GRID_LINES_COUNT } from '../consts';

const Y_ANIMATION_TIME = 0.3;
const OX_LABELS_ANIMATION_DURATION = 0.8;
const OY_LABELS_MARGIN_TOP = -10;

export function barChart(w, h, data) {
  console.log(data);
  var me = chartBase(w, h);
  var ctx = me.canvas.getContext('2d');

  var bottomY = h - OXLABELS_HEIGHT;
  var gridLinesHeight = bottomY / GRID_LINES_COUNT;

  var dataLength = 50; // FIXME Remove
  // var dataLength = data.columns[0].slice(1).length;

  var oxLabels = data.columns[0].slice(1, 1+dataLength).map(date => createLabelFromDate(date));
  var values = data.columns[1].slice(1, 1+dataLength);
  // var values = Array(dataLength).fill(0).map((e, i) => 1 + i*2);
  var color = data.colors[Object.keys(data.names)[0]];

  // console.log('oxLabels: ', oxLabels);

  var xCoords = getXCoords(w, oxLabels);
  var yCoords = new AnimatedArray(getYCoords(bottomY, values, getMax(values)).map(y => new AnimatedValue(y, Y_ANIMATION_TIME)));
  // var yCoords = getYCoords(bottomY, values, getMax(values));
  var barWidth = 0;
  var offsetX = 0;

  var startInd = 0;
  var endInd = 0;

  var currMaxY = 0;

  const oxLabelWidth = 50;
  const countOnScreen = w/oxLabelWidth;

  var staticOxLabels = { step: 1, lastInd: 0, alpha: new AnimatedValue(1, OX_LABELS_ANIMATION_DURATION) };
  var dynamicOxLabels = { step: 1, lastInd: 0, alpha: new AnimatedValue(1, OX_LABELS_ANIMATION_DURATION) };
  var currStepOxLabelsStep = 1;

  var oldOyLabels = {
    alpha: new AnimatedValue(0, Y_ANIMATION_TIME),
    offsetY: new AnimatedValue(0, Y_ANIMATION_TIME),
    labels: [0, 1, 2, 3, 4, 5, 6]
  };
  var newOyLabels = {
    alpha: new AnimatedValue(1, Y_ANIMATION_TIME),
    offsetY: new AnimatedValue(0, Y_ANIMATION_TIME),
    labels: [0, 1, 2, 3, 4, 5, 6]
  };

  me.draw = function() {
    requestAnimationFrame(function() {
      // console.log('barchart drawww', me.leftX);

      ctx.clearRect(0, 0, w, h);

      var now = performance.now();

      var needRedraw = yCoords.nextTick(now) |
      oldOyLabels.alpha.nextTick(now) |
      oldOyLabels.offsetY.nextTick(now) |
      newOyLabels.alpha.nextTick(now) |
      newOyLabels.offsetY.nextTick(now) |
      dynamicOxLabels.alpha.nextTick(now);

      drawBg();
      drawBars();
      // me.needToUpdate = false;

      if (needRedraw) {
        me.draw();
      }
    });
  }

  me.update = function() {
    // console.log('update');

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

    var staticLastInd = oxLabels.length-1;
    while(staticLastInd > endInd-1) staticLastInd -= staticOxLabels.step;

    var dynamicLastInd = oxLabels.length - 1 - dynamicOxLabels.step/2;
    while(dynamicLastInd > endInd-1) dynamicLastInd -= dynamicOxLabels.step;

    staticOxLabels.lastInd = staticLastInd;
    dynamicOxLabels.lastInd = dynamicLastInd;
  }

  var updateY = debounce(function(max) {
  // var updateY = function(max) {
    // console.log('update Y');
    var newGridValues = getGridValuesByMax(max);
    var now = performance.now();

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

    var Y = getYCoords(bottomY, values, newGridValues.splice(-1, 1)[0]);
    yCoords.values.forEach((y, i) => {
      y.set(Y[i], now, true);
    });

    me.draw();
  }, 300);

  function drawBg() {
    // console.log('draw bg');

    drawOxLabels(staticOxLabels);
    drawOxLabels(dynamicOxLabels);
    drawOyLabels(oldOyLabels);
    drawOyLabels(newOyLabels);
  }

  function drawOxLabels(oxLabelsProps) {
    // console.log('draw ox labels');

    ctx.beginPath();
    ctx.globalAlpha = oxLabelsProps.alpha.value;
    ctx.fillStyle = 'black'; // FIXME color to consts

    for (var i = oxLabelsProps.lastInd; i >= startInd; i-=oxLabelsProps.step) {
      var labelOffsetX = (barWidth - ctx.measureText(oxLabels[i]).width) / 2;
      var x = (i - startInd) * barWidth + offsetX + labelOffsetX;
      ctx.fillText(oxLabels[i], x, h - OXLABELS_HEIGHT/2);
    }

    /*

      currStep = 1

    1. 1 1 1 1 1

      step = 2, > curr
      currStep*2 = 2
      STATIC: step = 2, lastInd
      DYNAMIC: step = 2, lastInd - dynamic.step/2


    2. 1 0 1 0 1

      step = 4, > curr
      currStep*2 = 4
      STATIC: step = 4, lastInd
      DYNAMIC: step = 4, lastInd - dynamic.step/2

    3. 1 0 0 0 1

      step = 2, < curr
      currStep/2 = 2
      STATIC: step = 4, lastInd
      DYNAMIC: step = 4, lastInd - dynamic.step/2
      currStep = 2

    4. 1 0 1 0 1

      step = 1, < curr
      currStep = 2
      STATIC: step = 2, lastInd
      DYNAMIC: step = 2, lastInd - dynamic.step/2
      currStep = 1

    5. 1 1 1 1 1

      step = 4
      STATIC: step = 4, lastInd
      DYNAMIC: step = 2, lastInd - dynamic.step/2

    6. 1 0 0 0 1

    7. 1 0 0 0 1

    */

    // for (var i = lastInd, k=0; i >= startInd; i-=step, k++) {
    //   var labelOffsetX = (barWidth - ctx.measureText(oxLabels[i]).width) / 2;
    //   var x = (i - startInd) * barWidth + offsetX + labelOffsetX;
    //   ctx.fillText(oxLabels[i], x, h - OXLABELS_HEIGHT/2);
    // }
  }

  function drawOyLabels(oyLabels) {
    // console.log('draw oy labels');
    if (oyLabels.alpha.value <= 0) return;
    ctx.beginPath();
    ctx.globalAlpha = oyLabels.alpha.value;
    ctx.fillStyle = 'black'; // FIXME color to const

    for (var i = 0; i < oyLabels.labels.length; i++) {
      ctx.fillText(
        oyLabels.labels[i],
        CHART_GRID_PADDING,
        (oyLabels.labels.length - i) * gridLinesHeight + OY_LABELS_MARGIN_TOP + oyLabels.offsetY.value
      );
      ctx.moveTo(CHART_GRID_PADDING, (i+1) * gridLinesHeight + oyLabels.offsetY.value);
      ctx.lineTo(w - CHART_GRID_PADDING, (i+1) * gridLinesHeight + oyLabels.offsetY.value);
    }
    ctx.stroke();
  }

  function drawBars() {
    // console.log('draw bars');
    ctx.beginPath();
    ctx.globalAlpha = 0.4; // FIXME Color to const
    var Y = yCoords.values.slice(startInd, endInd);
    for (var i = 0; i < xCoords.length; i++) {
      ctx.rect(xCoords[i], Y[i].value, barWidth, bottomY - Y[i].value);
    }
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
  }

  requestAnimationFrame(me.draw);
  return me;
}

function getXCoords(width, X, step, offset=0) {
  var coords = [];
  // var step = width/X.length;
  for (var i = 0; i < X.length; i++) {
    coords.push(i*step + offset);
  }
  return coords;
}

function getYCoords(height, Y, max) {
  var coords = []
  for (var i = 0; i < Y.length; i++) {
    coords.push(height - (Y[i]/max) * height)
  }
  return coords;
}
