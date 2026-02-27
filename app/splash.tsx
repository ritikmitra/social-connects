import { useAppTheme } from '@/context/ThemeContext';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import LottieView from "lottie-react-native";
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function SplashScreen() {
    const router = useRouter();
    const { accentColor } = useAppTheme();
    const { colors } = useTheme();

    return (
        <View style={styles.container}>
            {/* Background Lottie Animation */}
            <LottieView
                source={require("../assets/animations/splashscreen.json")}
                style={styles.backgroundAnimation}
                autoPlay
                loop
            />

            {/* Overlay content */}
            <View style={styles.overlay}>
                <View style={styles.textContainer}>
                    <Text style={[styles.logo, { color: accentColor }]}>
                        Connects
                    </Text>

                    <Text style={[styles.tagline, { color: colors.text }]}>
                        Chat with your friends, anytime, anywhere.
                    </Text>
                </View>

                <Pressable
                    style={[styles.button, { backgroundColor: accentColor }]}
                    onPress={() => router.replace('/auth/email')}
                    android_ripple={{
                        color: 'rgba(0,0,0,0.1)',
                        borderless: false,
                        foreground: true,
                    }}
                >
                    <Text style={styles.buttonText}>Get Started</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Lottie animation fills the background
    backgroundAnimation: {
        ...StyleSheet.absoluteFillObject,
    },

    overlay: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingVertical: 60,
    },

    textContainer: {
        marginTop: 20,
        alignItems: 'center',
    },

    logo: {
        fontSize: 42,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },

    tagline: {
        fontSize: 16,
        textAlign: 'center',
    },

    button: {
        overflow: 'hidden',
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 14,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },

    buttonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
});