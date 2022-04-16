const peerConnection = new RTCPeerConnection();

export const channel = peerConnection.createDataChannel('chat');

export default peerConnection;
