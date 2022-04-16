<script setup>
import {computed, ref} from "vue";
import socket from './service/ws';
import {iceServers} from "./data/config";

let peerConnection;
let channel;

const isPcReady = ref(false);
const isPcConnecting = ref(false);
const log = ref(['ws: connecting']);
const webSocketGreeting = ref('');
const channelStatus = ref('');
const message = ref('');
const messages = ref([]);
const messageBox = ref(null);

const disabled = computed(() => {
  return true;
});

async function doConnectPc() {
  log.value.push('pc: making offer');
  isPcConnecting.value = true;
  peerConnection = createPeerConnection();
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  log.value.push('pc: sending offer');
  socket.emit('offer', offer);
}
function doSendMessage() {
  if (channel) {
    channel.send(message.value);
  } else {
    socket.emit('message', message.value);
  }
  message.value = '';
  messageBox.value.focus();
}
function onMessage(message) {
  if (message.data) {
    message.value.push('[channel] ' + message.data);
  }
  messages.value.push(message);
}
function onGreeting(msg) {
  webSocketGreeting.value = msg;
  log.value.push('ws: connected: ' + msg);
}
async function onOffer(offer) {
  log.value.push('pc: received offer');
  isPcConnecting.value = true;
  peerConnection = peerConnection || createPeerConnection();
  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  log.value.push('pc: sending answer');
  socket.emit('answer', answer);
}
async function onAnswer(answer) {
  log.value.push('pc: received answer');
  const remoteDesc = new RTCSessionDescription(answer);
  await peerConnection.setRemoteDescription(remoteDesc);
  isPcConnecting.value = false;
  isPcReady.value = true;
  log.value.push('pc: ready');
  channel = channel || createChannel();
}
async function onCandidate(candidate) {
  const iceCandidate = new RTCIceCandidate(candidate);
  await peerConnection.addIceCandidate(iceCandidate);
  greeting.value = candidate;
}
function onDataChannel(event) {
  channel = event.channel;
  channel.addEventListener('message', onMessage);
  channel.addEventListener('open', onChannelStatusChange);
  channel.addEventListener('close', onChannelStatusChange);
}

function createPeerConnection() {
  const peerConnection = new RTCPeerConnection(iceServers);
  peerConnection.addEventListener('icecandidate', ({candidate}) => {
    //socket.emit('candidate', candidate);
    peerConnection.addIceCandidate(candidate);
  });
  peerConnection.addEventListener('datachannel', onDataChannel);
  return peerConnection;
}
function createChannel() {
  const channel = peerConnection.createDataChannel('channel');
  channel.addEventListener('open', onChannelStatusChange);
  channel.addEventListener('close', onChannelStatusChange);
  channel.addEventListener('message', onMessage);
  return channel;
}
socket.on('message', onMessage);
socket.on('greeting', onGreeting);
socket.on('offer', onOffer);
socket.on('answer', onAnswer);
socket.on('candidate', onCandidate);

function onChannelStatusChange(event) {
  console.log('channel ' + event.name);
  channelStatus.value = event.state;
}
</script>

<template lang="pug">
.container.pt-3
  .w-50.mx-auto
    .d-flex
      .list-group.w-50
        .list-group-item.d-flex.justify-content-between.align-items-center WebSocket:
          span.badge.bg-success {{webSocketGreeting}}
        .list-group-item.d-flex.justify-content-between.align-items-center PeerConnection:
          span.badge.bg-success(v-if="isPcReady") ready
          button.btn.btn-primary.btn-sm(
            v-else,
            type="button",
            :disabled="isPcConnecting",
            @click="doConnectPc",
          )
            span.spinner-border.spinner-border-sm.me-2(v-if="isPcConnecting")
            | Connect
        .list-group-item.d-flex.justify-content-between.align-items-center Channel:
          span.badge.bg-success {{channelStatus}}
      pre.ms-2.px-2.border.rounded-2.flex-grow-1.mb-0.overflow-auto {{log.join('\n')}}

    .p-2.rounded-2.border.my-2
      p(v-for="item in messages") {{item}}

    form.border.p-2.d-flex(
      @submit.prevent="doSendMessage"
    )
      input.form-control(
        ref="messageBox",
        v-model="message",
      )
      button.btn.btn-primary.ms-2(
        :disabled="disabled",
      ) Send
</template>
