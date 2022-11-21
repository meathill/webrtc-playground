import io from 'socket.io-client';
import EventEmitter from "eventemitter3";
import config from '../config';

class WS extends EventEmitter {
  nickname = 'nickname';
  #socket = null;
  #connected = false;
  #error = null;

  constructor() {
    super();
    this.onMessage = this.#onMessage.bind(this);
    this.onGreeting = this.#onGreeting.bind(this);
    this.onOffer = this.#onOffer.bind(this);
    this.onAnswer = this.#onAnswer.bind(this);
    this.onCandidate = this.#onCandidate.bind(this);
    this.onSockets = this.#onSockets.bind(this);
  }

  get connected() {
    return this.#connected;
  }

  get error() {
    return this.#error;
  }

  connect() {
    if (this.#socket) return this.#socket;

    this.#socket = io(config.ws);
    this.#socket.on('connect', async () => {
      this.#connected = true;
      this.#socket.emit('set-name', this.nickname);
      this.emit('connect');
    });
    this.#socket.on('disconnect', () => {
      this.#connected = false;
      this.emit('disconnect');
    });
    this.#socket.on('connect_error', (err) => {
      this.#error= err;
    });
    this.#socket.on('message', this.onMessage);
    this.#socket.on('greeting', this.onGreeting);
    this.#socket.on('offer', this.onOffer);
    this.#socket.on('answer', this.onAnswer);
    this.#socket.on('candidate', this.onCandidate);
    this.#socket.on('sockets', this.onSockets);
    return this.#socket;
  }

  send(message) {
    this.#socket.emit('message', message);
  }

  sendOffer(offer) {
    this.#socket.emit('offer', offer, this.#socket.id);
  }

  sendAnswer(answer, from) {
    this.#socket.emit('answer', answer, from);
  }

  sendCandidate(candidate, to) {
    this.#socket.emit('candidate', candidate, to);
  }

  #onMessage(message) {
    this.emit('message', message);
  }

  #onGreeting(message) {
    this.emit('greeting', message);
  }

  #onOffer(offer, id) {
    this.emit('offer', offer, id);
  }

  #onAnswer(answer, from) {
    this.emit('answer', answer, from);
  }

  #onCandidate(candidate, to) {
    this.emit('candidate', candidate, to);
  }

  #onSockets(sockets) {
    this.emit('sockets', sockets);
  }
}

const ws = new WS();

export default ws;
