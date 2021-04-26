const http = require('http');
const express = require('express');
const socketio = require('socket.io');
// const cors = require('cors');

const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');

const router = require('./router');

const options={
    cors:true,
    origins:["http://127.0.0.1"],
   }

const app = express();
const server = http.createServer(app);
const io = socketio(server, options);


// app.use(cors());
// app.use(cors({
//     origin: 'http://localhost:5000'
//   }));
// var allowedOrigins = ['http://localhost:8080',
//                       'http://localhost:5000'];
// app.use(cors({
//   origin: function(origin, callback){
//     // allow requests with no origin 
//     // (like mobile apps or curl requests)
//     if(!origin) return callback(null, true);
//     if(allowedOrigins.indexOf(origin) === -1){
//       var msg = 'The CORS policy for this site does not ' +
//                 'allow access from the specified Origin.';
//       return callback(new Error(msg), false);
//     }
//     return callback(null, true);
//   }
// }));
app.use(router);


io.on('connect', (socket) => {
  console.log("Connnected", Date.now())
  socket.on('join', ({ name, room }, callback) => {
    console.log(name, room, "<-----NAME ROOM")
    const { error, user } = addUser({ id: socket.id, name, room });

    if(error) return callback(error);
    console.log(user, "<----USER")
    socket.join(user.room);

    socket.emit('message', { user: 'admin', text: `${user.name}, welcome to room ${user.room}.`});
    socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!` });

    // io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });

    callback();
  });

  socket.on('sendMessage', (message, callback) => {
    // console.log(socket)
    const user = getUser(socket.id);

    console.log({user}, "<<-----USER")
    
    if (user) {
      io.to(user.room).emit('message', { user: user.name, text: message });
    }

    callback();
  });

  socket.on('disconnect', () => {
  
    console.log("Disconnnected", Date.now())

    const user = removeUser(socket.id);

    if(user) {
      io.to(user.room).emit('message', { user: 'Admin', text: `${user.name} has left.` });
      io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});
    }
  })
});






// io.on('connect', (socket) => {
//     console.log("We have a new connection")
//     socket.on('join', ({ name, room }, callback) => {
//       console.log("01_We have a new join with", {name, room})
//       const { error, user } = addUser({ id: socket.id, name, room });

//       // if(error) return callback(error);

//       // socket.join(user.room);

//       // socket.emit('message', { user: 'admin', text: `${user.name}, welcome to room ${user.room}.`});
//       // socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!` });

//       // io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });

//       // callback();
//   });

//   socket.on("message", (message, dateNow) => {
//     console.log("MESSAGE:", message, dateNow)
//   })

//   socket.on('sendMessage', (message, callback) => {

//     // console.log(onSendMeassage, "onSendMeassage")
//     const user = getUser(socket.id);

//     // io.to(user.room).emit('message', { user: user.name, text: message });
//     io.to("user.room").emit('message', { user: user.name, text: message });


//     callback();
//   });

//   socket.on('disconnect', () => {
//     // const user = removeUser(socket.id);
//     console.log("Disconnected")

//     // if(user) {
//     //   io.to(user.room).emit('message', { user: 'Admin', text: `${user.name} has left.` });
//     //   io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});
//     // }
//   })
// });

server.listen(process.env.PORT || 5000, () => console.log(`Server has started.`));