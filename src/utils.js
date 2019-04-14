export function createLabelFromDate(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[new Date(date).getMonth()]} ${new Date(date).getDate()}`;
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

export function getGridValuesByMax(max) { // FIXME Отвязать от 6
  const k = getStepForGridValues(max);
  return [0, 1, 2, 3, 4, 5, 6].map(i => i*k/5);
}

// console.log('sdsdf', getStepForGridValues(91));
// console.log('sdsdf', getStepForGridValues(2));
// console.log('sdsdf', getStepForGridValues(10));
// console.log('sdsdf', getStepForGridValues(12));
// console.log('sdsdf', getStepForGridValues(13));
// console.log('sdsdf', getStepForGridValues(9567));
// console.log('sdsdf', getStepForGridValues(2000));
// console.log('sdsdf', getStepForGridValues(8787772));
// console.log('sdsdf', getStepForGridValues(100));
// console.log('sdsdf', getStepForGridValues(101));

// 18 0.4 2 2 2.4 1900 400 1700000 20 20
// console.log('sdsdf', getGridValuesByMax(getStepForGridValues(91)));

export function getStepForGridValues(max, k=1) { // FIXME Отвязать от 6
  if (max == Number.POSITIVE_INFINITY || max == Number.NEGATIVE_INFINITY) return 0;

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
