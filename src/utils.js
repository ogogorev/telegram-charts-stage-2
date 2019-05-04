export function createLabelFromDate(date, withYear=false) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var l = new Date(date).getDate() + ' ' + months[new Date(date).getMonth()];
  if (withYear) {
    l = l + ' ' + new Date(date).getFullYear();
  }
  return l;
}

export function getMatrixMin(m) {
  return Math.min.apply(
    null,
    m.map(
      row => Math.min.apply(null, row)
    )
  );
}

export function getMatrixMax(m) {
  return Math.max.apply(
    null,
    m.map(
      row => Math.max.apply(null, row)
    )
  );
}

export function getMin(arr) {
  return Math.min.apply(null, arr);
}

export function getMax(arr) {
  return Math.max.apply(null, arr);
}

export function debounce(func, wait, immediate) {
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

export function throttle(func, limit) {
  var timer = null;
  var context = null;
  var args = null;

  var invoke = function() {
    func.apply(context, args);
    timer = null;
  }

  return function() {
    context = this;
    args = arguments;

    if (!timer) {
      timer = setTimeout(invoke, limit);
    }
  }
}

export function getGridValuesByMax(max) { // FIXME Отвязать от 6
  const k = getStepForGridValues(max);
  return [0, 1, 2, 3, 4, 5, 6].map(i => i*k/5);
}

export function getStepForGridValues(max, k=1) { // FIXME Отвязать от 6
  if (max == Number.POSITIVE_INFINITY || max == Number.NEGATIVE_INFINITY || max === 0) return 0;

  if (max > 100) return getStepForGridValues(max/10, k*10);
  if (max < 1) return getStepForGridValues(max*10, k/10);

  if (max % 5 == 0) return k*max/5;
  const a = max*5/6;
  if (a % 5 == 0) return k*a/5;

  const ds = [5, 4, 2, 1];
  return s(a, max, ds);

  function s(a, b, ds) {
    let d = ds.shift();
    for (let i=Math.floor(b);i>=Math.ceil(a);i--) {
      if (i % d == 0) return k*i/5;
    }
    return s(a, b, ds);
  }
}

export function getDataColumnByName(name, data) {
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === name) {
      return data[i].slice(1);
    }
  }
  return [];
}

export function transpose(arr) {
  return arr[0].map((col, i) => arr.map(row => row[i]));
}

export function round(n, c=0) {
  return Math.round(n*Math.pow(10, c))/Math.pow(10, c);
}

export function sum(array) {
  return array.reduce((a, c) => a + c);
}

export function getPercents(values) {
  return values[0].map((_, i) => {
    var sum = values.map(c => c[i]).reduce((a, c) => a+c);
    if (sum === 0) return values.map(c => 0);
    return values.map(c => {
      return Math.round(10000*c[i]/sum)/100;
    });
  });
}

export function getStackedPercents(values) {
  return getPercents(values).map((row, i) => {
    return row.map((p, i) => {
      return round(sum(row.slice(0, i+1)), 2)
    })
  })
}

export function getStackedArraySums(values) {
  return transpose(transpose(values).map((row, i) => {
    return row.map((p, i) => {
      return round(sum(row.slice(0, i+1)), 2)
    })
  }))
}
