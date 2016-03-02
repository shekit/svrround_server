var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(path.join(__dirname,'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(cookieParser);
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

app.get('/', function(req, res){
	res.send("hello world");
})



//********* SOCKET STUFF  **********//
var io = require('socket.io')({
	transports: ['websocket']
})

// SAVE VIEWER stats - eventually move to DB
var viewerStats = {}

io.attach(4567);

io.on('connection', function(socket){
	console.log("Viewer connected")

	viewerStats[socket.id] = {
		"heartCount":0,
		"duration":0,
		"active":true
	}

	console.log("TOTAL ACTIVE VIEWERS: " + totalActiveViewers());

	socket.on('disconnect', function(){
		console.log('viewer disconnected');
		viewerStats[socket.id]["active"] = false;
		console.log("TOTAL VIEWERS: " + totalViewers());
		console.log("TOTAL ACTIVE VIEWERS: "+ totalActiveViewers())
	})

	socket.on('heartCount', function(data){
		viewerStats[socket.id]["heartCount"] = data["heartCount"];
		console.log("USER HEART COUNT: " + userHeartCount(socket.id))
		console.log("TOTAL HEARTS: " + totalHeartCount())
	})

	socket.on
})

// find total number of viewers who ever logged into this stream
function totalViewers(){
	return Object.keys(viewerStats).length;
}

// total viewers who are currently watching stream
function totalActiveViewers(){
	var activeViewers = 0;

	for(var i in viewerStats){
		if(viewerStats[i]["active"]){
			activeViewers+=1;
		}
	}
	return activeViewers;
}

// viewers who joined but left
function totalViewersWhoLeft(){
	var inactiveViewers = 0;

	for(var i in viewerStats){
		if(!viewerStats[i]["active"]){
			inactiveViewers+=1;
		}
	}
	return inactiveViewers;
}

// find heart count of individual viewer
function userHeartCount(id){
	return viewerStats[id]["heartCount"];
}

// find total hearts across all viewers
function totalHeartCount(){
	var totalHearts = 0
	for(var i in viewerStats){
		totalHearts += parseInt(viewerStats[i]["heartCount"]);
	}
	return totalHearts;
}

app.listen(3000, function(){
	console.log("listening");
})