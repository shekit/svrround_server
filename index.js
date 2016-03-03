var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cors = require('cors')

var routes = require('./routes/index');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// app.use(favicon(path.join(__dirname,'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

//app.use(cors());

//app.use('/', routes);

app.get('/', function(req,res,next){
	res.render("index.jade")
})

//get individual user stats
app.post('/user', function(req, res, next){
	var id = req.body.id;
	var heartCount = userHeartCount(id);
	var direction = findAvgUserDirection(id);
	var active = viewerStats[id]["active"]
	var duration = null;
	if(active) {
		//return duration in seconds
		duration = parseInt((new Date - viewerStats[id]["joined"])/1000);
	} else {
		duration = parseInt((viewerStats[id]["left"]-viewerStats[id]["joined"])/1000);
	}
	res.render('user_details.jade',{
		"heartCount":heartCount,
		"direction":direction,
		"active":active,
		"duration": duration
	})
})

app.get('/user-list', function(req,res,next){
	//res.json({"userList": activeUserList()})
	res.render("user_list.jade",{"users":activeUserList()})
})

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

	emitUserStats();

	//console.log(viewerStats["/"+id.substr(10)])
})

// SAVE VIEWER stats - eventually move to DB
var viewerStats = {}

// this makes the dashboard a viewer as well, so adjust for it in dashboard socket namespace
io.on('connection', function(socket){
	console.log("Viewer connected")
	viewerStats[socket.id] = {
		"heartCount":0,
		"joined":new Date(),
		"left":null,
		"active":true,
		"creator":null,
		"admin":false,
		"direction":[{
			"x":0,
			"y":0,
			"z":1
		}]
	}

	//console.log(viewerStats)

	//send updated stats to dashboard
	emitUserStats();

	//emit user id to dashboard
	//dashboardio.emit("user",socket.id);

	console.log("TOTAL ACTIVE VIEWERS: " + totalActiveViewers());

	socket.on('disconnect', function(){
		console.log('viewer disconnected');
		viewerStats[socket.id]["active"] = false;
		viewerStats[socket.id]["left"] = new Date(); 
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
	});

	socket.on("direction", function(data){
		viewerStats[socket.id]["direction"].unshift({"x":data.x,"y":data.y,"z":data.z})
		console.log({"x":data.x,"y":data.y,"z":data.z})
		var avgActiveDirection = findAvgActiveDirection()
		
		dashboardio.emit('direction' , avgActiveDirection)

	})

})

function findAvgUserDirection(id){
	var x = 0;
	var y = 0;
	var z = 0;
	var array_length = viewerStats[id]["direction"].length;

	for(var i in viewerStats[id]["direction"]){
		x += parseFloat(viewerStats[id]["direction"][i]["x"])
		y += parseFloat(viewerStats[id]["direction"][i]["y"])
		z += parseFloat(viewerStats[id]["direction"][i]["z"])
	}

	var avg_x = x/array_length;
	var avg_y = y/array_length;
	var avg_z = z/array_length;

	console.log(avg_x, avg_y, avg_z)

	var avg_user_direction = findFinalDirection(avg_x,avg_y,avg_z);
	return avg_user_direction;
}

function findAvgActiveDirection(){
	var x = 0;
	var y = 0;
	var z = 0;
	var number_of_active_viewers = totalActiveViewers()

	for(var i in viewerStats){
		if(viewerStats[i]["active"] && !viewerStats[i]["admin"]){
			x += parseFloat(viewerStats[i]["direction"][0]["x"])
			y += parseFloat(viewerStats[i]["direction"][0]["y"])
			z += parseFloat(viewerStats[i]["direction"][0]["z"])
		}
	}

	var avg_x = x/number_of_active_viewers ;
	var avg_y = y/number_of_active_viewers ;
	var avg_z = z/number_of_active_viewers ;


	var avg_active_direction = findFinalDirection(avg_x,avg_y,avg_z);
	return avg_active_direction;
}

function findAvgTotalDirection(){
	var x = 0;
	var y = 0;
	var z = 0;
	var number_of_total_viewers = totalViewers()

	for(var i in viewerStats){
		if(!viewerStats[i]["admin"]){
			x += parseFloat(viewerStats[i]["direction"][0]["x"])
			y += parseFloat(viewerStats[i]["direction"][0]["y"])
			z += parseFloat(viewerStats[i]["direction"][0]["z"])
		}
	}

	var avg_x = x/number_of_total_viewers ;
	var avg_y = y/number_of_total_viewers ;
	var avg_z = z/number_of_total_viewers ;

	console.log(avg_x, avg_y, avg_z)

	var avg_total_direction = findFinalDirection(avg_x,avg_y,avg_z);
	return avg_total_direction;
}

function findFinalDirection(x,y,z){
	var x_dir = ""
	var y_dir = ""
	var z_dir = ""
	var final_direction = ""

	// find direction based on parsing values
	if(x > 0 && x <= 1){
		x_dir = "Right"
	} else if(x < 0 && x >= -1){
		x_dir = "Left"
	} else {
		x_dir = ""
	}

	if(y > 0 && y <= 1){
		y_dir = "Up"
	} else if(y < 0 && y >= -1){
		y_dir = "Down"
	} else {
		y_dir = ""
	}

	if(z > 0 && z <= 1){
		z_dir = "Front"
	} else if(z < 0 && z >= -1){
		z_dir = "Back"
	} else {
		z_dir = ""
	}

	final_direction = z_dir + " " + y_dir + " " + x_dir;
	return final_direction;
}

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

function activeUserList(){
	var users = [];
	for(var i in viewerStats){
		if(!viewerStats[i]["admin"]){
			users.push(i)
		}
	}
	return users
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