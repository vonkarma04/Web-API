var express = require('express')
const { connect } = require('http2')
var app = express()
var path = require('path')
var port = process.env.PORT || 3000
var serv = require('http').Server(app)
var io = require('socket.io')(serv,{})

//emits

//var addEntry = document.getElementById('add');
//
var SocketList = {}

//build route for the index page
app.get('/', function(req,res){
    res.sendFile(path.join(__dirname+'/views/index.html'))
})

app.use(express.static(__dirname+'/views'))

app.listen(port, function(){
    console.log('Connected to port 3000')
})



io.sockets.on('connection', function(socket){
    console.log('connected')

    socket.id = Math.random()
    socket.username = "Gay"

    SocketList[socket.id] = socket
    SocketList[socket.username] = socket
    SocketList[socket.highscore] = socket
})