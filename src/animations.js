const FREQ = 50;

export function main() {

  var myValue = new AnimatedValue(3, 0.5);

  console.log(myValue);
  myValue.set(4);
  myValue.animate(6, 1);
  console.log('===========', myValue);

}

export function AnimatedValue(value, duration=0.5) {
  this.value = value;
  this.duration = duration * 1000;
  this.ease = function(t) {
    return t*(2-t);
  }
}
AnimatedValue.prototype.set = function(newValue, now=performance.now(), animated=false) {
  if (!animated) { this.value = newValue;return; }

  if (isNaN(this.value)) {
    return;
  }

  this.started = now;
  this.from = this.value;
  this.to = newValue;
  this.nextTick();
};
AnimatedValue.prototype.nextTick = function(now, name) {
  if (this.started) {
    var p = (now - this.started)/this.duration;
    if (p > 1) p = 1;
    if (p < 0) p = 0;
    this.value = Math.round((this.from + (this.to - this.from) * this.ease(p))*100)/100;

    if (p === 1) this.started = false;
    return true;
  }
  else {
    return false;
  }
};

export function AnimatedArray(values) {
  this.values = values;
}
AnimatedArray.prototype.nextTick = function(now) {
  var res = false;
  for (var i = 0; i < this.values.length; i++) {
    if (this.values[i].nextTick(now)) {
      res = true
    }
  }
  return res;
};

// export function AnimatedValue(value, duration=0) {
//   this.value = value;
//   this.duration = duration * 1000;
//   this.isAnimate = false;
// }
//
// AnimatedValue.prototype.set = function(newValue, duration=0) {
//   this.value = newValue;
// }

// AnimatedValue.prototype.animate = function(newValue, duration) {
//   this.from = this.value;
//   this.to = newValue;
//   if (duration) this.duration = duration*1000;
//   this.isAnimate = true;
//
//   var i = 0;
//   var interval = setInterval(() => {
//     if (this.value === this.to) {
//       clearInterval(interval);
//       // if (this.cb) this.cb();
//       this.isAnimate = false;
//       return;
//     }
//     i++;
//     var p = i / (this.duration / FREQ);
//     if (p > 1) p = 1;
//     // TODO Easing here
//     this.value = this.from + (this.to - this.from) * p;
//     // console.log(this.value);
//   }, FREQ);
// }
// export function createAnimationStack() {
//   return {
//     anims: [],
//     add: function(from, to, duration=1, cb) {
//       var a = createAnimation(from, to, duration);
//       a.cb = function() {
//         this.remove(a);
//       }.bind(this);
//       this.anims.push(a);
//     },
//     remove: function(a) {
//       if (this.anims.indexOf(a) !== -1) {
//         this.anims.splice(this.anims.indexOf(a), 1);
//       }
//     },
//     play: function() {
//       for (var i = 0; i < this.anims.length; i++) {
//         this.anims[i].play();
//       }
//     }
//   };
// }

// AnimatedValue.prototype.animate = function(newValue, duration) {
//   this.from = this.value;
//   this.to = newValue;
//   if (duration) this.duration = duration*1000;
//   this.isAnimate = true;
//
//   var start = performance.now();
//
//   function update() {
//     var p = (performance.now() - start) / this.duration;
//     if (p > 1) p = 1;
//     //TODO Eading here
//     this.value = this.from + (this.to - this.from) * p;
//     // console.log(this.value);
//     if (p < 1) requestAnimationFrame(update.bind(this));
//   };
//   requestAnimationFrame(update.bind(this));
// }

// function animateArray(fromA, toA, duration, cb, onFinishCb) {
//   var start = performance.now();
//
//   var A = fromA;
//   function update() {
//     var p = (performance.now() - start) / (duration*1000);
//     if (p > 1) p = 1;
//     A = fromA.map((a, i) => a + (toA[i]-a)*p);
//     cb(A);
//     if (p === 1) {
//       if (onFinishCb) onFinishCb();
//       return;
//     }
//     requestAnimationFrame(update);
//   }
//   requestAnimationFrame(update);
// }
