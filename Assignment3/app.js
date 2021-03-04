
const { setFlagsFromString } = require('v8')

var express = require('express')
//const { Mongoose } = require('mongoose')
var app = express()
var mongoose = require('mongoose')
const {RSA_NO_PADDING} = require('constants')
var serv = require('http').Server(app)
var io = require('socket.io')(serv,{})
var debug = true

require('./db')
require('./models/Player')

var PlayerData = mongoose.model('player')

//file cm===========================
app.get('/', function(req, res){
    res.sendFile(__dirname+'/client/index.html')
})

app.use('/client', express.static(__dirname+'/client'))

serv.listen(5000, function(){
    console.log('Connected on localhost 5000')
})

var SocketList = {}
var PlayerList = {}

//class for game objct 
var GameObject = function(){
    var self = {
        x:400, 
        y:300,
        spX:0,
        spY:0,
        id:"",
        
    }

    self.update = function(){
        self.updatePosition()
    }

    self.updatePosition = function(){
        self.x += self.spX
        self.y += self.spY

    }

    self.getDist = function(point){
        return Math.sqrt(Math.pow(self.x - point.x, 2) + Math.pow(self.y-point.y,2))

    }
    return self
}

var Player = function(id){
    var self = GameObject()
    self.id = id
    self.number = Math.floor(Math.random()*10)
    self.right = false
    self.left = false
    self.up = false
    self.down = false
    self.attack = false
    self.mouseAngle = 0
    self.speed = 10

    var playerUpdate = self.update

    self.update = function(){
        self.updateSpeed()
        playerUpdate()
        if(self.attack){
           
        }
    }


    self.updateSpeed = function(){
        if(self.right){
            self.spX = self.speed
        }
        else if(self.left){
            self.spX = -self.speed
        }
        else{
            self.spX = 0
        }

        if(self.up){
            self.spY = -self.speed
        }
        else if(self.down){
            self.spY = self.speed
        }
        else{
            self.spY = 0
        }
    }

    Player.list[id] = self

    return self
}

Player.list = {}

//list of functions for conection and movements
Player.onConnect = function(socket){
    var player = new Player(socket.id)

    //receive input
    socket.on('keypress', function(data){
        if(data.inputId === 'up')
            player.up = data.state
        if(data.inputId === 'down')
            player.down = data.state
        if(data.inputId === 'left')
            player.left = data.state
        if(data.inputId === 'right')
            player.right = data.state
        if(data.inputId === 'attack')
            player.attack = data.state 
        if(data.inputId === 'mouseAngle')
            player.mouseAngle = data.state
    })
}

Player.onDisconnect = function(socket){
    delete Player.list[socket.id]
}

Player.update = function(){
    var pack = []
    for(var i in Player.list){
        var player = Player.list[i]
        player.update()
        pack.push({
            x: player.x,
            y: player.y,
            number:player.number, 
            id:player.id
        })
    }

    return pack
}



//users collection setup
var Players = {
    "Matt":"123",
    "Rob":"asd",
    "Ron":"321",
    "Jay":"ewq",
}

var isPasswordValid = function(data, cb){
    PlayerData.findOne({username:data.username},function(err,username){
        cb(data.password == username.password)
        
    })

}

var isUsernameTaken = function(data,cb){
    PlayerData.findOne({username:data.uername},function(err, username){

        if(username == null){
            cb(false)
        }else{
            cb(true)
        }
    })
}

var addUser = function(data){

    new PlayerData(data).save()
}

//connection to game
io.sockets.on('connection', function(socket){
    console.log('Socket connected')

    socket.id = Math.random()

    SocketList[socket.id] = socket


    //logging in
    socket.on('signIn', function(data){

        isPasswordValid(data, function(res){
            if(res){
                Player.onConnect(socket)
                socket.emit('connected', socket.id)
                socket.emit('signInResponse', {success:true})

            }else{
                socket.emit('signInResponse', {success:false})
            }
        })
        
    })

    //disconnection
    socket.on('disconnect', function(){
        delete SocketList[socket.id]
        Player.onDisconnect(socket)
    })

    //signing up
    socket.on('signUp', function(data){

        isUsernameTaken(data, function(res){
            if(res){
                socket.emit('signUpResponse', {success:false})

            }else{
                addUser(data)
                socket.emit('signUpResponse', {success:true})
            }
        })
    })

    socket.on('sendMessageToServer', function(data){
        var playerName = (" " + socket.id).slice(2,7)
        for(var i in SocketList){
            SocketList[i].emit('addToChat', playerName + ": " + data)

        }
    })

    socket.on('evalServer', function(data){
        if(!debug){
            return
        }
        var res = eval(data)
        socket.emit('evalResponse', res)
    })

    
})

//update 
setInterval(function(){
    var pack = {
        player:Player.update()
    }
   //var pack = Player.update()
    for(var i in SocketList){
        var socket = SocketList[i]
        socket.emit('newPositions',pack)
    }
    
}, 1000/30)