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

var killList = [];
var saved;
var copChecked;
var submittedCount;
var phase = 1;

var gameMap = new Map();



io.on('connection', function(socket){
  console.log('////////////////////////////////////////////////');
  console.log(gameMap);
  console.log('////////////////////////////////////////////////');
  console.log();

  socket.on('roomJoin', data => {
    socket.join(data.room);
    socket.name = data.name;
    socket.lobbyRoom = data.room;

    //Game Obj Map needs to not redo this after every roomJoin.
    //Needs to check if room exsists and then add too it.

    //On room join, check to see if this room exsists in the gameMap. If not then do what
    //I already did. If it does exsist, skip and just continue.
    if(!gameMap.has(data.room)){
      var gameObj = {}
      gameObj.killList = [];
      gameObj.saved = '';
      gameObj.copChecked = '';
      gameObj.submittedCount = 0;
      gameObj.phase = 1;
      gameObj.userMap = new Map();

      gameMap.set(data.room, gameObj);
    }
    

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
    var numMafia = 2; //Math.floor(num/4);
    var numPopo = 1;
    var numDoc = 1;

    for(var client in clients){
      console.log('/////////////////////');
      
      var tempName = io.sockets.connected[client].name;
      console.log(tempName);
      var infoObj = {};
      infoObj.name = tempName;
      infoObj.socket = io.sockets.connected[client];

      var choice = Math.ceil(Math.random() * 4);
      var roleDelt = false;
      

      if(choice == 1 && !roleDelt){
        if(numMafia > 0){
          console.log('deal1');
          roleDelt = true;
          io.to(client).emit('deal', choice);
          numMafia = numMafia - 1;
        }else{
          choice = 4;
          roleDelt = true;
          io.to(client).emit('deal', 4);
        }
      }

      if(choice == 2 && !roleDelt){
        if(numPopo > 0){
          numPopo = numPopo - 1;
          roleDelt = true;
          io.to(client).emit('deal', choice);
        }else{
          choice = 4;
          roleDelt = true;
          io.to(client).emit('deal', 4);
        }
      }

      if(choice == 3 && !roleDelt){
        if(numDoc > 0){
          numDoc = numDoc - 1;
          roleDelt = true;
          io.to(client).emit('deal', choice);
        }else{
          choice = 4;
          roleDelt = true;
          io.to(client).emit('deal', 4);
        }
      }

      if(choice == 4 && !roleDelt){

        //This is wrong, it can choose extra docs and cops because it is only checking
        //the total number of special roles left.
        if(numMafia + numPopo + numDoc > 0){
          choice = Math.ceil(Math.random() * 3);
          if(choice == 1){
            numMafia = numMafia - 1;
          }
          if(choice == 2){
            numPopo = numPopo - 1;
          }
          if(choice == 3){
            numDoc = numDoc - 1;
          }
        }
        roleDelt = true;
        io.to(client).emit('deal', choice);
      }

      infoObj.role = choice;
      infoObj.submitted = 0;
      gameMap.get(socket.lobbyRoom).userMap.set(tempName, infoObj);
    }
    
  });
  
  socket.on('submitName', (data) =>{
    var user = gameMap.get(socket.lobbyRoom).userMap.get(data);
    console.log(user.role);
    if(user.submitted == 0){

    }
    if(submittedCount >= gameMap.get(socket.lobbyRoom).userMap.length){
      if(phase == 1){
        io.emit('goToDay');
      }else{
        io.emit('goToNight');
      }
    }

  });
});

function transition(){
    io.emit('transition');
};

//setInterval(transition, 5100);