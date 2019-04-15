const INFO_ANIMATION_TIME = 0.3;

export function createInfo(name) {
  var container = document.createElement('div');
  // container.style.position = 'absolute';
  container.classList.add('point-info');
  container.style.transition = 'opacity ' + INFO_ANIMATION_TIME + 's';
  container.style.opacity = 0;
  container.style.display = 'none';
  container.isOn = false;

  // container.style.backgroundColor = 'red';

  var title = document.createElement('span');
  title.classList.add('point-info-title');
  title.innerHTML = 'Title';

  container.appear = function() {
    container.isOn = true;
    container.style.display = 'block';

    setTimeout(function() {
      container.style.opacity = 1;
    }, 0)
  }

  container.disappear = function() {
    if (container.isOn) {
      container.isOn = false;
      container.style.opacity = 0;
      setTimeout(function() {
        container.style.display = 'none';
      }, INFO_ANIMATION_TIME * 1000)
    }
  }

  container.setTitle = function(text) {
    title.innerHTML = text;
  }

  // container.getWidth = function() {
  //   return conatinergetCli
  // }
  var rows = {};

  container.addRow = function(text, value, color='black') {
    var newRow = document.createElement('div');
    newRow.id = 'row' + text;
    newRow.classList.add('point-info-row')

    var textSpan = document.createElement('span');
    textSpan.innerHTML = text;

    var valueSpan = document.createElement('span');
    valueSpan.classList.add('point-info-row-value')
    valueSpan.id = text;
    valueSpan.style.color = color;
    valueSpan.innerHTML = value;

    rows[text] = valueSpan;

    newRow.append(textSpan);
    newRow.append(valueSpan);
    container.append(newRow);
  }

  container.enableRow = function(text) {
    var e = document.getElementById('row' + text);
    if (e) {
      e.style.display = 'flex';
    }
  }

  container.disableRow = function(text) {
    var e = document.getElementById('row' + text);
    if (e) {
      e.style.display = 'none';
    }
  }

  container.setRowValue = function(key, value) {
    rows[key].innerHTML = value;
  }

  container.append(title);
  return container;
}
