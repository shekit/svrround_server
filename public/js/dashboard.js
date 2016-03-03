$(document).ready(function(){
	console.log("hello")

	var socket_url = "http://localhost:4567"
	var route_url = "http://localhost:3000"

	var totalViewers = $("#totalViewers");
	var activeViewers = $("#activeViewers");
	var totalHearts = $("#totalHearts");
	var direction = $("#direction");
	var userList = $("#userList");
	
	var userStats = $("#userStats");
	var userHeartCount = $(".userHeartCount");
	var userDirection = $(".userDirection");
	var userActive = $(".userActive");

	var socket = io(socket_url+'/dashboard');

	socket.on('stats', function(msg){
		totalViewers.html(msg['totalViewers']);
		activeViewers.html(msg['activeViewers']);
		totalHearts.html(msg['totalHearts']);
	})

	socket.on('direction', function(msg){
		direction.html(msg);
	})

	socket.on('user', function(msg){
		console.log("new user");
		var html = "<li><a href='#' class='user' data-val=" + msg + ">User</a></li>"
		userList.append(html)
	})

	$("body").on('click', '.user', function(event){
		event.preventDefault();
		console.log("hello")

		$.ajax({
			method: "POST",
			url: route_url + '/user/',
			data: {"id": $(event.target).attr('data-val')}
		})
		.done(function(response){
			userStats.show();
			userHeartCount.html(response.heartCount);
			userDirection.html(response.direction);
			userActive.html(response.active)
		})
		.fail(function(response){
			console.log(response);
		})
	})
})