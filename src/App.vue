<script setup>
import {ref} from "vue";
import socket from './service/ws';
import peerConnection from "./service/rtc";

const greeting = ref('');
const message = ref('');
const messages = ref([]);

function sendMessage() {
  socket.emit('message', message.value);
  message.value = '';
}
function onMessage(msg) {
  messages.value.push(msg);
}
function onGreeting(msg) {
  greeting.value = msg;
}
async function onOffer(offer) {
  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('answer', answer);
}
async function onAnswer(answer) {
  const remoteDesc = new RTCSessionDescription(answer);
  await peerConnection.setRemoteDescription(remoteDesc);
}
async function onCandidate(candidate) {
  const iceCandidate = new RTCIceCandidate(candidate);
  await peerConnection.addIceCandidate(iceCandidate);
  greeting.value = candidate;
}
socket.on('message', onMessage);
socket.on('greeting', onGreeting);
socket.on('offer', onOffer);
socket.on('answer', onAnswer);
socket.on('candidate', onCandidate);
peerConnection.addEventListener('icecandidate', ({candidate}) => {
  socket.emit('candidate', candidate);
});


(async () => {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit('offer', offer);
})();
</script>

<template lang="pug">
.container
  form.w-50.border(
    @submit.prevent="sendMessage"
  )
    header.p-2(v-if="greeting") Server: {{ greeting }}

    .p-2
      p(v-for="item in messages") {{item}}

    footer.p-2.d-flex
      input.form-control(
        v-model="message",
      )
      button.btn.btn-primary.ms-2 Send
</template>
