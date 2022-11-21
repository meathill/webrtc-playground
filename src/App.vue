<script setup>
import {computed, ref} from "vue";
import ws from '@/service/ws';
import {iceServers} from "./data/config";

let peerConnection;
let channel;

ws.on('message', onMessage);
ws.on('greeting', onGreeting);
ws.on('offer', onOffer);
ws.on('answer', onAnswer);
ws.on('candidate', onCandidate);
ws.on('sockets', onSockets);
ws.on('connect', () => isWebSocketConnected.value = true);
ws.on('disconnect', () => isWebSocketConnected.value = false);
ws.on('error', () => wsError.value = ws.error);

// ws
const isWebSocketConnected = ref(false);
const wsError = ref(null);
const sockets = ref(null);
const webSocketGreeting = ref('');
const targetClient = ref(null);

// peerConnection
const isPcReady = ref(false);
const isPcConnecting = ref(false);
const nickname = ref('');
const log = ref(['ws: connecting']);
const channelStatus = ref('');
const message = ref('');
const receivedMessages = ref([]);

// dom refs
const nicknameInput = ref(null);
const messageInput = ref(null);

const disabled = computed(() => {
  return !isPcReady.value || channelStatus.value !== 'open';
});

async function doConnectWebSocket() {
  ws.connect();
}
async function doConnectPc() {
  log.value.push('pc: making offer');
  isPcConnecting.value = true;
  peerConnection = createPeerConnection();
  channel = createDataChannel();
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  log.value.push('pc: sending offer');
  ws.sendOffer(offer);
}

function doSendMessage() {
  if (channel) {
    channel.send(message.value);
  } else {
    ws.send(message.value);
  }
  message.value = '';
}

function onNicknameChange() {
  ws.nickname = nickname.value;
}

// ws events
function onMessage(message) {
  if (message.data) {
    const {data} = message;
    if (data === '__hello__') {
      isPcReady.value = true;
    } else {
      receivedMessages.value.push('[channel] ' + message.data);
    }
  } else {
    receivedMessages.value.push(message);
  }
}
function onGreeting(msg) {
  webSocketGreeting.value = msg;
  log.value.push('ws: connected: ' + msg);
}
async function onOffer(offer, from) {
  log.value.push('pc: received offer');
  targetClient.value = from;
  isPcConnecting.value = true;
  peerConnection = peerConnection || createPeerConnection();
  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  log.value.push('pc: sending answer');
  ws.sendAnswer(answer, from);
}
async function onAnswer(answer) {
  log.value.push('pc: received answer');
  const remoteDesc = new RTCSessionDescription(answer);
  await peerConnection.setRemoteDescription(remoteDesc);
  isPcConnecting.value = false;
  isPcReady.value = true;
  log.value.push('pc: ready');
}
async function onCandidate(candidate) {
  peerConnection = peerConnection || createPeerConnection();
  await peerConnection.addIceCandidate(candidate);
  log.value.push('pc: added candidate');
}
function onSockets(data) {
   sockets.value = data.map(item => {
     return {
       ...item,
       isConnecting: false,
     }
   });
}
function onDataChannel(event) {
  channel = event.channel;
  channel.addEventListener('message', onMessage);
  channel.addEventListener('open', onChannelStatusChange);
  channel.addEventListener('close', onChannelStatusChange);
}
function onChannelStatusChange(event) {
  log.value.push('channel state: ' + event.target.readyState);
  channelStatus.value = event.target.readyState;
  if (event.target.readyState === 'open' && !isPcReady.value) {
    isPcConnecting.value = false;
    isPcReady.value = true;
  }
}
function createPeerConnection() {
  const peerConnection = new RTCPeerConnection(iceServers);
  peerConnection.addEventListener('icecandidate', ({candidate}) => {
    log.value.push('pc: sending candidate');
    ws.sendCandidate(candidate, targetClient.value);
  });
  peerConnection.addEventListener('datachannel', onDataChannel);
  return peerConnection;
}
function createDataChannel() {
  const channel = peerConnection.createDataChannel('channel');
  channel.addEventListener('open', onChannelStatusChange);
  channel.addEventListener('close', onChannelStatusChange);
  channel.addEventListener('message', onMessage);
  return channel;
}
</script>

<template lang="pug">
.container.pt-3
  .mx-auto.col-md-6
    .list-group
      form.list-group-item.d-flex.justify-content-between.align-items-center(
        @submit.prevent="doConnectWebSocket",
      )
        label(for="nickname") Nickname:
        input#nickname.form-control.form-control-sm.mx-2(
          ref="nicknameInput",
          v-model="nickname",
          required,
          placeholder="Enter your nickname",
          :readonly="isWebSocketConnected",
          @change="onNicknameChange",
        )
        .text-success(v-if="isWebSocketConnected") Connected
        button.btn.btn-primary.btn-sm(
          v-else,
          :disabled="!nickname",
        ) Connect
      .list-group-item
        .list-group.border.rounded-2.flex-grow-1
          label.list-group-item.d-flex.justify-content-between.align-items-center(
            v-for="item in sockets",
            :class="{active: item.id === targetClient}",
            :key="item.id",
          ) {{item.nickname}}
            input(
              type="radio",
              hidden,
              :value="item.id",
              v-model="targetClient",
            )
      .list-group-item.d-flex.justify-content-between.align-items-center PeerConnection:
        span.badge.bg-success(v-if="isPcReady") ready
        button.btn.btn-primary.btn-sm(
          v-else,
          type="button",
          :disabled="!isWebSocketConnected || !targetClient",
          @click="doConnectPc",
        )
          span.spinner-border.spinner-border-sm.me-2(v-if="isPcConnecting")
          | Connect

      .list-group-item.d-flex.justify-content-between.align-items-center Channel:
        span.badge.bg-success {{channelStatus}}



    .chat-box.messages.p-2.rounded-2.border.my-2
      p(v-for="item in receivedMessages") {{item}}

    form.border.p-2.d-flex(
      @submit.prevent="doSendMessage"
    )
      input.form-control.form-control-sm(
        ref="messageInput",
        v-model="message",
      )
      button.btn.btn-primary.ms-2.btn-sm(
        :disabled="disabled",
      ) Send

    pre.px-2.border.rounded-2.mb-0 {{log.join('\n')}}
</template>

<style lang="stylus">
pre
  max-height 12.5rem
  overflow auto

.chat-box
  min-height 5rem
</style>
