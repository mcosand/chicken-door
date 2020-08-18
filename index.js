var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var rpio = require('rpio');
var http = require('http');

var router = express.Router();

var app = express();

var MOTOR = 23;
var DIRECTION = 24;
var OPEN = rpio.LOW;
var CLOSE = rpio.HIGH;

var isClosed = false;
var isOpen = false;
var moving = false;

const armed = true

rpio.init({mapping: 'gpio'});
rpio.open(MOTOR, rpio.OUTPUT, rpio.LOW);
rpio.open(DIRECTION, rpio.OUTPUT, rpio.LOW);

function delay(t, v) {
  return new Promise(function(resolve) {
    setTimeout(resolve.bind(null, v), t);
  })
}

var currentId = null;

function stopMotor(id) {
  if (id && (id !== currentId)) throw 'CANCELLED' 
  console.log(id + ' MOTOR OFF')
  armed && rpio.write(MOTOR, rpio.LOW)
  return delay(500).then(function() {
    console.log(id + ' DIRECTION OFF')
    armed && rpio.write(DIRECTION, rpio.LOW)
    currentId = null;
  })
}

function moveDoor(newState) {
  if (currentId !== null) throw 'CANCELLED';
  
  const id = new Date().getTime();
  currentId = id;

  console.log(id + ' DIRECTION ' + newState)
  armed && rpio.write(DIRECTION, newState);
  return delay(1000).then(function(){
    console.log(id + ' MOTOR ON')
    armed && rpio.write(MOTOR, rpio.HIGH);
    
    if (newState === CLOSE) isOpen = false
    else isClosed = false
    
    return delay(10000);
  })
  .then(stopMotor.bind(null, id))
  .then(function() {
    if (newState === CLOSE) isClosed = true
    else isOpen = true
  })
  .catch(function(err) {
    console.log(err)
  })
}

function getState() {
  var val = { canOpen: !isOpen && !currentId, canClose: !isClosed && !currentId, moving: !!currentId }
console.log(val)
  return val
}


moveDoor(CLOSE).then(function() { moveDoor(OPEN) })


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

router.get('/', function(req, res, next) {
	res.render('index', { title: 'Chicken Coop', state: getState() });
});

app.use('/', router);
app.use('/getstate', function(req, res) {
  res.json(getState())
})

app.post('/open', function(req, res) {
  moveDoor(OPEN)
  res.json(getState())
})
app.post('/close', function(req, res) {
  moveDoor(CLOSE)
  res.json(getState())
})
app.post('/stop', function(req, res) {
  stopMotor()
  res.json(getState())
})

app.post('/action', function(req, res) {
  console.log(req.body)
  if (req.body.hasOwnProperty('action')) {
    switch (req.body.action) {
      case 'write':
        break;
    }
  }
});

app.use(function(req, res, next) {
	var err = new Error('not found');
	err.status = 404;
	next(err);
});

app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: err
	});
});

var server = http.createServer(app);
server.listen(8000);
console.log('Started');

