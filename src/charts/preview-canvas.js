import {
  PREVIEW_INIT_W, PREVIEW_BORDER_WIDTH, PREVIEW_MASK_COLOR
} from '../consts.js';

const PREVIEW_RESIZE_AREA_WIDTH = 10;
const PREVIEW_MIN_WIDTH = 30;

export function createPreview(w, h, data, onUpdate) {
  var container = document.createElement('div');

  var p = preview(w, h);
  p.onupdate = function(state) {
    onUpdate(state);
  }

  container.append(chart(w, h));
  container.append(p);
  return container;
}

function preview(w, h) {
  var canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.style.position = 'absolute';
  var ctx = canvas.getContext('2d');

  var leftX = (1 - PREVIEW_INIT_W) * w;
  var rightX = 1 * w;

  var state = { left: 1 - PREVIEW_INIT_W, right: 1 };
  function updateState() {
    state.left = leftX/w;
    state.right = rightX/w;

    if (canvas.onupdate) {
      canvas.onupdate(state);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = PREVIEW_MASK_COLOR;
    ctx.globalAlpha = 0.5;

    var left = leftX;
    var right = rightX;
    ctx.rect(0, 0, left, h);
    ctx.rect(right, 0, w - right, h);
    ctx.fill();

    // requestAnimationFrame(draw);
  }

  canvas.onmousedown = function(e) {
    console.log('mouse down', e);

    if (isLeftZone(e.offsetX)) {
      var offsetLeftX = leftX - e.clientX;

      onmousemove = function(e) { // TODO Отвязать от window! Привязать к основному контейнеру
        leftX = e.clientX + offsetLeftX;
        if (leftX > rightX - PREVIEW_MIN_WIDTH) leftX = rightX - PREVIEW_MIN_WIDTH;
        else if (leftX < 0) leftX = 0;
        // requestAnimationFrame(draw);
        // updateState();

        requestAnimationFrame(function() {
          draw();
          updateState();
        });
      };
    }
    else if (isCentralZone(e.offsetX)) {
      var offsetLeftX = leftX - e.clientX;
      var currWidth = rightX - leftX;

      onmousemove = function(e) {
        leftX = e.clientX + offsetLeftX;
        if (leftX < 0) leftX = 0;
        if (leftX > w - currWidth) leftX = w - currWidth;
        rightX = leftX + currWidth;
        // requestAnimationFrame(draw);
        // updateState();

        requestAnimationFrame(function() {
          draw();
          updateState();
        });
      };
    }
    else if (isRightZone(e.offsetX)) {
      var offsetRightX = rightX - e.clientX;

      onmousemove = function(e) {
        rightX = e.clientX + offsetRightX;
        if (rightX < leftX + PREVIEW_MIN_WIDTH) rightX = leftX + PREVIEW_MIN_WIDTH;
        else if (rightX > w) rightX = w;
        // requestAnimationFrame(draw);
        // updateState();

        requestAnimationFrame(function() {
          draw();
          updateState();
        });
      };
    }

    onmouseup = function(e) {
      onmousemove = null;
      onmouseup = null;
    }

    return false;
  };

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

// Mock
function chart(w, h) {
  var container = document.createElement('div');
  container.style.width = w + 'px';
  container.style.height = h + 'px';
  container.style.position = 'absolute';
  container.innerHTML = 'chart';
  return container;
}
