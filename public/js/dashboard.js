$(document).ready(function(){
	console.log("hello")

	var totalViewers = $("#totalViewers");
	var activeViewers = $("#activeViewers");
	var totalHearts = $("#totalHearts");

	var socket = io('http://localhost:4567/dashboard');

	socket.on('stats', function(msg){
		totalViewers.html(msg['totalViewers']);
		activeViewers.html(msg['activeViewers']);
		totalHearts.html(msg['totalHearts']);
	})
})