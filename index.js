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

server.listen(process.env.PORT || 5000, () => console.log(`Server has started.`));