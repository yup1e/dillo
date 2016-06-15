#!/bin/env node

// ------------ server gcm
var gcm = require('node-gcm');

// create a message with default values
var message = new gcm.Message({
    collapseKey: 'demo',
    delayWhileIdle: true,
    timeToLive: 3
});
var sender = new gcm.Sender('AIzaSyCajUJOFxc4hd4fNv2Mf8xImE2e4Ywe-W4');
var registrationIds = [];

registrationIds.push('APA91bFUHsZOTT2Qb5db6gsiabCZxd6aWo9lxXaPYJPinzBfzNk71Psu5vv4CouEuV7jYtoQgRixoCzgzhlbqQT9HbhocM249-W3zxWniTNZaJAg5O-c8p9aIUyxrjiArL2ucKdmcs6V_5neMO9rZoGhOuMzogQ__w');


// ------------ server nodejs
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
var onlineClients = {};

var fixRoom = 'room_';
var roomname = '';
var theRoom =new Array();

io.sockets.on('connection', function (socket) 
{
	socket.on('createroom',function (id_user_from,id_user_dest) {
		roomname = fixRoom+id_user_from;
		
		// connect ke room sendiri
		socket.join(roomname);
		socket.emit('debuglog', 'join to '+roomname);
		
		// daftarkan room sendiri yg telah di buat ke variable global
		if(!theRoom.hasOwnProperty(roomname)){
			theRoom[roomname]=roomname;
		}
		
		// definisikan room sendiri
		socket.roomfrom = roomname;
		
		// definisikan room tujuan, belum tau ada atau tidaknya
		socket.roomdest = fixRoom+id_user_dest;
	});

	/*socket.on('getdebug', function(){
		socket.emit('debuglog', usernames);
	});*/
	
	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data,tgl,userid,destid,from_user_name) {
		if(!theRoom.hasOwnProperty(socket.roomdest)){
			// debug 
			socket.emit('debuglog', 'room '+socket.roomdest+' not available');
			
			// --- if user not online, send chat to GCM
			/*message.addData('title',' KIT Private Msg'); 
			message.addData('message',data); 
			message.addData('msgcnt','1');
			sender.send(message, registrationIds, 4, function (err, result) {});*/

		}else {
			io.sockets.in(socket.roomdest).emit('updatechat', from_user_name,userid,destid,tgl, data);
			socket.emit('debuglog', 'room '+socket.roomdest+' available but not in page');
		}
	});

	socket.on('leftroom', function(){
		if(theRoom.hasOwnProperty(roomname)){
			delete theRoom[socket.roomfrom];
		}
		io.sockets.in(socket.roomdest).emit('updatechat', 'system','1','4','2015/01/01 01:01:01', 'disconnect '+roomname);
		//socket.leave(roomname);
		//socket.disconnect();
	});

	socket.on('setroom', function(idUser){
		roomname = fixRoom+idUser;

		if(!theRoom.hasOwnProperty(roomname)){
			theRoom[socket.roomfrom] = roomname;
		}
		socket.emit('debuglog', 'Set to '+roomname);
		//io.sockets.in(socket.roomdest).emit('updatechat', 'system','1','4','2015/01/01 01:01:01', 'set room '+roomname);
		socket.join(roomname);
		socket.emit('debuglog', 'join to '+roomname);
	});
	
	socket.on('forceDisconnect', function(){
    	socket.disconnect();
	});
	
	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the room
		if(theRoom.hasOwnProperty(roomname)){
			delete theRoom[socket.roomfrom];
		}

		io.sockets.in(socket.roomdest).emit('updatechat', 'system','1','4','2015/01/01 01:01:01', 'disconnect '+roomname);
		
		// close socket
		socket.leave(socket.roomfrom);
	});
});


