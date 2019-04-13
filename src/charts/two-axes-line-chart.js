import { getScreenXByInd, getYCoords } from './chart';
import { LineChart } from './line-chart';
import { AnimatedValue, AnimatedArray, main } from '../animations';
import {
  createLabelFromDate,
  getMin, getMax,
  getMatrixMax,
  debounce, getGridValuesByMax,
  getStepForGridValues,
  getDataColumnByName
} from '../utils';
import { OXLABELS_HEIGHT, CHART_GRID_PADDING, GRID_LINES_COUNT, PREVIEW_HEIGHT } from '../consts';

const Y_ANIMATION_TIME = .3; // FIXME
const OY_LABELS_MARGIN_TOP = -10; // FIXME

export function twoAxesLineChart(w, h, data) {
  var chart = new TwoAxesLineChart(w, h, data);
  return chart.container;
}

function TwoAxesLineChart(w, h, data) {
  // console.log(data);
  LineChart.apply(this, arguments);
  // this.init();
}

TwoAxesLineChart.prototype = Object.create(LineChart.prototype);
TwoAxesLineChart.prototype.constructor = TwoAxesLineChart;

TwoAxesLineChart.prototype.initOyProps = function() {
  LineChart.prototype.initOyProps.apply(this);

  // this.gridMaxY = new AnimatedValue(0, Y_ANIMATION_TIME);
  //
  // this.gridLinesHeight = Math.round(this.bottomY / GRID_LINES_COUNT);
  // this.oldOyLabels = {
  //   alpha: new AnimatedValue(0, Y_ANIMATION_TIME),
  //   offsetY: this.gridLinesHeight/2,
  //   labels: [0, 1, 2, 3, 4, 5, 6]
  // };
  // this.newOyLabels = {
  //   alpha: new AnimatedValue(1, Y_ANIMATION_TIME),
  //   offsetY: -this.gridLinesHeight/2,
  //   labels: [0, 1, 2, 3, 4, 5]
  // };

  this.gridStepYRight = 0;
  this.gridMaxYRight = new AnimatedValue(0, Y_ANIMATION_TIME);

  this.oldOyLabels.alphaRight = new AnimatedValue(0, Y_ANIMATION_TIME);
  this.oldOyLabels.labelsRight = [0, 1, 2, 3, 4, 5, 6];

  this.newOyLabels.alphaRight = new AnimatedValue(0, Y_ANIMATION_TIME);
  this.newOyLabels.labelsRight = [0, 1, 2, 3, 4, 5, 6];

  // this.oldOyLabelsRight = {
  //   alpha: new AnimatedValue(0, Y_ANIMATION_TIME),
  //   labels: [0, 1, 2, 3, 4, 5, 6]
  // };
  // this.newOyLabelsRight = {
  //   alpha: new AnimatedValue(1, Y_ANIMATION_TIME),
  //   labels: [0, 1, 2, 3, 4, 5]
  // };
}

TwoAxesLineChart.prototype.drawOyLabels = function(oyLabels) {
  // if (oyLabels.alpha.value <= 0 && oyLabels.alphaRight.value <= 0) return;
  if (oyLabels.alpha.value > 0) {
    this.ctx.fillStyle = this.columns[0].color;
    this.ctx.globalAlpha = oyLabels.alpha.value;
    var offset = Math.round(
      oyLabels.labels.length * this.gridLinesHeight + oyLabels.offsetY*(1-oyLabels.alpha.value)
    );

    for (var i = 1; i < oyLabels.labels.length; i++) {
      var y = offset - i * this.gridLinesHeight;

      this.ctx.fillText(
        oyLabels.labels[i],
        CHART_GRID_PADDING,
        y + OY_LABELS_MARGIN_TOP
      );
    }

    this.ctx.beginPath();
    this.ctx.globalAlpha = 1;
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = 'black'; // FIXME Color to const
    for (var i = 1; i < 6; i++) {
      var y = (oyLabels.labels.length - i) * this.gridLinesHeight;

      y -= 0.5;
      this.ctx.moveTo(CHART_GRID_PADDING, y);
      this.ctx.lineTo(this.w - CHART_GRID_PADDING, y);
    }
    this.ctx.stroke();
  }

  if (oyLabels.alphaRight.value > 0) {
    this.ctx.fillStyle = this.columns[1].color;
    this.ctx.globalAlpha = oyLabels.alphaRight.value;
    var offset = Math.round(
      oyLabels.labelsRight.length * this.gridLinesHeight + oyLabels.offsetY*(1-oyLabels.alphaRight.value)
    );

    for (var i = 1; i < oyLabels.labelsRight.length; i++) {
      var y = offset - i * this.gridLinesHeight;

      this.ctx.fillText(
        oyLabels.labelsRight[i],
        CHART_GRID_PADDING + this.gridWidth - this.ctx.measureText(oyLabels.labelsRight[i]).width,
        y + OY_LABELS_MARGIN_TOP
      );
    }
  }
}

TwoAxesLineChart.prototype.checkRedrawBg = function(now) {
  LineChart.prototype.checkRedrawBg.call(this, now);

  if (this.gridMaxYRight.nextTick(now)) this.needRedraw = true;
  if (this.oldOyLabels.alphaRight.nextTick(now)) this.needRedraw = true;
  if (this.newOyLabels.alphaRight.nextTick(now)) this.needRedraw = true;
}

TwoAxesLineChart.prototype.updateY = function () {
  var maxY = getMax(this.columns[0].values.slice(this.startInd, this.endInd+1));
  var maxYRight = getMax(this.columns[1].values.slice(this.startInd, this.endInd+1));
  var newGridStepY = getStepForGridValues(maxY);
  var newGridStepYRight = getStepForGridValues(maxYRight);

  if (this.gridStepY !== newGridStepY) {
    var now = performance.now();

    this.gridMaxY.set(newGridStepY*6, now, true);

    if (
      (this.oldOyLabels.offsetY > 0 && this.gridStepY > newGridStepY) ||
      (this.oldOyLabels.offsetY < 0 && this.gridStepY < newGridStepY)
    ) {
      this.oldOyLabels.offsetY *= -1;
      this.newOyLabels.offsetY *= -1;
    }

    this.gridStepY = newGridStepY;

    this.oldOyLabels.alpha.set(1);
    this.oldOyLabels.alpha.set(0, now, true);
    this.newOyLabels.alpha.set(0);
    this.newOyLabels.alpha.set(1, now, true);

    this.oldOyLabels.labels = this.newOyLabels.labels;
    this.newOyLabels.labels = [0, 1, 2, 3, 4, 5].map(n => n*newGridStepY);
  }

  if (this.gridStepYRight !== newGridStepYRight) {
    var now = performance.now();

    this.gridMaxYRight.set(newGridStepYRight*6, now, true);
    this.gridStepYRight = newGridStepYRight;

    this.oldOyLabels.alphaRight.set(1);
    this.oldOyLabels.alphaRight.set(0, now, true);
    this.newOyLabels.alphaRight.set(0);
    this.newOyLabels.alphaRight.set(1, now, true);

    this.oldOyLabels.labelsRight = this.newOyLabels.labelsRight;
    this.newOyLabels.labelsRight = [0, 1, 2, 3, 4, 5].map(n => n*newGridStepYRight);
  }
};

TwoAxesLineChart.prototype.getGridMaxForColumn = function(column) {
  return (this.columns[0].id === column.id) ? this.gridMaxY.value : this.gridMaxYRight.value;
};

// TwoAxesLineChart.prototype.drawMini = function() {
//   this.ctx.clearRect(this.miniChartX, this.miniChartY, this.miniChartWidth, this.miniChartHeight);
//
//   var X = [];
//   for (var i = 0; i < this.oxLabels.length; i++) {
//     X.push(getScreenXByInd(i, this.miniChartStep, this.miniChartX));
//   }
//   var max = getMatrixMax(this.columns.filter(c => c.isOn).map(c => c.values));
//
//   this.ctx.beginPath();
//   for (var i = 0; i < this.columns.length; i++) {
//     var Y = getYCoords(this.miniChartHeight, this.columns[i].values, max).map(y => this.miniChartY + y);
//     this.drawLine(X, Y, this.columns[i].color, this.columns[i].alpha.value);
//   }
// }

// TwoAxesLineChart.prototype.initData = function() {
//   LineChart.prototype.initData.call(this, 150);
// }

// TwoAxesLineChart.prototype.buttonClicked = function(name, isOn) {
//   var now = performance.now();
//   for (var i = 0; i < this.columns.length; i++) {
//     if (this.columns[i].name === name) {
//       if (isOn) this.columns[i].alpha.set(1, now, true)
//       else this.columns[i].alpha.set(0, now, true)
//       this.columns[i].isOn = isOn;
//       this.update();
//     }
//   }
// }

// TwoAxesLineChart.prototype.drawChartContent = function() {
//   var barW = Math.round(this.barWidth*this.round)/this.round;
//   var sI = Math.max(this.startInd-1, 0);
//   var eI = Math.min(this.endInd+1, this.L);
//
//   var X = [];
//   for (var i = sI; i < eI+1; i++) {
//     X.push(getScreenXByInd(i, barW, this.offsetX));
//   }
//
//   for (var i = 0; i < this.columns.length; i++) {
//     var Y = getYCoords(this.bottomY, this.columns[i].values.slice(sI, eI+1), this.gridMaxY.value);
//     this.drawLine(X, Y, this.columns[i].color, this.columns[i].alpha.value);
//   }
// }

// TwoAxesLineChart.prototype.drawLine = function(X, Y, color, alpha=1) {
//   if (alpha > 0) {
//     this.ctx.beginPath();
//     this.ctx.globalAlpha = alpha;
//     this.ctx.strokeStyle = color;
//     this.ctx.lineCap = 'round';
//     this.ctx.lineWidth = 2;
//
//     this.ctx.moveTo(X[0], Y[0]);
//     for (let i=1; i < X.length; i++) {
//       this.ctx.lineTo(X[i], Y[i]);
//     }
//     this.ctx.stroke();
//   }
// }

// TwoAxesLineChart.prototype.drawSelected = function() {
//   if (this.selectedInd >= this.startind && this.selectedInd <= this.endInd) {
//     var ind = this.selectedInd - this.startind;
//     var filteredColumns = this.columns.filter(c => c.isOn);
//
//     this.ctx.beginPath();
//     this.ctx.strokeStyle = '#000000';
//     this.ctx.moveTo(selectedScreenX, 0);
//     this.ctx.lineTo(selectedScreenX, bottomY);
//     this.ctx.stroke();
//
//     this.ctx.beginPath();
//     this.ctx.fillStyle = '#FFFFFF'; // FIXME Color
//     filteredColumns.forEach(c => {
//       // this.ctx.arc(Math.floor(X[ind]), Math.floor(getScreenY(bottomY, c.values[this.selectedInd], gridMaxY.value)), 5.5, 0, 2 * Math.PI);
//       // this.ctx.arc(Math.floor(X[ind]), Math.floor(getScreenY(bottomY, c.values[this.selectedInd], gridMaxY.value)), 5.5, 0, 2 * Math.PI);
//     });
//     this.ctx.fill();
//
//     filteredColumns.forEach(c => {
//       this.ctx.beginPath();
//       this.ctx.strokeStyle = data.colors[c.id]; // FIXME Color
//       // this.ctx.arc(Math.floor(X[ind]), Math.floor(getScreenY(bottomY, c.values[this.selectedInd], gridMaxY.value)), 5.5, 0, 2 * Math.PI);
//       this.ctx.arc(Math.floor(getScreenXByInd(this.selectedInd, barW, this.offsetX)), Math.floor(getScreenY(bottomY, c.values[this.selectedInd], gridMaxY.value)), 5.5, 0, 2 * Math.PI);
//       this.ctx.stroke();
//       this.ctx.closePath();
//     });
//
//     this.info.style.left = X[ind] + (this.barWidth - this.info.offsetWidth)/2 + 'px';
//     this.info.style.top = Y[ind] - this.info.offsetHeight  - 15 + 'px'; // FIXME this.info margin
//     this.info.appear();
//   }
//   else {
//     this.info.disappear()
//   }
// }

// TwoAxesLineChart.prototype.drawMini = function() {
//   this.ctx.clearRect(this.miniChartX, this.miniChartY, this.miniChartWidth, this.miniChartHeight);
//
//   var X = [];
//   for (var i = 0; i < this.oxLabels.length; i++) {
//     X.push(getScreenXByInd(i, this.miniChartStep, this.miniChartX));
//   }
//   var max = getMatrixMax(this.columns.filter(c => c.isOn).map(c => c.values));
//
//   this.ctx.beginPath();
//   for (var i = 0; i < this.columns.length; i++) {
//     var Y = getYCoords(this.miniChartHeight, this.columns[i].values, max).map(y => this.miniChartY + y);
//     this.drawLine(X, Y, this.columns[i].color, this.columns[i].alpha.value);
//   }
// }
