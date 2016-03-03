var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// app.use(favicon(path.join(__dirname,'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);



//********* SOCKET STUFF  **********//

// socket data from unity
var io = require('socket.io')({
	transports: ['websocket']
})

io.attach(4567);

// socket connections for dashboard
var dashboardio = io.of('/dashboard');


dashboardio.on('connection', function(socket){
	console.log("Dashboard viewer joined");
	// do this so that dashboard is not considered a viewer
	var id = socket.id
	viewerStats["/"+id.substr(10)]["admin"] = true;

	console.log(viewerStats["/"+id.substr(10)])
})

// SAVE VIEWER stats - eventually move to DB
var viewerStats = {}

// this makes the dashboard a viewer as well, so adjust for it in dashboard socket namespace
io.on('connection', function(socket){
	console.log("Viewer connected")
	viewerStats[socket.id] = {
		"heartCount":0,
		"duration":0,
		"active":true,
		"creator":null,
		"admin":false
	}

	console.log(viewerStats)

	//send updated stats to dashboard
	emitUserStats();

	console.log("TOTAL ACTIVE VIEWERS: " + totalActiveViewers());

	socket.on('disconnect', function(){
		console.log('viewer disconnected');
		viewerStats[socket.id]["active"] = false;
		console.log("TOTAL VIEWERS: " + totalViewers());
		console.log("TOTAL ACTIVE VIEWERS: "+ totalActiveViewers())
		emitUserStats();
	})

	socket.on('heartCount', function(data){
		//viewerStats[socket.id]["heartCount"] = data["heartCount"];
		viewerStats[socket.id]["heartCount"] += 1;
		console.log("USER HEART COUNT: " + userHeartCount(socket.id))
		console.log("TOTAL HEARTS: " + totalHeartCount())
		emitUserStats()
	})

})

function emitUserStats(){
	dashboardio.emit('stats', {'totalViewers':totalViewers(), 'activeViewers':totalActiveViewers(), 'totalHearts':totalHeartCount()})
}

// find total number of viewers who ever logged into this stream
function totalViewers(){
	// subtract one so dashboard is not considered viewer
	//return Object.keys(viewerStats).length-1;
	var totalViewers = 0;

	for(var i in viewerStats){
		if(!viewerStats[i]["admin"]){
			totalViewers+=1
		}
	}

	return totalViewers;
}

// total viewers who are currently watching stream
function totalActiveViewers(){
	var activeViewers = 0;

	for(var i in viewerStats){
		if(viewerStats[i]["active"] && !viewerStats[i]["admin"]){
			activeViewers+=1;
		}
	}
	return activeViewers;
}

// viewers who joined but left
function totalViewersWhoLeft(){
	var inactiveViewers = 0;

	for(var i in viewerStats){
		if(!viewerStats[i]["active"] && !viewerStats[i]["admin"]){
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