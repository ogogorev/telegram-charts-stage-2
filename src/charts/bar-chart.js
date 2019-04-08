import { createPreview } from './preview';
import {
  createLabelFromDate,
  getMin, getMax
} from '../utils';
import { PREVIEW_HEIGHT } from '../consts';

export function createChart(w, h, data) { // TODO Move to another file
  // TODO Handle all chart types
  var container = document.createElement('div');

  var chart = barChart(w, h, data);
  var preview = createPreview(w, PREVIEW_HEIGHT, 0.2, data); // TODO Pass chart type here, // FIXME remove "0.2"

  preview.onupdate = function(state) {
    chart.updateRange(state.left, state.right);
  }

  container.append(chart.canvas);
  container.append(preview);
  return container;
}

export function barChart(w, h, data) {
  console.log(data);
  var me = chartBase(w, h);
  var ctx = me.canvas.getContext('2d');

  var oxLabels = data.columns[0].slice(1, 50).map(date => createLabelFromDate(date));
  var values = data.columns[1].slice(1, 50);
  var color = data.colors[Object.keys(data.names)[0]];

  var xCoords = getXCoords(w, oxLabels);
  var yCoords = getYCoords(h, values);

  me.draw = function() {
    if (!me.needToUpdate) return;

    console.log('barchart draw', me.leftX);

    ctx.clearRect(0, 0, w, h);

    drawBars();
    me.needToUpdate = false;
    requestAnimationFrame(me.draw);
  }

  function drawBars() {
    ctx.fillStyle = color;
    for (var i = 0; i < xCoords.length; i++) {
      ctx.rect(xCoords[i], yCoords[i], xCoords[1] - xCoords[0], h);
    }
    ctx.fill();
  }

  requestAnimationFrame(me.draw);
  return me;
}

function getXCoords(width, X) {
  var coords = [];
  var step = width/X.length;
  for (var i = 0; i < X.length; i++) {
    coords.push(i*step);
  }
  return coords;
}

function getYCoords(height, Y) {
  var coords = []
  var max = getMax(Y);
  for (var i = 0; i < Y.length; i++) {
    coords.push(height - (Y[i]/max) * height)
  }
  return coords;
}

function chartBase(w, h) {
  var me = {};
  me.canvas = document.createElement('canvas');
  me.canvas.width = w;
  me.canvas.height = h;

  me.leftX = 0;
  me.rightX = 1;

  me.needToUpdate = true;

  me.draw = function() {}

  me.updateRange = function(left, right) {
    me.leftX = left;
    me.rightX = right;
    me.needToUpdate = true;
    me.draw();
  }

  return me;
}
