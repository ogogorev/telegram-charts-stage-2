export function createLabelFromDate(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[new Date(date).getMonth()]}&nbsp${new Date(date).getDate()}`;
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
