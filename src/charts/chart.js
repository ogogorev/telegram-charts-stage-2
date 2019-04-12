import { barChart } from './bar-chart';
import { preview } from './preview-canvas';
import { PREVIEW_HEIGHT, CHART_GRID_PADDING } from '../consts';

export function chartBase(w, h, previewW, previewH) {
  var me = {};
  me.container = document.createElement('div');
  // me.container.id = 'chart container';
  me.container.style.width = w + 'px';
  me.container.style.height = h + 'px';
  me.container.style.position = 'relative';

  me.canvas = document.createElement('canvas');
  me.canvas.width = w;
  me.canvas.height = h;

  me.preview = preview(previewW, previewH);
  me.preview.onupdate = function(state) {
    // me.updateRange(state.left, state.right);
  } // TODO Pass chart type here, // FIXME remove "0.2"
  me.preview.style.position = 'absolute';
  me.preview.style.bottom = 0;
  me.preview.style.left = CHART_GRID_PADDING + 'px';

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

  me.container.append(me.canvas);
  me.container.append(me.preview);

  return me;
}

// export function createChart(w, h, data) { // TODO Move to another file
//   // TODO Handle all chart types
//   var container = document.createElement('div');
//
//   var chart = barChart(w, h, data);
//   var preview = createPreview(w, PREVIEW_HEIGHT, data, function(state) {
//     chart.updateRange(state.left, state.right);
//   }); // TODO Pass chart type here, // FIXME remove "0.2"
//
//   container.append(chart.canvas);
//   container.append(preview);
//   return container;
// }
