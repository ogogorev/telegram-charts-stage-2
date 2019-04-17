import {
  PREVIEW_INIT_W, previewMaskColor, PREVIEW_INNER_MARGIN_TOP, PREVIEW_DAY_THEME
} from '../consts.js';

const PREVIEW_RESIZE_AREA_WIDTH = 10;
const PREVIEW_MIN_WIDTH = 30;

const PREVIEW_BORDERS_WIDTH = 10;
const PREVIEW_BORDER_RADIUS = 5;

export function preview(w, h, pixelRatio) {
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');

  var currW = w;
  var currH = h;

  canvas.width = currW * pixelRatio;
  canvas.height = currH * pixelRatio;
  canvas.style.width = currW + 'px';
  canvas.style.height = currH + 'px';
  ctx.scale(pixelRatio, pixelRatio);

  var previewMaskColor = '#000000';
  var previewMaskAlpha = '#000000';
  var previewBorderColor = '#000000';
  var previewCornersFillColor = '#000000';

  var previewHeight = currH - PREVIEW_INNER_MARGIN_TOP * 2;

  var leftX = (1 - PREVIEW_INIT_W) * currW;
  var rightX = 1 * currW;

  var state = { left: 1 - PREVIEW_INIT_W, right: 1 };
  function updateState() {
    state.left = leftX/currW;
    state.right = rightX/currW;

    if (canvas.onupdate) {
      canvas.onupdate(state);
    }
  }
  updateState();

  canvas.updateWidth = function(w, pixelRatio) { //FIXME Rename
    currW = w;

    canvas.width = currW * pixelRatio;
    canvas.height = currH * pixelRatio;
    canvas.style.width = currW + 'px';
    ctx.scale(pixelRatio, pixelRatio);

    leftX = state.left * currW
    rightX = state.right * currW;

    draw();
  }

  canvas.switchTheme = function(theme) {
    setTheme(theme);
    draw();
  }

  function setTheme(theme) {
    previewMaskColor = theme.previewMaskColor;
    previewMaskAlpha = theme.previewMaskAlpha;
    previewBorderColor = theme.previewBorderColor;
    previewCornersFillColor = theme.previewCornersFillColor;
  }
  setTheme(PREVIEW_DAY_THEME);

  function leftZoneUpdate(x) {
    if (leftX > rightX - PREVIEW_MIN_WIDTH) leftX = rightX - PREVIEW_MIN_WIDTH;
    else if (leftX < 0) leftX = 0;

    requestAnimationFrame(function() {
      draw();
      updateState();
    });
  }

  function centralZoneUpdate(currWidth) {
    if (leftX < 0) leftX = 0;
    if (leftX > currW - currWidth) leftX = currW - currWidth;
    rightX = leftX + currWidth;

    requestAnimationFrame(function() {
      draw();
      updateState();
    });
  }

  function rightZoneUpdate(x) {
    if (rightX < leftX + PREVIEW_MIN_WIDTH) rightX = leftX + PREVIEW_MIN_WIDTH;
    else if (rightX > currW) rightX = currW;

    requestAnimationFrame(function() {
      draw();
      updateState();
    });
  }

  canvas.onmousedown = function(e) {
    console.log('mouse down', e);

    if (isLeftZone(e.clientX - canvas.getBoundingClientRect().x)) {
      var offsetLeftX = leftX - e.clientX;

      onmousemove = function(e) { // TODO Отвязать от window! Привязать к основному контейнеру
        leftX = e.clientX + offsetLeftX;
        leftZoneUpdate();
      };
    }
    else if (isCentralZone(e.clientX - canvas.getBoundingClientRect().x)) {
      var offsetLeftX = leftX - e.clientX;
      var currWidth = rightX - leftX;

      onmousemove = function(e) {
        leftX = e.clientX + offsetLeftX;
        centralZoneUpdate(currWidth);
      };
    }
    else if (isRightZone(e.clientX - canvas.getBoundingClientRect().x)) {
      var offsetRightX = rightX - e.clientX;

      onmousemove = function(e) {
        rightX = e.clientX + offsetRightX;
        rightZoneUpdate();
      };
    }

    onmouseup = function(e) {
      onmousemove = null;
      onmouseup = null;
    }

    return false;
  }

  canvas.ontouchstart = function(e) {
    console.log('mouse down', e);

    if (isLeftZone(e.touches[0].clientX - canvas.getBoundingClientRect().x)) {
      var offsetLeftX = leftX - e.touches[0].clientX;

      ontouchmove = function(e) { // TODO Отвязать от window! Привязать к основному контейнеру
        leftX = e.touches[0].clientX + offsetLeftX;
        leftZoneUpdate();
      };
    }
    else if (isCentralZone(e.touches[0].clientX - canvas.getBoundingClientRect().x)) {
      var offsetLeftX = leftX - e.touches[0].clientX;
      var currWidth = rightX - leftX;

      ontouchmove = function(e) {
        leftX = e.touches[0].clientX + offsetLeftX;
        centralZoneUpdate(currWidth);
      };
    }
    else if (isRightZone(e.touches[0].clientX - canvas.getBoundingClientRect().x)) {
      var offsetRightX = rightX - e.touches[0].clientX;

      ontouchmove = function(e) {
        rightX = e.touches[0].clientX + offsetRightX;
        rightZoneUpdate();
      };
    }

    ontouchend = function(e) {
      ontouchmove = null;
      ontouchend = null;
    }

    return false;
  }

  var offX = 1;
  var maskOverlayX = 4;
  function draw() {
    ctx.clearRect(0, 0, currW, currH);

    ctx.beginPath();
    ctx.fillStyle = previewMaskColor;
    ctx.globalAlpha = previewMaskAlpha;

    var left = leftX;
    var right = rightX;
    ctx.rect(0, PREVIEW_INNER_MARGIN_TOP, left + maskOverlayX, previewHeight);
    ctx.rect(right - maskOverlayX, PREVIEW_INNER_MARGIN_TOP, currW - right + maskOverlayX, previewHeight);
    ctx.fill();


    ctx.globalAlpha = 1;
    ctx.fillStyle = previewCornersFillColor;

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
      currW - PREVIEW_BORDER_RADIUS,
      PREVIEW_BORDER_RADIUS + PREVIEW_INNER_MARGIN_TOP,
      PREVIEW_BORDER_RADIUS,
      1.5*Math.PI,
      0*Math.PI
    );
    ctx.moveTo(currW, PREVIEW_BORDER_RADIUS + PREVIEW_INNER_MARGIN_TOP);
    ctx.lineTo(currW, PREVIEW_INNER_MARGIN_TOP);
    ctx.lineTo(currW - PREVIEW_BORDER_RADIUS, PREVIEW_INNER_MARGIN_TOP);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(
      currW - PREVIEW_BORDER_RADIUS,
      currH - PREVIEW_BORDER_RADIUS - PREVIEW_INNER_MARGIN_TOP,
      PREVIEW_BORDER_RADIUS,
      0*Math.PI,
      0.5*Math.PI
    );
    ctx.moveTo(currW - PREVIEW_BORDER_RADIUS, currH - PREVIEW_INNER_MARGIN_TOP);
    ctx.lineTo(currW, currH - PREVIEW_INNER_MARGIN_TOP);
    ctx.lineTo(currW, currH - PREVIEW_BORDER_RADIUS - PREVIEW_INNER_MARGIN_TOP);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(
      PREVIEW_BORDER_RADIUS,
      currH - PREVIEW_BORDER_RADIUS - PREVIEW_INNER_MARGIN_TOP,
      PREVIEW_BORDER_RADIUS,
      0.5*Math.PI,
      1*Math.PI
    );
    ctx.moveTo(0, currH - PREVIEW_BORDER_RADIUS - PREVIEW_INNER_MARGIN_TOP);
    ctx.lineTo(0, currH - PREVIEW_INNER_MARGIN_TOP);
    ctx.lineTo(PREVIEW_BORDER_RADIUS, currH - PREVIEW_INNER_MARGIN_TOP);
    ctx.fill();

    ctx.strokeStyle = previewBorderColor;
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

    ctx.fillStyle = previewBorderColor;
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
