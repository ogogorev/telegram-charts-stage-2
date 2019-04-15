import {
  PREVIEW_INIT_W, PREVIEW_BORDER_WIDTH, PREVIEW_MASK_COLOR, PREVIEW_INNER_MARGIN_TOP
} from '../consts.js';

const PREVIEW_RESIZE_AREA_WIDTH = 10;
const PREVIEW_MIN_WIDTH = 30;


const PREVIEW_BORDER_COLOR = 'red';
const PREVIEW_BORDERS_WIDTH = 10;
const PREVIEW_BORDER_RADIUS = 10;

export function preview(w, h) {
  var canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;

  var previewHeight = h - PREVIEW_INNER_MARGIN_TOP * 2;
  // canvas.style.position = 'absolute';
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
  updateState();

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
  }

  var offX = 1;
  var maskOverlayX = 4;
  function draw() {
    ctx.clearRect(0, 0, w, h);

    ctx.beginPath();
    ctx.fillStyle = PREVIEW_MASK_COLOR;
    ctx.globalAlpha = 0.5;

    var left = leftX;
    var right = rightX;
    ctx.rect(0, PREVIEW_INNER_MARGIN_TOP, left + maskOverlayX, previewHeight);
    // ctx.rect(0, PREVIEW_INNER_MARGIN_TOP, left, previewHeight);
    ctx.rect(right - maskOverlayX, PREVIEW_INNER_MARGIN_TOP, w - right + maskOverlayX, previewHeight);
    ctx.fill();


    ctx.globalAlpha = 1;
    ctx.fillStyle = '#FFFFFF';

    ctx.beginPath();
    ctx.arc(
      PREVIEW_BORDER_RADIUS,
      PREVIEW_BORDER_RADIUS + PREVIEW_INNER_MARGIN_TOP,
      PREVIEW_BORDER_RADIUS,
      1*Math.PI,
      1.5*Math.PI
    );
    ctx.moveTo(PREVIEW_BORDER_RADIUS, PREVIEW_INNER_MARGIN_TOP);
    ctx.lineTo(0, PREVIEW_INNER_MARGIN_TOP);
    ctx.lineTo(0, PREVIEW_BORDER_RADIUS + PREVIEW_INNER_MARGIN_TOP);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(
      w - PREVIEW_BORDER_RADIUS,
      PREVIEW_BORDER_RADIUS + PREVIEW_INNER_MARGIN_TOP,
      PREVIEW_BORDER_RADIUS,
      1.5*Math.PI,
      0*Math.PI
    );
    ctx.moveTo(w, PREVIEW_BORDER_RADIUS + PREVIEW_INNER_MARGIN_TOP);
    ctx.lineTo(w, PREVIEW_INNER_MARGIN_TOP);
    ctx.lineTo(w - PREVIEW_BORDER_RADIUS, PREVIEW_INNER_MARGIN_TOP);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(
      w - PREVIEW_BORDER_RADIUS,
      h - PREVIEW_BORDER_RADIUS - PREVIEW_INNER_MARGIN_TOP,
      PREVIEW_BORDER_RADIUS,
      0*Math.PI,
      0.5*Math.PI
    );
    ctx.moveTo(w - PREVIEW_BORDER_RADIUS, h - PREVIEW_INNER_MARGIN_TOP);
    ctx.lineTo(w, h - PREVIEW_INNER_MARGIN_TOP);
    ctx.lineTo(w, h - PREVIEW_BORDER_RADIUS - PREVIEW_INNER_MARGIN_TOP);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(
      PREVIEW_BORDER_RADIUS,
      h - PREVIEW_BORDER_RADIUS - PREVIEW_INNER_MARGIN_TOP,
      PREVIEW_BORDER_RADIUS,
      0.5*Math.PI,
      1*Math.PI
    );
    ctx.moveTo(0, h - PREVIEW_BORDER_RADIUS - PREVIEW_INNER_MARGIN_TOP);
    ctx.lineTo(0, h - PREVIEW_INNER_MARGIN_TOP);
    ctx.lineTo(PREVIEW_BORDER_RADIUS, h - PREVIEW_INNER_MARGIN_TOP);
    ctx.fill();

    ctx.strokeStyle = PREVIEW_BORDER_COLOR;
    ctx.lineWidth = 1 + offX;
    ctx.globalAlpha = 1;
    roundRect(
      ctx,
      left+offX,
      PREVIEW_INNER_MARGIN_TOP,
      right - left - offX*2,
      previewHeight,
      [PREVIEW_BORDER_RADIUS, PREVIEW_BORDER_RADIUS, PREVIEW_BORDER_RADIUS, PREVIEW_BORDER_RADIUS]
    );

    ctx.fillStyle = PREVIEW_BORDER_COLOR;
    roundRect(
      ctx,
      left + offX,
      PREVIEW_INNER_MARGIN_TOP,
      8,
      previewHeight,
      [PREVIEW_BORDER_RADIUS, 0, 0, PREVIEW_BORDER_RADIUS],
      true
    );
    roundRect(
      ctx,
      right - 8 - offX,
      PREVIEW_INNER_MARGIN_TOP,
      8,
      previewHeight,
      [0, PREVIEW_BORDER_RADIUS, PREVIEW_BORDER_RADIUS, 0],
      true
    );
    // ctx.fill();

    // requestAnimationFrame(draw);
  }

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

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {

  // console.log('typeof', typeof radius);


  if (typeof stroke == 'undefined') {
    stroke = true;
  }
  if (typeof radius === 'undefined') {
    radius = 5;
  }
  if (typeof radius === 'number') {
    radius = {tl: radius, tr: radius, br: radius, bl: radius};
  }
  if (typeof radius === 'object') {
    radius = {tl: radius[0], tr: radius[1], br: radius[2], bl: radius[3]};
  } else {
    var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
    for (var side in defaultRadius) {
      radius[side] = radius[side] || defaultRadius[side];
    }
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) {
    ctx.fill();
  }
  else if (stroke) {
    ctx.stroke();
  }

}
