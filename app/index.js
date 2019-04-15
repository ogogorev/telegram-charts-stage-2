for (var i = 0; i < 6; i++) {
  getData('./data/chart' + i + '.json', function(data) {
    // console.log(data);
    createChart(data);
  })
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
