import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { RTCPeerConnection, RTCView, mediaDevices, RTCIceCandidate, RTCSessionDescription, MediaStream } from 'react-native-webrtc';
import { useSocket } from '@/context/socket.context';
import { Ionicons } from '@expo/vector-icons';

const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export default function CallScreen() {
  const { callId, targetUserId, targetName, isVideo, isCaller } = useLocalSearchParams();
  const { socket } = useSocket();

  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideo === "true");

  const peerRef = useRef<any>(null);
  const isCallerRef = useRef(isCaller === "true");
  const localStreamRef = useRef<any>(null);
  const remoteStreamRef = useRef<any>(null);
  const remoteMixedStreamRef = useRef<any>(null);
  const startedRef = useRef(false);

  const [status, setStatus] = useState<"calling" | "connecting" | "in_call" | "declined" | "ended">(
    isCallerRef.current ? "calling" : "connecting"
  );
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayName = typeof targetName === "string" && targetName.trim().length > 0
    ? targetName
    : "Contact";

  const initials = useMemo(() => {
    const parts = displayName.split(" ").filter(Boolean);
    const a = parts[0]?.[0] ?? "C";
    const b = parts[1]?.[0] ?? "";
    return `${a}${b}`.toUpperCase();
  }, [displayName]);

  // Get local media
  const getMedia = useCallback(async (video: boolean) => {
    const stream = await mediaDevices.getUserMedia({
      audio: true,
      video: video ? { facingMode: 'user' } : false,
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  const attachPeerHandlers = useCallback(() => {
    if (!peerRef.current || !socket) return;

    peerRef.current.ontrack = (e: any) => {
      // Some rn-webrtc builds (esp. audio-only) may deliver tracks with empty `e.streams`.
      const streamFromEvent = e?.streams?.[0];
      if (streamFromEvent) {
        remoteStreamRef.current = streamFromEvent;
        setRemoteStream(streamFromEvent);
      } else if (e?.track) {
        if (!remoteMixedStreamRef.current) {
          remoteMixedStreamRef.current = new MediaStream();
        }
        try {
          remoteMixedStreamRef.current.addTrack(e.track);
        } catch {
          // ignore
        }
        remoteStreamRef.current = remoteMixedStreamRef.current;
        setRemoteStream(remoteMixedStreamRef.current);
      }
      setStatus("in_call");
    };

    peerRef.current.onconnectionstatechange = () => {
      const s = peerRef.current?.connectionState;
      if (s === "connected") setStatus("in_call");
      else if (s === "connecting") setStatus("connecting");
    };
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
    if (startedRef.current) return;
    startedRef.current = true;
    setStatus("connecting");

    const stream = await getMedia(isVideo === "true");
    const pc = new RTCPeerConnection(config);
    peerRef.current = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    attachPeerHandlers();

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Use `pc` (not peerRef) to avoid null-race with cleanup.
    socket.emit("offer", {
      call_id: callId,
      target_user_id: targetUserId,
      offer: pc.localDescription
    });
  }, [socket, getMedia, isVideo, attachPeerHandlers, callId, targetUserId]);

  const acceptCall = useCallback(() => {
    if (!socket) return;
    isCallerRef.current = false;
    setStatus("connecting");
    socket.emit("accept_call", { call_id: callId, target_user_id: targetUserId });
  }, [socket, callId, targetUserId]);

  const cleanup = useCallback(() => {
    startedRef.current = false;

    const ls = localStreamRef.current;
    const rs = remoteStreamRef.current;
    localStreamRef.current = null;
    remoteStreamRef.current = null;

    try { ls?.getTracks?.().forEach((t: any) => t.stop()); } catch {}
    try { rs?.getTracks?.().forEach((t: any) => t.stop()); } catch {}

    try { peerRef.current?.close?.(); } catch {}
    peerRef.current = null;
  }, []);

  // Auto-exit call screen on declined/ended (WhatsApp-like).
  useEffect(() => {
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    exitTimerRef.current = null;

    if (status === "declined" || status === "ended") {
      exitTimerRef.current = setTimeout(() => {
        try {
          router.back();
        } catch {
          // ignore
        }
      }, 1200);
    }

    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    };
  }, [status]);

  const setSpeaker = useCallback((enabled: boolean) => {
    // NOTE: Actual speakerphone routing requires a native audio-route module.
    // We keep the UI toggle now; wiring can be added once such a module is present.
    setIsSpeakerOn(enabled);
  }, []);

  // Handle signaling
  useEffect(() => {
    if (!socket) return;

    const handleOffer = async ({ call_id, offer }: any) => {
      if (call_id && call_id !== callId) return;
      const stream = await getMedia(isVideo === "true");
      const pc = new RTCPeerConnection(config);
      peerRef.current = pc;
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      attachPeerHandlers();

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answer", { call_id: callId, target_user_id: targetUserId, answer });
    };

    const handleAnswer = async ({ call_id, answer }: any) => {
      if (call_id && call_id !== callId) return;
      if (!peerRef.current) return;
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      setStatus("in_call");
    };

    const handleIceCandidate = async ({ call_id, candidate }: any) => {
      if (call_id && call_id !== callId) return;
      if (peerRef.current) await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    };

    const handleRejected = (payload?: any) => {
      const rejectedCallId = payload?.call_id ?? payload?.callId ?? payload?.id;
      // If server sends an id, only react to this call.
      if (rejectedCallId && rejectedCallId !== callId) return;

      if (isCallerRef.current) {
        setStatus("declined");
        cleanup();
      }
    };

    const handleEnded = () => {
      setStatus("ended");
      cleanup();
    };

    const handleAccepted = (payload?: any) => {
      const acceptedCallId = payload?.call_id ?? payload?.callId ?? payload?.id;
      if (acceptedCallId && acceptedCallId !== callId) return;
      if (!isCallerRef.current) return;
      setStatus("connecting");
      startCall();
    };

    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice_candidate", handleIceCandidate);
    // Common server event names (support multiple).
    socket.on("call_rejected", handleRejected);
    socket.on("call_declined", handleRejected);
    socket.on("rejected_call", handleRejected);
    socket.on("call_ended", handleEnded);
    socket.on("end_call", handleEnded);
    socket.on("call_accepted", handleAccepted);

    // IMPORTANT: only send offer after receiver accepts,
    // otherwise the receiver can miss the "offer" event while not on this screen.
    if (!isCallerRef.current) setStatus("connecting");

    return () => {
      socket.off("offer");
      socket.off("answer");
      socket.off("ice_candidate");
      socket.off("call_rejected", handleRejected);
      socket.off("call_declined", handleRejected);
      socket.off("rejected_call", handleRejected);
      socket.off("call_ended", handleEnded);
      socket.off("end_call", handleEnded);
      socket.off("call_accepted", handleAccepted);
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
    socket.emit("end_call", { call_id: callId, target_user_id: targetUserId });
    cleanup();
    router.back();
  };

  const hasVideoTrack = (stream: any) => {
    try {
      return !!stream?.getVideoTracks?.()?.length;
    } catch {
      return false;
    }
  };

  const showRemoteVideo = remoteStream && hasVideoTrack(remoteStream);
  const showLocalVideo = localStream && isVideoEnabled && hasVideoTrack(localStream);

  return (
    <View style={styles.container}>
      {showRemoteVideo && (
        <RTCView streamURL={remoteStream.toURL()} style={styles.remoteVideo} objectFit="cover" />
      )}

      {showLocalVideo && (
        <RTCView 
          streamURL={localStream.toURL()} 
          style={styles.localVideo}
        />
      )}

      {/* Audio-call UI (or fallback while video connects) */}
      {!showRemoteVideo && (
        <View style={styles.audioStage}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.status}>
            {status === "calling"
              ? "Calling…"
              : status === "connecting"
                ? "Connecting…"
                : status === "declined"
                  ? "Declined"
                  : status === "ended"
                    ? "Call ended"
                    : "In call"}
          </Text>
          {(status === "declined" || status === "ended") && (
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backBtnText}>Back</Text>
            </Pressable>
          )}
        </View>
      )}

      <View style={styles.controls}>
        <Pressable onPress={toggleMute} style={styles.controlBtn}>
          <Ionicons name={isMuted ? "mic-off" : "mic"} size={26} color="white" />
          <Text style={styles.controlLabel}>{isMuted ? "Unmute" : "Mute"}</Text>
        </Pressable>

        <Pressable onPress={endCall} style={[styles.controlBtn, styles.hangupBtn]}>
          <Ionicons name="call" size={26} color="white" />
          <Text style={styles.controlLabel}>End</Text>
        </Pressable>

        <Pressable onPress={() => setSpeaker(!isSpeakerOn)} style={styles.controlBtn}>
          <Ionicons name={isSpeakerOn ? "volume-high" : "volume-medium"} size={26} color="white" />
          <Text style={styles.controlLabel}>{isSpeakerOn ? "Speaker" : "Earpiece"}</Text>
        </Pressable>

        {isVideo === "true" && (
          <Pressable onPress={toggleVideo} style={styles.controlBtn}>
            <Ionicons name={isVideoEnabled ? "videocam" : "videocam-off"} size={26} color="white" />
            <Text style={styles.controlLabel}>{isVideoEnabled ? "Video" : "Video off"}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070A12",
  },
  remoteVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  localVideo: {
    position: "absolute",
    bottom: 120,
    right: 18,
    width: 120,
    height: 160,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.25)",
  },
  audioStage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "rgba(76,111,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  avatarText: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 1,
  },
  name: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  status: {
    marginTop: 6,
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "600",
  },
  backBtn: {
    marginTop: 16,
    paddingHorizontal: 18,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },
  controls: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 26,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    gap: 12,
  },
  controlBtn: {
    width: "48%",
    height: 64,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  hangupBtn: {
    backgroundColor: "#E5484D",
  },
  controlLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: "800",
  },
});