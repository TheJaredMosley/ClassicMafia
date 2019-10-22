var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('public'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/public/index.html');
});

http.listen(process.env.PORT || 80, function(){
console.log('listening on *:80');
});



io.on('connection', function(socket){
    console.log("A User Jonied");

    socket.on('roomJoin', data => {
        socket.join(data.room);
        socket.name = data.name;
        socket.lobbyRoom = data.room;
    
        var clients = io.sockets.adapter.rooms[data.room].sockets;
    
        var localUsers = [];
        for (var client in clients){
          var clientSocket = io.sockets.connected[client];
          localUsers.push(clientSocket.name);
        }
        io.to(data.room).emit('updateRoom', localUsers);
        io.to(data.room).emit('updateRoomNumber', data.room);
    });

    socket.on('start', () =>{
        //Mafia Start goes here
        //Need to take number of clients and pick a number of roles to give out.
        //Then Deal.
        var clients = io.sockets.adapter.rooms[socket.lobbyRoom].sockets;
        var num = Object.keys(clients).length - 1;
        var roles = ['Mafia', 'Villager', 'Doctor', 'Cop' ];
    
        for(var client in clients){
          io.to(client).emit('deal', roles[0]);
        }
        
      });

});

function transition(){
    io.emit('transition');
};

//setInterval(transition, 5100);