import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/context/ThemeContext';
import { useTheme } from '@react-navigation/native';

export default function EmailScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const { accentColor } = useAppTheme();


    const handleContinue = async () => {
        const exists = email.includes('46'); // Replace with API
        if (exists) {
            router.push({ pathname: '/auth/login', params: { email } });
        } else {
            router.push({ pathname: '/auth/register', params: { email } });
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.title, { color: colors.text }]}>
                Welcome 👋
            </Text>

            <TextInput
                placeholder="Enter your email"
                placeholderTextColor="#94A3B8"
                value={email}
                autoCapitalize="none"
                onChangeText={setEmail}
                style={[
                    styles.input,
                    { borderColor: accentColor, color: colors.text },
                ]}
            />
            <Pressable onPress={handleContinue}
                android_ripple={{
                    color: 'rgba(0,0,0,0.1)',
                    borderless: false,
                    foreground: true,
                }}
                style={{ borderRadius: 14, overflow: 'hidden' }}
            >
                <LinearGradient
                    colors={[accentColor, '#7C3AED']}
                    style={styles.button}
                >
                    <Text style={styles.buttonText}>Continue</Text>
                </LinearGradient>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    title: {
        fontSize: 28,
        marginBottom: 24,
        fontWeight: 'bold',
    },
    input: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 16,
        marginBottom: 20,
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