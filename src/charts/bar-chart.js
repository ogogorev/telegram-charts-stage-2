import { chartBase } from './chart';
import { main } from '../animations';
import {
  createLabelFromDate,
  getMin, getMax,
  debounce, getGridValuesByMax
} from '../utils';
import { OXLABELS_HEIGHT, CHART_GRID_PADDING, GRID_LINES_COUNT } from '../consts';

main();

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

  var xCoords = getXCoords(w, oxLabels);
  var yCoords = getYCoords(bottomY, values);
  var barWidth = 0;
  var offsetX = 0;

  var animationsStack = [];

  var oyLabels = [0,1 , 2, 3, 4, 5, 6];

  me.draw = function() {
    if (!me.needToUpdate) return;
    // if (!animationsStack.length) return;

    console.log('barchart drawww', me.leftX);

    ctx.clearRect(0, 0, w, h);

    drawBg();
    drawBars();
    me.needToUpdate = false;
    // requestAnimationFrame(me.draw);
  }

  me.update = function() {
    // console.log('update');

    var startInd = Math.floor(me.previewLeftX * dataLength);
    var endInd = Math.floor(me.previewRightX * dataLength) + 1;
    barWidth = w/(dataLength*(me.previewRightX-me.previewLeftX));
    offsetX = -barWidth * (dataLength*me.previewLeftX - startInd);

    oyLabels = getGridValuesByMax(getMax(values.slice(startInd, endInd)));

    xCoords = getXCoords(w, oxLabels.slice(startInd, endInd), barWidth, offsetX);
    yCoords = getYCoords(bottomY, values.slice(startInd, endInd), oyLabels.splice(-1, 1));

    me.draw();
    me.needToUpdate = true;
  }

  function drawBg() {
    drawOxLabels();
    drawOyLabels();
  }

  function drawOxLabels() {
    ctx.beginPath();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = 'black';

    var texts = ['Mar 11', 'Mar 12', 'Mar 13', 'Mar 14', 'Mar 15'];

    texts.map((text, i) => {
      ctx.fillText(text, i*50 , h - OXLABELS_HEIGHT/2);
    });
  }

  function drawOyLabels() {
    ctx.beginPath();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = 'black';

    for (var i = 0; i < oyLabels.length; i++) {
      ctx.fillText(oyLabels[i], CHART_GRID_PADDING, (oyLabels.length - i) * gridLinesHeight - 10);
      ctx.moveTo(CHART_GRID_PADDING, (i+1) * gridLinesHeight);
      ctx.lineTo(w - CHART_GRID_PADDING, (i+1) * gridLinesHeight);
    }
    ctx.stroke();
  }

  function drawBars() {
    ctx.beginPath();
    ctx.globalAlpha = 0.4;
    for (var i = 0; i < xCoords.length; i++) {
      ctx.rect(xCoords[i], yCoords[i], barWidth, bottomY - yCoords[i]);
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
