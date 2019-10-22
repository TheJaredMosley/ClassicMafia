$(function(){
    login();
    //var names = ['Jared', 'James', 'Adam', 'Mark', 'Anna', 'Blake', 'Daniel', "Emily", "Sharon", "Chris", "Harper", "Wade Porter", "William P.", "Bryan"]
    //console.log(names);

});

var timeLeft = 0;

var names =[]

function startClock(){
    if(timeLeft >= 0){
        timeLeft -= 1;
        $('#countdown').text(timeLeft);
        $('#progressBar').val(timeLeft);
        
    }
}

var socket = io();

var day = true;
var timer;
$('#NightPhase').hide();

socket.on('updateRoomNumber', number => {
    document.getElementById('code').innerText = "Room Code: " + number;
});

socket.on('updateRoom', clients => {
    waiting();
    names = clients;
    document.getElementById('listArea').innerHTML = "";
    document.getElementById('listArea').appendChild(makeUL(clients));
});

socket.on('transition', data => {
    console.log("Transition Message Recieved");

    clearInterval(timer);
    $('#countdown').text('5');
    $('#progressBar').val(5);

    if(day){
        $('#DayPhase').show();
        $('#NightPhase').hide();
    }else{
        $('#DayPhase').hide();
        $('#NightPhase').show();
    }

    day = !day;

    timeLeft = 5;

    timer = setInterval(function(){
        startClock();
        if(timeLeft < 0){
            clearInterval(timer);
        }
    }, 1000)
});

socket.on('deal', data => {
    gameOn();
});

function waiting(){
    $('#loginArea').hide();
    $('#roomCode').show();
    $('#startGame').show();
    $('#listArea').show();
}

function login(){
    $('#gameArea').hide();
    $('#roomCode').hide();
    $('#startGame').hide();
    $('#listArea').hide();
    $('#phaseIndicator').hide();
}

function gameOn(){
    $('#phaseIndicator').show();
    $('#gameArea').show();
    $('#roomCode').show();
    $('#listArea').hide();
    $('#startGame').hide();
    $('#loginArea').hide();

    for (i = 0; i < names.length; i++){
        var div = document.createElement('button');
        div.setAttribute('content', 'test content');
        div.setAttribute('class', "large button ui-btn ui-shadow ui-corner-all")
        div.innerHTML = names[i];

        $('#buttonGridID').append(div).trigger('create');
    }
}

function join(){
    console.log("TESTING");
    var data = {};
    data.room = document.getElementById('room').value;
    data.name = document.getElementById('name').value;
    socket.emit('roomJoin', data);
}

function makeUL(array) {
    // Create the list element:
    var list = document.createElement('ul');
    for(var i = 0; i < array.length; i++) {
        // Create the list item:
        var item = document.createElement('li');
        // Set its contents:
        item.appendChild(document.createTextNode(array[i]));
        // Add it to the list:
        list.appendChild(item);
    }
    // Finally, return the constructed list:
    return list;
}

function start(){
    socket.emit('start');
}