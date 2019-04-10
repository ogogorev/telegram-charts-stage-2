import { chartBase } from './chart';
import { AnimatedValue, main } from '../animations';
import {
  createLabelFromDate,
  getMin, getMax,
  debounce, getGridValuesByMax
} from '../utils';
import { OXLABELS_HEIGHT, CHART_GRID_PADDING, GRID_LINES_COUNT } from '../consts';

const Y_ANIMATION_TIME = 300;
const OY_LABELS_MARGIN_TOP = -10;

// main();

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

  console.log('oxLabels: ', oxLabels);

  var xCoords = getXCoords(w, oxLabels);
  // var yCoords = getYCoords(bottomY, values, getMax(values)).map(y => new AnimatedValue(y, 0.5));
  var yCoords = getYCoords(bottomY, values, getMax(values));
  var barWidth = 0;
  var offsetX = 0;

  var startInd = 0;
  var endInd = 0;

  var currMaxY = 0;

  // var oxLabelsAlpha =
  var oldOyLabels = { alpha: 0, offsetY: 0, labels: [0, 1, 2, 3, 4, 5, 6] };
  var newOyLabels = { alpha: 1, offsetY: 0, labels: [0, 1, 2, 3, 4, 5, 6] };

  me.draw = function() {
    // if (!me.needToUpdate) return;

    console.log('barchart drawww', me.leftX);

    ctx.clearRect(0, 0, w, h);

    drawBg();
    drawBars();
    // me.needToUpdate = false;
    // requestAnimationFrame(me.draw);
  }

  me.update = function() {
    // console.log('update');

    startInd = Math.floor(me.previewLeftX * dataLength);
    endInd = Math.ceil(me.previewRightX * dataLength);
    barWidth = w/(dataLength*(me.previewRightX-me.previewLeftX));
    offsetX = -barWidth * (dataLength*me.previewLeftX - startInd);

    // oyLabels = getGridValuesByMax(getMax(values.slice(startInd, endInd)));
    var maxY = getMax(values.slice(startInd, endInd));
    // var maxY = oyLabels.splice(-1, 1)[0];


    xCoords = getXCoords(w, oxLabels.slice(startInd, endInd), barWidth, offsetX);
    me.draw();

    // yCoords = getYCoords(bottomY, values.slice(startInd, endInd), oyLabels.splice(-1, 1));
    // yCoords = getYCoords(bottomY, values, oyLabels.splice(-1, 1));
    // setYCoords(getYCoords(bottomY, values, oyLabels.splice(-1, 1)));

    if (currMaxY !== maxY) {
      // currMaxY = maxY;
      updateY(maxY);
    }

    // me.draw(); // Call here requestAnimationFrame
    me.needToUpdate = true;
  }

  var updateY = debounce(function(max) {
    console.log('update Y');
    var newGridValues = getGridValuesByMax(max);

    var Y = getYCoords(bottomY, values, newGridValues.splice(-1, 1)[0]);
    oldOyLabels.labels = newOyLabels.labels;
    newOyLabels.labels = newGridValues;

    var k = 1;
    if (currMaxY > max) k = -1;
    currMaxY = max;

    var fromA = yCoords.concat(1, 0, -1, -k*gridLinesHeight/2);
    var toA = Y.concat(-1, k*gridLinesHeight/2, 1, 0);
    var i = yCoords.length;

    animateArray(
      fromA, toA, Y_ANIMATION_TIME,
      function(values) {
        yCoords = values.slice(0, i);
        oldOyLabels.alpha = values[i];
        oldOyLabels.offsetY = values[i+1];
        newOyLabels.alpha = values[i+2];
        newOyLabels.offsetY = values[i+3];
        me.draw();
      }
    );

    k = (k === 1) ? 0 : 1;
  }, 300);

  // function animateY(fromY, toY, duration) {
  //   var start = performance.now();
  //
  //   function update() {
  //     var p = (performance.now() - start) / duration;
  //     if (p > 1) p = 1;
  //     yCoords = fromY.map((from, i) => from + (toY[i]-from)*p);
  //     me.draw();
  //     if (p < 1) requestAnimationFrame(update);
  //   }
  //   requestAnimationFrame(update);
  // }

  function animateArray(fromA, toA, duration, cb, onFinishCb) {
    var start = performance.now();

    var A = fromA;

    function update() {
      var p = (performance.now() - start) / duration;
      if (p > 1) p = 1;
      A = fromA.map((a, i) => a + (toA[i]-a)*p);
      cb(A);
      if (p === 1) {
        if (onFinishCb) onFinishCb();
        return;
      }
      requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  function drawBg() {
    console.log('draw bg');

    drawOxLabels();
    drawOyLabels(oldOyLabels);
    drawOyLabels(newOyLabels);
  }

  const oxLabelWidth = 50;
  const countOnScreen = w/oxLabelWidth;

  function drawOxLabels() {
    console.log('draw ox labels');

    ctx.beginPath();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = 'black';

    var step = Math.max(1, (endInd-1 - startInd) / countOnScreen);
    var p = 1;
    while (step > p) p *= 2;
    step = p;

    var lastInd = oxLabels.length-1;
    while(lastInd > endInd-1) lastInd -= step;

    for (var i = lastInd, k=0; i >= startInd; i-=step, k++) {
      var labelOffsetX = (barWidth - ctx.measureText(oxLabels[i]).width) / 2
      var x = (i - startInd) * barWidth + offsetX + labelOffsetX;
      ctx.fillText(oxLabels[i], x, h - OXLABELS_HEIGHT/2);
    }
  }

  function drawOyLabels(oyLabels) {
    console.log('draw oy labels');
    if (oyLabels.alpha <= 0) return;
    ctx.beginPath();
    ctx.globalAlpha = oyLabels.alpha;
    ctx.fillStyle = 'black'; // FIXME color to const

    for (var i = 0; i < oyLabels.labels.length; i++) {
      ctx.fillText(oyLabels.labels[i], CHART_GRID_PADDING, (oyLabels.labels.length - i) * gridLinesHeight + OY_LABELS_MARGIN_TOP + oyLabels.offsetY); // FIXME Margin number
      ctx.moveTo(CHART_GRID_PADDING, (i+1) * gridLinesHeight + oyLabels.offsetY);
      ctx.lineTo(w - CHART_GRID_PADDING, (i+1) * gridLinesHeight + oyLabels.offsetY);
    }
    ctx.stroke();
  }

  function drawBars() {
    console.log('draw bars');
    ctx.beginPath();
    ctx.globalAlpha = 0.4;
    var Y = yCoords.slice(startInd, endInd);
    for (var i = 0; i < xCoords.length; i++) {
      ctx.rect(xCoords[i], Y[i], barWidth, bottomY - Y[i]);
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
