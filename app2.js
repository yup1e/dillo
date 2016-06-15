#!/bin/env node

// ------------ gcm
var gcm = require('node-gcm');

// create a message with default values
var message = new gcm.Message({
    collapseKey: 'demo',
    delayWhileIdle: true,
    timeToLive: 3
});
var sender = new gcm.Sender('AIzaSyCajUJOFxc4hd4fNv2Mf8xImE2e4Ywe-W4');
var registrationIds = [];

registrationIds.push('APA91bFtK3USBZFWha3nYTl3YqZPcbKhsf7351XcExWOGT6inHU2TPmDfOhfii-eOdFtMz6eDMkw4-OI1lj8rcqlBpOtceVX-SnkDCQ0e0QyYyFAzBpYZhb7r9oRJNDq9YGrJOrhR_sIJBaHvon37oxyhcLRJoYslQ');


//* -- khusus di local
var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);

server.listen(8080);


// routing -- alternative jika ingin mencoba di browser langsung
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/status.html');
});

// usernames which are currently connected to the chat
var usernames = {};

io.sockets.on('connection', function (socket) 
{
	
	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(roomname,username,dest_username){

		// store the username in the socket session for this client
		socket.username = username;
		
		// store the room name in the socket session for this client
		socket.room = roomname;
		
		// define new key array		
		if (!usernames.hasOwnProperty(roomname)) //console.log('go'); 
		usernames[roomname] = {};
		
		// add username to object
		if(!usernames[roomname].hasOwnProperty(username))
		usernames[roomname][username]=[username];
		
		// send client to room 1
		socket.join(roomname);

		// echo to client they've connected -- sementara ga perlu ada info apa2 spt bb
		//socket.emit('updatechat', 'SERVER', '1', '01-01-14', 'you have connected to '+roomname);
		
		// if disini jika kondisinya user yg di ajak chat tidak masuk room, harus di kirim ke push notification 
		if(!usernames[roomname].hasOwnProperty(dest_username))
		{
			// debug 
			//socket.emit('debuglog', 'username '+dest_username+' not in chat');
		}
		// echo to room 1 that a person has connected to their room -- tdk usah ada pemberitahuan ke user tujuan
		//socket.broadcast.to(roomname).emit('updatechat', 'SERVER', username + ' has connected to this room');
		
	});
	
	socket.on('getdebug', function(){
		socket.emit('debuglog', usernames);
	});
	
	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data,tgl,userid,destid) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.in(socket.room).emit('updatechat', socket.username,userid,destid,tgl, data);

		if(!usernames[socket.room].hasOwnProperty(destid))
		{
			// debug 
			//socket.emit('debuglog', 'username '+dest_username+' not in chat');

/*message.addData('title','My Game'); 
message.addData('message',data); 
message.addData('msgcnt','1');
sender.send(message, registrationIds, 4, function (err, result) {
    console.log(result);
});*/

		}

	});
	
	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		var temp = usernames[socket.room]; 
		delete temp[socket.username];
		
		if(Object.getOwnPropertyNames(temp).length === 0)
			delete usernames[socket.room];
		else 
			usernames[socket.room] = temp;
		
		// debug
		//socket.emit('debuglog', 'telah disconnect');
		
		// echo globally that this client has left
		//socket.broadcast.emit('updatechat', 'SERVER', '1', '02-02-14', socket.username + ' has disconnected');
		
		// close socket
		socket.leave(socket.room);
	});
});


