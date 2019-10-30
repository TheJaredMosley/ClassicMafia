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

var gameMap = new Map();



io.on('connection', function(socket){

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
      gameObj.mafiaVote = [];
      gameObj.savedPerson = '';
      gameObj.numAliveMafia = 0;
      gameObj.copCheck = '';
      gameObj.accused = '';
      gameObj.yesVotes = 0;
      gameObj.noVotes = 0;
      gameObj.alivePlayerCount = 0;
      gameObj.votingRecord = [];
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
    var num = Object.keys(clients).length;
    var numMafia = Math.floor(num/4);
    var numPopo = 1;
    var numDoc = 1;

    var roles = [];

    for(i = 0; i < numMafia; i++){
      roles.push(1);
    }
    for(i = 0; i < numPopo; i++){
      roles.push(2);
    }
    for(i = 0; i < numDoc; i++){
      roles.push(3);
    }
    for(i = 0; i < num - (numMafia+numPopo+numDoc); i++){
      roles.push(4);
    }

    gameMap.get(socket.lobbyRoom).alivePlayerCount = roles.length;
    gameMap.get(socket.lobbyRoom).numAliveMafia = numMafia;

    

    for(var client in clients){
      
      var tempName = io.sockets.connected[client].name;
      var infoObj = {};
      infoObj.name = tempName;
      infoObj.socket = io.sockets.connected[client];

      choice = Math.ceil(Math.random() * roles.length - 1);
      io.to(client).emit('deal', roles[choice]);
      infoObj.role = roles[choice];
      roles.splice(choice, 1);
    
      infoObj.submitted = 0;
      gameMap.get(socket.lobbyRoom).userMap.set(tempName, infoObj);
    }
    
  });
  

  //Need to work on the Day phase now. Voting and stuff.
  //Also need to make sure the person the mafia killed is removed from the user count?
  //Maybe even delete the user button, and give a death screen.
  socket.on('submitName', (data) =>{
    var game = gameMap.get(socket.lobbyRoom);
    var user = gameMap.get(socket.lobbyRoom).userMap.get(data);
    var sender = gameMap.get(socket.lobbyRoom).userMap.get(socket.name);

    if(game.phase == 1){
      if(sender.submitted == 0){
        //Check for the roll of user
        switch(sender.role){
          case 1:
            game.mafiaVote.push(user.name);
            sender.submitted = 1;
            game.submittedCount++;
            socket.emit('submitRecieved');
            break;
          case 2:
            game.copCheck = user.name;
            sender.submitted = 1;
            game.submittedCount++;
            socket.emit('submitRecieved');
            break;
          case 3:
            game.savedPerson = user.name;
            sender.submitted = 1;
            game.submittedCount++;
            socket.emit('submitRecieved');
            break;
          case 4:
            if(socket.name === user.name){
              game.submittedCount++;
              socket.emit('submitRecieved');
              sender.submitted = 1;
            }
            else{
              socket.emit('villagerError');
            }
            break;
        }
      }

      if(game.submittedCount >= game.alivePlayerCount){
        var clients = io.sockets.adapter.rooms[socket.lobbyRoom].sockets;
        var message = "";
        game.submittedCount = 0;

        var killed = game.mafiaVote[Math.floor(Math.random() * game.mafiaVote.length)];

        if(game.savedPerson != killed){
          message = killed + " was killed in the night!";
          io.to(socket.lobbyRoom).emit('killPlayer', killed);
          game.alivePlayerCount--;
          if(game.userMap.get(killed).role == 1){
            game.numAliveMafia--;
          }
          killPlayer(socket, killed);
        }else{
          message = killed + " was attacked but the doctor interviend!";
        }

        for(var client in clients){
          var clientSocket = io.sockets.connected[client];
          var user = gameMap.get(socket.lobbyRoom).userMap.get(clientSocket.name);
          user.submitted = 0;

          switch(user.role){
            case 1:
            case 3:
            case 4:
              io.to(client).emit('goToDay', message);
              break;
            case 2:
              var data;
              if(game.copCheck != "" && game.userMap.get(game.copCheck).role == 1){
                data = "You discovered " + game.copCheck + " IS in the Mafia!"
              }else{
                data = "You found out " + game.copCheck + " is NOT in the Mafia."
              }
              io.to(client).emit('goToDay', [message, data]);
              break;
          }
        }
        game.phase = 2;
        game.mafiaVote.length = 0;
        game.savedPerson = "";
        game.copCheck = "";

      }

    }else{
      if(user.name === game.accused){
        io.to(socket.lobbyRoom).emit('goToVote', user.name);
      }else{
        game.accused = user.name;
        io.to(socket.lobbyRoom).emit('accused', game.accused);
      }
    }

  });

  socket.on('voting', data => {
    var game = gameMap.get(socket.lobbyRoom);
    var user = gameMap.get(socket.lobbyRoom).userMap.get(socket.name);

    //Take away the alerts and change it with something else


    game.submittedCount++;

    if (data == 1){
      game.yesVotes++;
      game.votingRecord.push([user.name, 1]);
    }else{
      game.noVotes++;
      game.votingRecord.push([user.name, 0]);
    }

    if(game.submittedCount >= game.alivePlayerCount){
      game.submittedCount = 0;

      if(game.yesVotes > game.noVotes){
        io.to(socket.lobbyRoom).emit('goToNight', [game.accused, game.votingRecord]);
        io.to(socket.lobbyRoom).emit('killPlayer', game.accused);
        game.alivePlayerCount--;
        if(game.userMap.get(game.accused).role == 1){
          game.numAliveMafia--;
        }
        killPlayer(socket, game.accused);
        game.phase = 1;
      }else{
        io.to(socket.lobbyRoom).emit('voteUnsuccesful', game.votingRecord);
      }
      game.yesVotes = 0;
      game.noVotes = 0;
      
    }

  });
});

function killPlayer(socket, name){
  var clients = io.sockets.adapter.rooms[socket.lobbyRoom].sockets;
  for(var client in clients){
    var tempName = io.sockets.connected[client].name;
    if(tempName == name){
      io.to(client).emit('yourDead');
    }
  }
  checkWinCondition(socket, gameMap.get(socket.lobbyRoom));
}

function checkWinCondition(socket, game){
  console.log("Total Players: " + game.alivePlayerCount);
  console.log("Mafia: " + game.numAliveMafia);
  if(game.numAliveMafia >= (game.alivePlayerCount - game.numAliveMafia)){
    io.to(socket.lobbyRoom).emit('win', "The Mafia has won!");
  }

  if(game.numAliveMafia <= 0){
    io.to(socket.lobbyRoom).emit('win', "The villagers have won!");
  }
}