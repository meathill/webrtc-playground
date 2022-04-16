#!/usr/bin/env node

const config = require('../src/config');
const {Server} = require('socket.io');
const io = new Server(4000, {
  cors: {
    origin: config.origin,
    methods: ["GET", "POST"]
  }
});

const clients = {};
let index = 0;

function onMessage(message) {
  io.emit('message', message, index++);
}

io.on('connection', socket => {
  socket.emit('greeting', 'hello', index++);

  clients[socket.id] = socket;

  function onDisconnect() {
    socket.off('message', onMessage);
    socket.off('disconnect', onDisconnect);
    socket.off('offer', onOffer);
    socket.off('answer', onAnswer);
    socket.off('candidate', onCandidate);
    socket.off('set-name', onSetName);
    delete clients[socket.id];
  }

  function onOffer(offer, id) {
    clients[id].emit('offer', offer, socket.id, index++);
    clients[id].data.offer = socket.id;
  }

  function onAnswer(answer, from) {
    clients[from].emit('answer', answer, index++);
    clients[from].data.answer = socket.id;
  }

  function onCandidate(candidate, to) {
    clients[to].emit('candidate', candidate, index++);
  }

  async function onSetName(name) {
    socket.data.nickname = name;
    const sockets = await io.fetchSockets();
    io.emit('sockets', sockets.map(({id, data}) => ({...data, id})), index++);
  }

  socket.on('set-name', onSetName);
  socket.on('message', onMessage);
  socket.on('offer', onOffer);
  socket.on('answer', onAnswer);
  socket.on('candidate', onCandidate);
  socket.on('disconnect', onDisconnect);
});
