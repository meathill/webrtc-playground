#!/usr/bin/env node

const {Server} = require('socket.io');
const io = new Server(4000, {
  cors: {
    origin: "http://10.0.0.77:3000",
    methods: ["GET", "POST"]
  }
});

const clients = [];

function onMessage(message) {
  io.emit('message', message);
}

io.on('connection', socket => {
  socket.emit('greeting', 'hello');

  clients.push(socket);

  function onDisconnect() {
    socket.off('message', onMessage);
    socket.off('disconnect', onDisconnect);
    socket.off('offer', onOffer);
    socket.off('answer', onAnswer);
    socket.off('candidate', onCandidate);
    clients.splice(clients.indexOf(socket), 1);
  }

  function onOffer(offer) {
    socket.broadcast.emit('offer', offer);
  }

  function onAnswer(answer) {
    socket.broadcast.emit('answer', answer);
  }

  function onCandidate(candidate) {
    socket.broadcast.emit('candidate', candidate);
  }

  socket.on('message', onMessage);
  socket.on('offer', onOffer);
  socket.on('answer', onAnswer);
  socket.on('candidate', onCandidate);
  socket.on('disconnect', onDisconnect);
});
