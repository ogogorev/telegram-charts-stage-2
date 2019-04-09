import { barChart } from './bar-chart';
import { createPreview } from './preview-canvas';
import { PREVIEW_HEIGHT } from '../consts';

export function createChart(w, h, data) { // TODO Move to another file
  // TODO Handle all chart types
  var container = document.createElement('div');

  var chart = barChart(w, h, data);
  var preview = createPreview(w, PREVIEW_HEIGHT, data, function(state) {
    chart.updateRange(state.left, state.right);
  }); // TODO Pass chart type here, // FIXME remove "0.2"

  container.append(chart.canvas);
  container.append(preview);
  return container;
}

export function chartBase(w, h) {
  var me = {};
  me.canvas = document.createElement('canvas');
  me.canvas.width = w;
  me.canvas.height = h;

  me.previewLeftX = 0;
  me.previewRightX = 1;

  me.needToUpdate = true;

  me.draw = function() {}
  me.update = function() {}

  me.updateRange = function(left, right) {
    me.previewLeftX = left;
    me.previewRightX = right;
    me.update();
  };

  return me;
}
