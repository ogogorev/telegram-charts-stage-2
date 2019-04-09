var chart_data = null;

function main() {
  var chart = createChart(400, 400, chart_data);
  document.body.append(chart);
}


window.onload = function() {
  window.fetch('chart4.json')
  .then(res => res.json()).then(res => {
    chart_data = res;
    main();
  });
}

function createChart(w, h, data) { // TODO Move to another file
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

function barChart(w, h, data) {
  console.log(data);
  var me = chartBase(w, h);
  var ctx = me.canvas.getContext('2d');

  var dataLength = 5; // FIXME Remove
  // var dataLength = data.columns[0].slice(1).length;
  var oxLabels = data.columns[0].slice(1, 1+dataLength).map(date => createLabelFromDate(date));
  // var values = data.columns[1].slice(1, 1+dataLength);
  var values = Array(dataLength).fill(0).map((e, i) => 1 + i*2);
  var color = data.colors[Object.keys(data.names)[0]];

  var xCoords = getXCoords(w, oxLabels);
  var yCoords = getYCoords(h, values);
  var barWidth = 0;
  var offsetX = 0;

  me.draw = function() {
    if (!me.needToUpdate) {
      requestAnimationFrame(me.draw);
      return;
    }

    console.log('barchart draw', me.leftX);

    ctx.clearRect(0, 0, w, h);

    drawBars();
    me.needToUpdate = false;
    requestAnimationFrame(me.draw);
  }

  me.update = function() {
    var startInd = Math.floor(me.previewLeftX * dataLength);
    var endInd = Math.floor(me.previewRightX * dataLength);
    barWidth = w/(dataLength*(me.previewRightX-me.previewLeftX));
    // barWidth = w/dataLength;
    offsetX = -barWidth * (dataLength*me.previewLeftX - startInd);

    xCoords = getXCoords(w, oxLabels.slice(startInd, endInd+1), offsetX);
    // xCoords = getXCoords(w, oxLabels, offsetX);
    yCoords = getYCoords(h, values.slice(startInd, endInd+1));
    // yCoords = getYCoords(h, values);
    console.log('update');
    console.log(me.previewLeftX, me.previewRightX);
    console.log(startInd, endInd);
    console.log(offsetX);
    console.log(xCoords, yCoords);
    // me.draw();
    me.needToUpdate = true;
  }

  function drawBars() {
    ctx.beginPath();
    ctx.fillStyle = color;
    for (var i = 0; i < xCoords.length; i++) {
      ctx.rect(xCoords[i], yCoords[i], barWidth, h);
    }
    ctx.fill();
    ctx.closePath();
  }

  requestAnimationFrame(me.draw);
  return me;
}

function getXCoords(width, X, offset=0) {
  var coords = [];
  var step = width/X.length;
  for (var i = 0; i < X.length; i++) {
    coords.push(i*step-offset);
  }
  return coords;
}

function getYCoords(height, Y) {
  var coords = []
  // var max = getMax(Y);
  var max = 12; //FIXME remove
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

  me.previewLeftX = 0;
  me.previewRightX = 1;

  me.needToUpdate = true;

  me.draw = function() {}
  me.update = function() {}

  me.updateRange = debounce(function(left, right) {
    me.previewLeftX = left;
    me.previewRightX = right;
    me.update();
  }, 30);

  return me;
}


function createPreview(w, h, initWidth, data) {
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

function createLabelFromDate(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[new Date(date).getMonth()]}&nbsp${new Date(date).getDate()}`;
}

function getMatrixMin(m) {
  return Math.min.apply(
    null,
    m.map(
      row => Math.min.apply(null, row)
    )
  );
}

function getMatrixMax(m) {
  return Math.max.apply(
    null,
    m.map(
      row => Math.max.apply(null, row)
    )
  );
}

function getMin(arr) {
  return Math.min.apply(null, arr);
}

function getMax(arr) {
  return Math.max.apply(null, arr);
}

function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
}

const PREVIEW_HEIGHT = 50;
const PREVIEW_INIT_W = 0.2;
const PREVIEW_BORDER_WIDTH = 10;
const PREVIEW_MASK_COLOR = 'black';
