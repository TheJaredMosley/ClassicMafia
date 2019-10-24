$(function(){
    login();
    var modal = document.getElementById("myModal");

    // Get the <span> element that closes the modal
    var span = document.getElementById("closeModel");

    // When the user clicks on <span> (x), close the modal
    span.onclick = function() {
        modal.style.display = "none";
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    var infoButton = document.getElementById('infoButton').getElementsByTagName('button')[0];

    infoButton.onclick = showModal;

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
    console.log(data);
    var roleID = document.getElementById("roleID");
    
    if(data == 1){
        roleID.innerHTML = "You are in the Mafia!";
    }

    if(data == 2){
        roleID.innerHTML = "You are a Cop";
    }

    if(data == 3){
        roleID.innerHTML = "You are Doctor!";
    }

    if(data == 4){
        roleID.innerHTML = "You are Lousy Villager!";
    }

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
        var button = document.createElement('button');
        button.setAttribute('nameID', names[i]);
        button.setAttribute('class', "large button ui-btn ui-shadow ui-corner-all")
        button.innerHTML = names[i];
        button.setAttribute('onclick', "submitName(this.getAttribute('nameID'))")
        

        $('#buttonGridID').append(button).trigger('create');
    }
}

function submitName(name){
    socket.emit('submitName', name)
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

function showModal(){
    var modal = document.getElementById("myModal");
    modal.style.display = "block";
}