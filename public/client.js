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
var isdead = false;

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
var role = 0;
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
    role = data;
    
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

socket.on('submitRecieved', () =>{
    console.log('Thanks for the submission');
    $('#gameArea').hide();
    $('#waitingScreen').show();
});

socket.on('villagerError', () => {
    console.log('village Error');
    alert('If you are a villager you must pick your own name');
});

socket.on('voteUnsuccesful', data => {
    if(!isdead){
        $('#gameArea').show();
        $('#voting').hide();
        $('#waitingScreen').hide();
        changeButtonColor(data);
    }
    
})

socket.on('killPlayer', data =>{
    var buttons = document.getElementById('buttonGridID').getElementsByTagName('button');

    console.log('KILLT ' + data);
    for(var i = 0; i < buttons.length; i++){
        if(data == buttons[i].getAttribute('nameID')){
            buttons[i].disabled = true;
            buttons[i].style.background = "#A9A9A9";
        }
    }
});

socket.on('yourDead', () =>{
    console.log('your dead');
    isdead = true;
    login();
    $('#deathScreen').show();
});


//Some weird stuff is happening with this. For some reason the alert is being called twice...
//And then the server seems to be crashing? I dunno. Real weird.
socket.on('goToDay', data =>{
    if(!isdead){
        $('phaseIndicator').innerHTML = "Day Phase";
        console.log('Day Phase');
        if(role === 2){
            alert(data[0]);
            alert(data[1]);
        }else{
            alert(data);
        }
        $('#gameArea').show();
        $('#waitingScreen').hide();
    }
    

});

socket.on('goToVote', data =>{
    if(!isdead){
        $('#accusedID').html("");
        $('#votingText').html("Do you think " + data + " is in the Mafia?");
        $('#voting').show();
        $('#gameArea').hide();
        $('#waitingScreen').hide();
    }
});

socket.on('goToNight', data =>{
    if(!isdead){
        alert(data[0] + " has been executed by the town. The night begins anew");
        $('#phaseIndicator').html("Night Phase");
        $('#voting').hide();
        $('#accusedID').html("");
        $('#accusedID').hide();
        $('#gameArea').show();
        $('#waitingScreen').hide();
        changeButtonColor(data[1]);
        console.log('Night Phase');
    }
    
});

socket.on('accused', data => {
    if(!isdead){
        $('#waitingScreen').hide();
        $('#accusedID').show();
        $('#accusedID').html("Accused: " + data);
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
    $('#deathScreen').hide();
    $('#waitingScreen').hide();
    $('#roomCode').hide();
    $('#startGame').hide();
    $('#listArea').hide();
    $('#phaseIndicator').hide();
    $('#voting').hide();
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
    var namdiv = document.getElementById('nametag');
    namdiv.innerHTML = data.name;
}

function vote(choice){
    console.log('voting');
    if(choice){
        socket.emit('voting', 1);
    }else{
        socket.emit('voting', 0);
    }
    $('#voting').hide();
    $('#waitingScreen').show();
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

function changeButtonColor(dataList){
    var buttons = document.getElementById('buttonGridID').getElementsByTagName('button');

    console.log('Hitit');
    for(var i = 0; i < buttons.length; i++){
        for(var j = 0; j < dataList.length; j++){
            if(dataList[j][0] == buttons[i].getAttribute('nameID')){
                console.log(dataList[j][1]);
                if(dataList[j][1] == 1){
                    buttons[i].style.background = "#8dffba";
                }else{
                    buttons[i].style.background = "#ff9382";
                }
            }
        }
    }
}