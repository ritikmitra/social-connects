import { VideoView, useVideoPlayer } from 'expo-video';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/context/ThemeContext';
import { useTheme } from '@react-navigation/native';

const videoSource =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

export default function SplashScreen() {
  const router = useRouter();
  const { accentColor } = useAppTheme();
    const { colors } = useTheme();

  // Initialize video player
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
    player.play();
    player.muted = true;
  });

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.overlay}>
        <Text style={[styles.logo, { color: accentColor }]}>
          YourApp
        </Text>

        <Text style={[styles.tagline, { color: colors.text }]}>
          Experience Something Beautiful
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: accentColor }]}
          onPress={() => router.replace('/auth/email')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 30,
    paddingBottom: 80,
  },
  logo: {
    fontSize: 42,
    fontWeight: 'bold',
  },
  tagline: {
    marginVertical: 12,
    fontSize: 16,
  },
  button: {
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});