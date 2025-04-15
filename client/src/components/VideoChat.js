// src/components/VideoChat.js
import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';

// Connect to the signaling server

const VideoChat = ({ roomId = 'studyRoom' }) => {
  const [peers, setPeers] = useState([]);
  const [muted, setMuted] = useState(false);  // state to track mute status
  const userVideoRef = useRef();
  const peersRef = useRef([]);
  const streamRef = useRef(null);
  const socketRef = useRef();
  
  useEffect(() => {
    socketRef.current = io('http://devtestingsus.ovh:25575');

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        streamRef.current = stream;
        userVideoRef.current.srcObject = stream;
        socketRef.current.emit('joinRoom', roomId);

        // Handle list of existing users when joining the room
        socketRef.current.on('allUsers', (userIDs) => {
          const peersArr = [];
          userIDs.forEach(userID => {
            const peer = createPeer(userID, stream, true);
            peersRef.current.push({ peerID: userID, peer });
            peersArr.push({ peerID: userID, peer });
          });
          setPeers(peersArr);
        });

         // For existing users: When a new user joins, create a peer (non-initiator)
        socketRef.current.on('newUser', (newUserID) => {
          const peer = createPeer(newUserID, stream, false);
          peersRef.current.push({ peerID: newUserID, peer });
          setPeers(prev => [...prev, { peerID: newUserID, peer }]);
        });

        // Handle incoming signaling data
        socketRef.current.on('signal', (payload) => {
          const item = peersRef.current.find(p => p.peerID === payload.from);
          if (item) {
            item.peer.signal(payload.signal);
          }
        });

        // Handle when a user leaves
        socketRef.current.on('userLeft', (userID) => {
          console.log('User left:', userID);
          const peerObj = peersRef.current.find(p => p.peerID === userID);
          if (peerObj) {
            peerObj.peer.destroy();
          }
          peersRef.current = peersRef.current.filter(p => p.peerID !== userID);
          setPeers(currentPeers => currentPeers.filter(p => p.peerID !== userID));
        });
      })
      .catch(err => console.error('Error accessing media devices.', err));
    
      // Cleanup event listeners on unmount
      return () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        peersRef.current.forEach(({ peer }) => peer.destroy());
        socketRef.current.emit('leaveRoom', roomId);
        socketRef.current.disconnect();
      };
  }, [roomId]);

  // Create a peer connection, parameter 'initiator' determines if it sends an offer
  function createPeer(userToSignal, stream, initiator) {
    const peer = new Peer({
      initiator,
      trickle: false,
      stream,
    });

    peer.on('signal', signal => {
      socketRef.current.emit('signal', { signal, to: userToSignal });
    });

    return peer;
  }

  // Toggle the audio track for mute/unmute
  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setMuted(prev => !prev);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '10px' }}>
        <button onClick={toggleMute}>
          {muted ? 'Unmute' : 'Mute'}
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        <video muted ref={userVideoRef} autoPlay playsInline style={{ width: "300px", margin: "10px"}} />
        {peers.map(({ peerID, peer }) => (
          <Video key={peerID} peer={peer} />
        ))}
      </div>
    </div>
  );
};

const Video = ({ peer }) => {
  const ref = useRef();

  useEffect(() => {
    peer.on('stream', stream => {
      ref.current.srcObject = stream;
    });
  }, [peer]);

  return <video playsInline autoPlay ref={ref} style={{ width: "300px", margin: "10px" }} />;
};

export default VideoChat;
