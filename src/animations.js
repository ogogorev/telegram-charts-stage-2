export function createAnimationStack() {
  return {
    anims: [],
    add: function(from, to, duration=1, cb) {
      var a = createAnimation(from, to, duration);
      a.cb = function() {
        this.remove(a);
      }.bind(this);
      this.anims.push(a);
    },
    remove: function(a) {
      if (this.anims.indexOf(a) !== -1) {
        this.anims.splice(this.anims.indexOf(a), 1);
      }
    },
    play: function() {
      for (var i = 0; i < this.anims.length; i++) {
        this.anims[i].play();
      }
    }
  };
}

const FREQ = 20;
export function createAnimation(from, to, duration=1, cb) {
  return {
    from: from,
    value: from,
    to: to,
    cb: cb,
    duration: duration * 1000,
    play: function() {

      var i = 0;
      var interval = setInterval(() => {
        // if (this.value.v === this.to) {
        if (this.value.v === this.to) {
          clearInterval(interval);
          if (this.cb) this.cb();
          return;
        }
        i++;
        var p = i / (this.duration / FREQ);
        if (p > 1) p = 1;
        // TODO Easing here
        this.value.v = this.from.v + (this.to - this.from.v) * p;
        console.log(this.value.v);
      }, FREQ);
    }
  }
}

function ref(v) {
  return { v: v };
}

export function main() {

  var myValue = ref(1);

  var s = createAnimationStack();
  s.add(myValue, 2);
  s.play();

  setTimeout(() => {
    console.log(myValue);
  }, 2000);
}
