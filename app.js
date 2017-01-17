var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var http = require("http").createServer(app);
var io = require("socket.io")(http);
var port = process.env.PORT || 3000;
http.listen(port);

var fs = require('fs');
var path = require('path');
var dataFile = path.join(__dirname + '/assets/data.json');
var cacheFile = path.join(__dirname + '/assets/cache.json');
var connectedSockets = [];

app.use(bodyParser.json());

// app.use(express.static(__dirname + '/'));
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/views/dashboard.html'));
});
app.get('/view/:item', function(req, res) {
    res.sendFile(path.join(__dirname + '/views/' + req.params.item + '.html'));
});
app.get('*/css/:file', function(req, res) {
    res.sendFile(path.join(__dirname + '/assets/css/' + req.params.file));
});
app.get('*/js/:file', function(req, res) {
    res.sendFile(path.join(__dirname + '/assets/js/' + req.params.file));
});
app.get('/dashboard', function(req, res) {
    res.sendFile(path.join(__dirname + '/views/dashboard.html'));
});
app.get('/assets/:asset', function(req, res) {
    res.sendFile(path.join(__dirname + '/assets/' + req.params.asset));
});
app.post('/endpoint', function(req, res) {
    var file = require(dataFile);
    file.lilwont.buy = req.body.dayIn;
    file.lilwont.cash = req.body.dayOut;
    file.lilwont.bank = req.body.bnkNow;
    file.lilwont.goal = req.body.bnkGoal;
    fs.writeFile(dataFile, JSON.stringify(file, null, 2), function(err) {
        if (err)
            return console.log(err);
    });
    res.send(req.body);
    // res.send('yeah');
});
// app.get('/socket.io/:file', function(req, res) {
//     console.log('Load: ' + req.params.file);
//     res.sendFile(path.join(__dirname + '/node_modules/socket.io-client/dist/' + req.params.file));
// });

// var io = require('socket.io').listen(app);

io.sockets.on('connection', function(socket) {
    connectedSockets.push(socket);
});

// Start watching our cache file
fs.watch(dataFile, function(event, filename) {
    if (event == 'change') {
        fs.readFile(dataFile, function(err, data) {
            if (err)
                throw err;
            connectedSockets.forEach(function(socket) {
                socket.emit('data', JSON.parse(data));
            });
        });
    }
});

app.listen(port, function() {
    //server started
    console.log("\nService Started\nWelcome lilwont!\n\nDashboard is at:\nhttp://localhost:8080/dashboard\n\nCtrl+C to exit.");
});
