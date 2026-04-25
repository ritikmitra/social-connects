import { useEffect, useRef, useState, useCallback } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { RTCPeerConnection, RTCView, mediaDevices, RTCIceCandidate, RTCSessionDescription } from 'react-native-webrtc';
import { useSocket } from '@/context/socket.context';
import { Ionicons } from '@expo/vector-icons';

const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export default function CallScreen() {
  const { callId, targetUserId, isVideo, isCaller } = useLocalSearchParams();
  const { socket } = useSocket();

  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideo === "true");

  const peerRef = useRef<any>(null);
  const isCallerRef = useRef(isCaller === "true");

  // Get local media
  const getMedia = useCallback(async (video: boolean) => {
    const stream = await mediaDevices.getUserMedia({
      audio: true,
      video: video ? { facingMode: 'user' } : false,
    });
    setLocalStream(stream);
    return stream;
  }, []);

  const attachPeerHandlers = useCallback(() => {
    if (!peerRef.current || !socket) return;

    peerRef.current.ontrack = (e: any) => setRemoteStream(e.streams[0]);
    peerRef.current.onicecandidate = (e: any) => {
      if (!e.candidate) return;
      socket.emit("ice_candidate", {
        call_id: callId,
        target_user_id: targetUserId,
        candidate: e.candidate
      });
    };
  }, [socket, callId, targetUserId]);

  // Start call (caller only)
  const startCall = useCallback(async () => {
    if (!socket) return;
    const stream = await getMedia(isVideo === "true");
    peerRef.current = new RTCPeerConnection(config);

    stream.getTracks().forEach(track => peerRef.current.addTrack(track, stream));
    attachPeerHandlers();

    const offer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(offer);

    socket.emit("offer", {
      call_id: callId,
      target_user_id: targetUserId,
      offer: peerRef.current.localDescription
    });
  }, [socket, getMedia, isVideo, attachPeerHandlers, callId, targetUserId]);

  const acceptCall = useCallback(() => {
    if (!socket) return;
    isCallerRef.current = false;
    socket.emit("accept_call", { call_id: callId, target_user_id: targetUserId });
  }, [socket, callId, targetUserId]);

  const cleanup = useCallback(() => {
    localStream?.getTracks().forEach((t: any) => t.stop());
    remoteStream?.getTracks().forEach((t: any) => t.stop());
    peerRef.current?.close();
    peerRef.current = null;
  }, [localStream, remoteStream]);

  // Handle signaling
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data: any) => {
      // Show ringing UI or use CallKeep.displayIncomingCall
      Alert.alert("Incoming Call", `${data.caller_name} is calling...`, [
        { text: "Reject", onPress: () => socket.emit("reject_call", { call_id: data.call_id }) },
        { text: "Accept", onPress: acceptCall }
      ]);
    };

    const handleOffer = async ({ offer }: any) => {
      const stream = await getMedia(isVideo === "true");
      peerRef.current = new RTCPeerConnection(config);
      stream.getTracks().forEach(t => peerRef.current.addTrack(t, stream));
      attachPeerHandlers();

      await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);

      socket.emit("answer", { call_id: callId, target_user_id: targetUserId, answer });
    };

    const handleAnswer = async ({ answer }: any) => {
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const handleIceCandidate = async ({ candidate }: any) => {
      if (peerRef.current) await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    };

    socket.on("incoming_call", handleIncomingCall);
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice_candidate", handleIceCandidate);

    if (isCallerRef.current) startCall();

    return () => {
      socket.off("incoming_call");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice_candidate");
      cleanup();
    };
  }, [socket, acceptCall, attachPeerHandlers, callId, targetUserId, isVideo, startCall, cleanup, getMedia]);

  const toggleMute = () => {
    if (!localStream) return;
    const next = !isMuted;
    localStream.getAudioTracks().forEach((t: any) => {
      t.enabled = !next;
    });
    setIsMuted(next);
  };

  const toggleVideo = () => {
    if (!localStream) return;
    const next = !isVideoEnabled;
    localStream.getVideoTracks().forEach((t: any) => {
      t.enabled = next;
    });
    setIsVideoEnabled(next);
  };

  const endCall = () => {
    if (!socket) return;
    socket.emit("end_call", { call_id: callId });
    cleanup();
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {remoteStream && (
        <RTCView streamURL={remoteStream.toURL()} style={{ flex: 1 }} objectFit="cover" />
      )}

      {localStream && (
        <RTCView 
          streamURL={localStream.toURL()} 
          style={{ position: 'absolute', bottom: 100, right: 20, width: 120, height: 160, borderRadius: 12 }} 
        />
      )}

      <View style={{ position: 'absolute', bottom: 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around' }}>
        <Pressable onPress={toggleMute}>
          <Ionicons name={isMuted ? "mic-off" : "mic"} size={32} color="white" />
        </Pressable>
        <Pressable onPress={endCall} style={{ backgroundColor: 'red', padding: 20, borderRadius: 50 }}>
          <Ionicons name="call" size={32} color="white" />
        </Pressable>
        {isVideo === "true" && (
          <Pressable onPress={toggleVideo}>
            <Ionicons name={isVideoEnabled ? "videocam" : "videocam-off"} size={32} color="white" />
          </Pressable>
        )}
      </View>
    </View>
  );
}