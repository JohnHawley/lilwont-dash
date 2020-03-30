const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const portNum = 8080;
const port = process.env.PORT || portNum;


// Storage
const datapath = process.cwd() + '/lilwont-dash-data/';
const dataFile = path.join(datapath + 'data.json');
// const cacheFile = path.join(datapath + 'cache.json');

//install check
const defaultVals = {
  "lilwont": {
    "goal": "100",
    "bank": "87",
    "buy": "10",
    "cash": "1132"
  }
}

// Create data files
async function createDataFiles(f) {
  try {
    await fs.ensureFile(f + 'data.json')
    console.log("created file");
  } catch (err) {
    console.error(err)
  }
}

createDataFiles(datapath);


// Begin app.js
let connectedSockets = [];
app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/views/dashboard.html'));
});
app.get('/view/:item', function (req, res) {
  res.sendFile(path.join(__dirname + '/views/' + req.params.item + '.html'));
});
app.get('*/css/:file', function (req, res) {
  res.sendFile(path.join(__dirname + '/assets/css/' + req.params.file));
});
app.get('*/js/:file', function (req, res) {
  res.sendFile(path.join(__dirname + '/assets/js/' + req.params.file));
});
app.get('/dashboard', function (req, res) {
  res.sendFile(path.join(__dirname + '/views/dashboard.html'));
});
app.get('/assets/:asset', function (req, res) {
  res.sendFile(path.join(__dirname + '/assets/' + req.params.asset));
});
app.get('/data', function (req, res) {
  res.sendFile(dataFile);
});
app.post('/endpoint', function (req, res) {
  var file = fs.readFileSync(dataFile);
  if (file) {
    file = JSON.parse(file);
  } else {
    file = {};
    file.lilwont = {};
  }
  file.lilwont.buy = req.body.dayIn;
  file.lilwont.cash = req.body.dayOut;
  file.lilwont.bank = req.body.bnkNow;
  file.lilwont.goal = req.body.bnkGoal;
  fs.writeFile(dataFile, JSON.stringify(file, null, 2), function (err) {
    if (err)
      return console.log(err);
  });
  res.send(req.body);
});
// app.get('/socket.io/:file', function(req, res) {
//     console.log('Load: ' + req.params.file);
//     res.sendFile(path.join(__dirname + '/node_modules/socket.io-client/dist/' + req.params.file));
// });

// var io = require('socket.io').listen(app);

io.sockets.on('connection', function (socket) {
  connectedSockets.push(socket);
});

setTimeout(() => {
  fs.writeFile(dataFile, JSON.stringify(defaultVals, null, 2), function (err) {
    if (err)
      return console.log(err);
  });

  // Start watching our cache file
  fs.watch(dataFile, function (event, filename) {
    if (event == 'change') {
      fs.readFile(dataFile, function (err, data) {
        if (err)
          throw err;
        connectedSockets.forEach(function (socket) {
          socket.emit('data', JSON.parse(data));
        });
      });
    }
  });
}, 2000);

http.listen(port, function () {
  //server started
  console.log("\nService Started\nWelcome lilwont!\n\nDashboard is at:\nhttp://localhost:" + portNum + "/dashboard\n\nCtrl+C to exit.");
});