import {
  PREVIEW_INIT_W, PREVIEW_BORDER_WIDTH, PREVIEW_MASK_COLOR
} from '../consts.js';


export function createPreview(w, h, initWidth, data) {
  let preview = document.createElement('div');

  let maskContainer = sliderDiv(w, h, '', 1, 0, 1);
  let leftMask = sliderDiv(w * (1 - initWidth), h, PREVIEW_MASK_COLOR, 0.5);
  let rightMask = sliderDiv(0, h, PREVIEW_MASK_COLOR, 0.5, 200);

  let center = sliderDiv(w * initWidth, h, 'rgba(#000000, 0.15)', 1, h * (1 - initWidth)); // FIXME Color
  center.style.borderStyle = 'solid';
  center.style.borderColor = 'blue';
  center.style.borderWidth = `2px ${PREVIEW_BORDER_WIDTH}px`;
  center.style.boxSizing = 'border-box';

  let sliderState = { left: 0, right: 0 };
  let updateState = function() {
    sliderState.left = center.getLeft() / w;
    sliderState.right = rightMask.getLeft() / w;

    // console.log('update slider', sliderState);

    if (preview.onupdate) {
      preview.onupdate(sliderState);
    }
  }

  let onMouseDown = function(e) {
    let gLeft = center.getBoundingClientRect().left;
    let gRight = center.getBoundingClientRect().right;

    if ((e.clientX > gLeft) && (e.clientX < gLeft + PREVIEW_BORDER_WIDTH)) {
      let centerOffsetX = gLeft - e.clientX - (gLeft - center.getLeft());

      onmousemove = function(e) {
        expandSliderLeft(e.clientX + centerOffsetX); //FIXME debounce
      };
    }
    else if ((e.clientX < gRight) && (e.clientX > gRight - PREVIEW_BORDER_WIDTH)) {
      let offset = center.getWidth() - (e.clientX - gLeft);
      onmousemove = function(e) {
        expandSliderRight(e.clientX - gLeft + offset); //FIXME debounce
      };
    }
    else {
      let centerOffsetX = gLeft - e.clientX - (gLeft - center.getLeft());

      onmousemove = function(e) {
        moveSlider(e.clientX + centerOffsetX); //FIXME debounce
      };
    }

    onmouseup = function(e) {endSliderMoving();}
    return false;
  };

  let endSliderMoving = function() {
    onmousemove = null;
    onmouseup = null;
    // centerOffsetX = null;
  }

  let moveSlider = function(l) {
    if (l < 0) l = 0;
    else if (l + center.getWidth() > w) l = w - center.getWidth();
    center.setLeft(l);
    updateMasks();
  }

  let expandSliderRight = function(w) {
    let l = center.getLeft();
    if (l + w > w) w = w - l;
    center.setWidth(w);
    updateMasks();
  }

  let expandSliderLeft = function(l) {
    if (l < 0) l = 0;

    // let lOld = center.getLeft();
    let dw = center.getLeft() - l;

    if (l + center.getWidth() > w) l = w - center.getWidth();
    center.setLeft(l);
    center.updateWidth(dw);

    updateMasks();
  }

  let updateMasks = function() {
    leftMask.setWidth(center.getLeft());
    rightMask.setLeft(center.getLeft() + center.getWidth());
    rightMask.setWidth(w - rightMask.getLeft());

    updateState();
  }
  updateMasks();

  center.onmousedown = onMouseDown;

  maskContainer.append(leftMask);
  maskContainer.append(rightMask);
  maskContainer.append(center);

  preview.style.position = 'relative';
  preview.append(maskContainer);
  return preview;
}

function sliderDiv(w, h, bgColor='', op=1, left=0, zIndex=0) {
  let div = document.createElement('div');
  div.style.width = w + 'px';
  div.style.height = h + 'px';
  div.style.opacity = op;
  div.style.backgroundColor = bgColor;
  div.style.position = 'absolute';
  div.style.zIndex = zIndex;
  div.style.left = left + 'px';

  div.getWidth = function() {return parseInt(div.style.width.replace('px', ''));}
  div.getLeft = function() {return parseInt(div.style.left.replace('px', ''));}
  div.getRight = function() {return parseInt(div.style.right.replace('px', ''));}

  div.setWidth = function(w) {div.style.width = w + 'px';}
  div.setLeft = function(v) {div.style.left = v + 'px';}
  div.setRight = function(v) {div.style.right = v + 'px';}
  div.updateWidth = function(dw) {div.style.width = div.offsetWidth + dw + 'px';}
  div.updateLeft = function(dl) {div.style.left = div.getLeft() + dl + 'px';}

  return div;
}
