
// //import the Express library
 let express = require('express');
 let dgram = require('dgram');
 const OSC = require('osc-js');


let udpServer = dgram.createSocket('udp4')
const portNumber =4200;
let app = express(); //make an insatnce of express
// create a server (using the Express framework object)
app.use(express.static(__dirname + '/public'));
// for the client...
app.use(express.static(__dirname + '/node_modules'));
 
let httpServer = require('http').createServer(app);  // create a server (using the Express framework object)
// // declare io which mounts to our httpServer object (runs on top ... )
let io = require('socket.io')(httpServer);


// make server listen for incoming messages
httpServer.listen(portNumber, function () {
    console.log('listening on port:: ' + portNumber);
})



//io listens for the connection event for incoming sockets, and if one is connected
//will log it to the console....
io.on('connect', async function(socket){
    //the socket id built in...
    console.log(socket.id);
    console.log('a user connected');


    

    socket.on('browser', function (data) {
    console.log(data);
    let args = []

    // data.forEach(function (element) {
    //   args.push({
    //     type: 'float',
    //     value: parseFloat(element) || 0
    //   })
    // })

    // var oscMsg = osc.toBuffer({
    //   oscType: 'message',
    //   address: '/wek/inputs',
    //   args: args
    // })

 //  udpServer.send(oscMsg, 0, oscMsg.length, remotePort, remoteIp)
 //   console.log('OSC message sent to ' + remoteIp + ':' + remotePort)

 const message = new OSC.Message('/wek/inputs', 21)
 const binary = message.pack()
 udpServer.send(new Buffer(binary), 0, binary.byteLength, 6448, 'localhost')
 socket.emit("fromServer","datatatat");


 })

 // receive a message via UDP FROM WEKINATROR
 udpServer.on('message', data => {
  const msg = new OSC.Message()
  msg.unpack(data)
  console.log(msg.args)
  //emit result back to client (browser)
})

   })





