function main() {
  var appContainer = document.getElementById('app-container');

  var charts = [];

  getData('./data/chart1.json', function(data) {
    charts.push(lineChart(appContainer, data, 'Line chart'));
  });

  getData('./data/chart2.json', function(data) {
    charts.push(twoAxesLineChart(appContainer, data, 'Two axes line chart'));
  });

  getData('./data/chart3.json', function(data) {
    charts.push(stackedBarChart(appContainer, data, 'Stacked bar chart'));
  });

  getData('./data/chart4.json', function(data) {
    charts.push(barChart(appContainer, data, 'Bar chart'));
  });

  getData('./data/chart5.json', function(data) {
    charts.push(percentageStackedAreaChart(appContainer, data, 'Stacked area chart'));
  });


  var isDayMode = true;
  var button = document.getElementById('mode');
  button.addEventListener('click', function() {
    isDayMode = !isDayMode;

    for (var i = 0; i < charts.length; i++) {
      charts[i].switchMode(isDayMode);
    }

    if (isDayMode) {
      button.innerHTML = 'Switch to Night Mode';
      document.body.classList.remove('night-theme');
    }
    else {
      button.innerHTML = 'Switch to Day Mode';
      document.body.classList.add('night-theme');
    }

  });
}

window.onload = function() {
  main();
}









function getData(url, cb) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      cb(JSON.parse(this.responseText))
    }
  };
  xhttp.open("GET", url, true);
  xhttp.send();
}
