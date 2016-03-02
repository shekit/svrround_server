$(document).ready(function(){
	console.log("hello")

	var totalViewers = $("#totalViewers");
	var activeViewers = $("#activeViewers");
	var totalHearts = $("#totalHearts");

	var io = io('http://localhost:3000/dashboard');

	io.on('stats', function(msg){
		totalViewers.html(msg['totalViewers']);
		activeViewers.html(msg['activeViewers']);
		totalHearts.html(msg['totalHearts']);
	})
})