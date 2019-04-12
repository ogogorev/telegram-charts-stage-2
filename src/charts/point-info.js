const INFO_ANIMATION_TIME = 0.5;

export function createInfo() {
  var container = document.createElement('div');
  container.style.position = 'absolute';
  container.classList.add('point-info');
  container.style.transition = 'opacity ' + INFO_ANIMATION_TIME + 's';
  container.style.opacity = 0;


  // container.style.border = 'solder'
  container.style.boxShadow = '0 0 20px 1px grey';
  container.style.border = '0 hidden grey';
  container.style.borderRadius = '8px';
  container.style.padding = '8px';
  container.style.backgroundColor = 'white';
  container.style.fontSize = '12px';
  // container.style.border =
  // container.style.border =
  // container.style.border =
  // container.style.border =

  // container.style.backgroundColor = 'red';

  var title = document.createElement('span');
  title.style.fontWeight = 'bold';
  title.innerHTML = 'Title';

  container.appear = function() {
    container.style.opacity = 1;
  }

  container.disappear = function() {
    container.style.opacity = 0;
  }

  container.setTitle = function(text) {
    title.innerHTML = text;
  }

  // container.getWidth = function() {
  //   return conatinergetCli
  // }

  // var rows = {};
  container.addRow = function(text, value, color='black') {
    // rows[text] = value;

    var newRow = document.createElement('div');

    newRow.style.display = 'flex';
    newRow.style.justifyContent = 'space-between';

    var textSpan = document.createElement('span');
    // textSpan.id = text;
    textSpan.innerHTML = text;

    var valueSpan = document.createElement('span');
    valueSpan.id = text;
    valueSpan.style.color = color;
    valueSpan.style.marginLeft = '10px';
    valueSpan.innerHTML = value;

    newRow.append(textSpan);
    newRow.append(valueSpan);

    container.append(newRow);
  }

  container.setRowValue = function(key, value) {
    document.getElementById(key).innerHTML = value;
  }

  container.append(title);
  return container;
}
