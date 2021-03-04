var socket = io()

//sign in
var signDiv = document.getElementById('signInDiv')
var signDivUsername = document.getElementById('signInDiv-username')
var signDivSignIn = document.getElementById('signInDiv-signIn')
var signDivSignUp = document.getElementById('signInDiv-signUp')
var signDivPassword = document.getElementById('signInDiv-password')
var gameDiv = document.getElementById('gameDiv')
var error = document.getElementById('err')

//event listener for sign in
signDivSignIn.onclick = function(){
    socket.emit('signIn',{username:signDivUsername.value, password:signDivPassword.value})
}

signDivSignUp.onclick = function(){
    socket.emit('signUp', {username:signDivUsername.value, password:signDivPassword.value})
}

socket.on('signInResponse', function(data){
    if(data.success)
    {
        signInDiv.style.display = "none"
        gameDiv.style.display = "inline-block"
    }else{
        error.innerHTML = "Sign in error, please fuck off"

    }
    
})

socket.on('signUpResponse', function(data){
    if(data.success)
    {
        error.innerHTML = "Sign up successful, login"
    }else{
        error.innerHTML = "Sign up successful"

    }
    
})

//game code
var canvas = document.getElementById('canvas')
var ctx = canvas.getContext('2d')
var chatText = document.getElementById('chat-text')
var chatInput = document.getElementById('chat-input')
var chatForm = document.getElementById('chat-form')
ctx.font = '30px Arial'
var px = 0
var py = 0
var clientId
//game vars
var timer = requestAnimationFrame(main);
var gravity = 1;
var asteroids = new Array();
var numAsteroids = 10;
var gameOver = true;
var score = 0;
var gameStates = [];
var currentState = 0;
var ship;
var highScore = 0;
var bgMain = new Image();
var cookieSprite = new Image();
var highScoreElements = document.querySelector('.highscore');

bgMain.src = "images/rocks.jpg";
cookieSprite.src = "images/cookie.png";

//drawing asteroids
function Asteroids(){
    this.radius = randomRange(15,2);
    this.x = randomRange(0 + this.radius, canvas.width - this.radius); 
    this.y = randomRange(0 + this.radius, canvas.height - this.radius)- c.height;
    this.vx = randomRange(-5,-10);
    this.vy = randomRange(10,5);
    this.color = "white";

    this.draw = function(){
        ctx.save();
        //draws original circles for asteroids
        /*ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x,this.y, this.radius, 0, 2*Math.PI,true);
        ctx.closePath();
        ctx.fill();*/
        ctx.drawImage(cookieSprite,this.x - this.radius,this.y-this.radius,this.radius*2, this.radius*2)
        ctx.restore();

    }
}

//class for player ship
function PlayerShip(){
    this.x = canvas.width/2;
    this.y = canvas.height/2;
    this.w = 20;
    this.h = 20;
    this.vx = 0;
    this.vy = 0;
    this.up = false;
    this.left = false;
    this.right = false;
    this.flamelength = 30;

    this.draw = function(){
        ctx.save();
        ctx.translate(this.x,this.y);

        // draws afterburner flame
        if(this.up == true ||  this.left == true || this.right == true){
            ctx.save();
            //animate flame
            if(this.flamelength == 30){
                this.flamelength = 10;
            }
            else{
                this.flamelength = 30;
            }
            ctx.beginPath();
            ctx.fillStyle = "orange";
            ctx.moveTo(0, this.flamelength);
            ctx.lineTo(5, 5);
            ctx.lineTo(-5, 5);
            ctx.lineTo(0, this.flamelength);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
        ctx.beginPath();
        ctx.fillStyle = "red";
        ctx.moveTo(0, -10);
        ctx.lineTo(10, 10);
        ctx.lineTo(-10, 10);
        ctx.lineTo(0, -10);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    this.move = function(){
        this.x += this.vx;
        this.y += this.vy;

        if(this.y > canvas.height - 10){
            this.y = canvas.height - 10;
            this.vy = 0;
        }
        //right boundary of screen
        if(this.x > canvas.width - 10 ){
            this.x = canvas.width - 10;
            this.vx = 0;
        }
        //left boundary of screen
        if(this.x < 0 + 10 ){
            this.x = 0 + 10;
            this.vx = 0;
        }

        //top boundary of screen
        if(this.y < 0 + 10){
            this.y = 0 + 10;
            this.vy = 0;
        }
    }

}

//game start function
function gameStart() {
    //for loop to create all instances of asteroids
    for (var i = 0; i < numAsteroids; i++) {
        asteroids[i] = new Asteroids();
    }
    //this creates an instance of the ship
    ship = new PlayerShip();
}

//gameStates:
gameStates[1] = function(){
    //Draws score to the HUD
    ctx.save();
    ctx.font = "15px Arial";
    ctx.fillStyle = 'white';
    ctx.fillText("Score: " + score.toString(), canvas.width - 150, 30);
    ctx.restore();
    

    //ship.vy += gravity;

    //Key presses move the ship
    if(ship.up == true){
        ship.vy = -10;
    }
    else{
        ship.vy = 3;
    }

    if(ship.left == true){
        ship.vx = -3;
    }
    else if(ship.right == true){
        ship.vx = 3;
    }
    else{
        ship.vx = 0;
    }
    // loops through asteroid instances in array and draws them to the screen
    for(var i = 0; i<asteroids.length; i++){
        var dX = ship.x - asteroids[i].x;
        var dY = ship.y - asteroids[i].y;
        var dist = Math.sqrt((dX*dX)+(dY*dY));

        //checks for collision between asteroid and ship
        if(detectCollision(dist, (ship.h/2 + asteroids[i].radius))){
           // console.log("Colliding with asteroid " + i);
            
            currentState = 2;
            gameOver = true;
            //document.removeEventListener("keydown", keyPressDown);
            //document.removeEventListener("keyup", keyPressUp);
        }

        //recycles asteroids
        if(asteroids[i].y > c.height + asteroids[i].radius){
            asteroids[i].y = randomRange(c.height -asteroids[i].radius,asteroids[i].radius)-c.height;
            asteroids[i].x = randomRange(c.width + asteroids[i].radius,asteroids[i].radius);
        }

        if(gameOver == false){
            asteroids[i].y += asteroids[i].vy;
        }

        asteroids[i].draw();
    }
    
    ship.draw();
    if(gameOver == false){
        ship.move();
    }

    while(asteroids.length < numAsteroids){
        asteroids.push(new Asteroids());
    }
}

gameStates[2] = function(){
    highScoreElements.style.display = "block";
    if(score > highScore){
        highScore = score;
        ctx.save();
        ctx.font = "30px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center"
        ctx.fillText("Game Over, Your score was: " + score.toString(), canvas.width/2, canvas.height/2 - 60);
        ctx.fillText("Your New High Score is: " + highScore.toString() , canvas.width/2, canvas.height/2 - 30);
        ctx.fillText("New Record!!", canvas.width/2, canvas.height/2 );
        ctx.font = "15px Arial";
        ctx.fillText("Press Enter to Start", canvas.width/2, canvas.height/2 + 20);
        ctx.restore();

    }
    else{
        ctx.save();
        ctx.font = "30px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center"
        ctx.fillText("Game Over, Your score was: " + score.toString(), canvas.width/2, canvas.height/2 - 60);
        ctx.fillText("Your high Score is: " + highScore.toString(), canvas.width/2, canvas.height/2 - 30);
        ctx.font = "15px Arial";
        ctx.fillText("Press Enter to Start", canvas.width/2, c.height/2 + 20);
        ctx.restore();
    }

    
}

//---Main Game Loop---
function main() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
   
    if (gameOver == false) {
        timer = requestAnimationFrame(main);
    }
    gameStates[currentState]();
}


//---Collision Detection Function---
function detectCollision(distance, calcDistance){
    return distance < calcDistance;
}


//--Score Timer Function---
function scoreTimer(){
    if(gameOver == false){
        score++;
        //using modulus divide the score by 5 and inf the remainder is zero addastteroids
        if(score % 5 == 0){
            numAsteroids += 5;
            console.log(numAsteroids);
        }
       // console.log(score);
        setTimeout(scoreTimer, 1000);
    }
}

socket.on('connected', function(data){
    clientId = data
    
})

//event listeners 
document.addEventListener('keydown', keyPressDown)
document.addEventListener('keyup', keyPressUp)
document.addEventListener('mousedown', mouseDown)
document.addEventListener('mouseup', mouseUp)
document.addEventListener('mousemove', mouseMove)

function keyPressDown(e){
    if(e.keyCode === 87)//up
        socket.emit('keypress', {inputId:'up', 
    state:true})
    else if(e.keyCode === 83)//down
        socket.emit('keypress', {inputId:'down', 
    state:true})
    else if(e.keyCode === 65)//left
        socket.emit('keypress', {inputId:'left', 
    state:true})
    else if(e.keyCode === 68)//right
        socket.emit('keypress', {inputId:'right', 
    state:true})
}

function keyPressUp(e){
    if(e.keyCode === 87)//up
        socket.emit('keypress', {inputId:'up', 
    state:false})
    else if(e.keyCode === 83)//down
        socket.emit('keypress', {inputId:'down', 
    state:false})
    else if(e.keyCode === 65)//left
        socket.emit('keypress', {inputId:'left', 
    state:false})
    else if(e.keyCode === 68)//right
        socket.emit('keypress', {inputId:'right', 
    state:false})
}

function mouseDown(e){
    socket.emit('keypress', {inputId:'attack', 
    state:true})
}
function mouseUp(e){
    socket.emit('keypress', {inputId:'attack', 
    state:false})
}
function mouseMove(e){
    var x = -px + e.clientX - 8
    var y = -py + e.clientY - 96
    var angle = Math.atan2(y,x)/Math.PI*180
    socket.emit('keypress', {inputId:'mouseAngle', 
    state:angle})
}

socket.on('newPositions', function(data){
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for(var i = 0; i < data.player.length; i++){
        if(clientId == data.player[i].id)
        {
            px = data.player[i].x
            py = data.player[i].y
        }
        ctx.fillText(data.player[i].number, data.player[i].x, data.player[i].y)
    }
    
})

socket.on('addToChat', function(data){
    chatText.innerHTML += `<div>${data}</div>`
})

socket.on('evalResponse', function(data){
    chatText.innerHTML += `<div>${data}</div>`
    console.log(data)
})

chatForm.onsubmit = function(e){
    e.preventDefault()

    if(chatInput.value[0] === '/'){
        socket.emit('evalServer', chatInput.value.slice(1))

        
    }else{
        socket.emit('sendMessageToServer', chatInput.value)
    }
    
    //clear out the input
    chatInput.value = ""
}
