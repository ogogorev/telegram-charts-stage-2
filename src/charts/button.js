export function createButton(color, text, onClick) {
  var button = document.createElement('button');
  button.name = text;
  button.isOn = true;
  button.classList.add('chart-button');
  button.classList.add('checkmark');
  button.style.backgroundColor = color;

  var i = document.createElement('img');
  i.setAttribute('src', 'check.svg');
  button.append(i)
  button.append(document.createTextNode(text));

  button.onclick = function() {
    button.isOn = !button.isOn;
    if (!button.isOn) {
      // button.style.borderWidth = '0px';
    }
    if (onClick) onClick(button.name, button.isOn);
  };

  return button;
}
