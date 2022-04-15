const peerConnection = new RTCPeerConnection({
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302"
    }
  ]
});

export const channel = peerConnection.createDataChannel('chat');

export default peerConnection;
