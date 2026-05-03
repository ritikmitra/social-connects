import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

type Props = {
  visible: boolean;
  callerName: string;
  isVideo: boolean;
  onAccept: () => void;
  onReject: () => void;
};

export default function IncomingCallSheet({
  visible,
  callerName,
  isVideo,
  onAccept,
  onReject,
}: Props) {
  const initials = useMemo(() => {
    const parts = callerName.split(" ").filter(Boolean);
    const a = parts[0]?.[0] ?? "U";
    const b = parts[1]?.[0] ?? "";
    return `${a}${b}`.toUpperCase();
  }, [callerName]);

  const trackWidth = 320;
  const knobSize = 56;
  const padding = 8;
  const maxX = trackWidth - knobSize - padding * 2;

  const x = useSharedValue(0);

  const pan = Gesture.Pan()
    .onChange((e) => {
      const next = Math.max(0, Math.min(maxX, x.value + e.changeX));
      x.value = next;
    })
    .onEnd(() => {
      const accepted = x.value > maxX * 0.7;
      if (accepted) {
        x.value = withSpring(maxX);
        runOnJS(onAccept)();
      } else {
        x.value = withSpring(0);
      }
    });

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  const hintStyle = useAnimatedStyle(() => {
    const opacity = interpolate(x.value, [0, maxX * 0.4], [1, 0], Extrapolation.CLAMP);
    return { opacity };
  });

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.card}>
        <Text style={styles.title}>Incoming call</Text>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {callerName}
        </Text>
        <Text style={styles.sub}>{isVideo ? "Video call" : "Voice call"}</Text>

        <View style={styles.row}>
          <Pressable onPress={onReject} style={[styles.actionBtn, styles.rejectBtn]}>
            <Ionicons name="call" size={22} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
            <Text style={styles.actionText}>Reject</Text>
          </Pressable>
          <Pressable onPress={onAccept} style={[styles.actionBtn, styles.acceptBtn]}>
            <Ionicons name="call" size={22} color="#fff" />
            <Text style={styles.actionText}>Accept</Text>
          </Pressable>
        </View>

        <View style={styles.sliderWrap}>
          <View style={[styles.track, { width: trackWidth }]}>
            <Animated.Text style={[styles.slideHint, hintStyle]}>Slide to answer</Animated.Text>
            <GestureDetector gesture={pan}>
              <Animated.View style={[styles.knob, { width: knobSize, height: knobSize }, knobStyle]}>
                <Ionicons name="chevron-forward" size={22} color="#111" />
              </Animated.View>
            </GestureDetector>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
    zIndex: 9999,
  },
  card: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: "#121212",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  title: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 14,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignSelf: "center",
    backgroundColor: "rgba(76,111,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 1,
  },
  name: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  sub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  rejectBtn: { backgroundColor: "#E5484D" },
  acceptBtn: { backgroundColor: "#2ECC71" },
  actionText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  sliderWrap: {
    marginTop: 14,
    alignItems: "center",
  },
  track: {
    height: 72,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.16)",
    justifyContent: "center",
    paddingHorizontal: 8,
    overflow: "hidden",
  },
  slideHint: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  knob: {
    position: "absolute",
    left: 8,
    top: 8,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});

