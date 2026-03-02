import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppTheme } from '@/context/ThemeContext';
import { verifyEmailApi } from '@/services/auth.service';
import { AxiosError } from 'axios';

export default function VerifyEmailScreen() {
    const { colors } = useTheme();
    const { accentColor } = useAppTheme();
    const router = useRouter();
    let { email } = useLocalSearchParams();
    email = typeof email === 'string' ? email : '';

    const [otp, setOtp] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isDisabled = !email || otp.length !== 6 || isSubmitting;

    const handleVerify = async () => {
        if (isDisabled) return;
        try {
            setIsSubmitting(true);
            setError(null);
            await verifyEmailApi(email, otp);
            // After successful verification you can route to login or home.
            router.replace({ pathname: '/auth/login', params: { email } });
        } catch (err) {
            if (err instanceof AxiosError) {
                if (err.response) {
                    setError(err.response.data?.detail || 'Verification failed');
                } else {
                    setError('Verification failed');
                }
            } else {
                setError('Verification failed');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.title, { color: colors.text }]}>
                Verify your email
            </Text>
            <Text style={[styles.subtitle, { color: colors.text }]}>
                We&apos;ve sent a 6-digit code to{` `}
                <Text style={{ fontWeight: '600' }}>{email}</Text>
            </Text>

            <TextInput
                placeholder="Enter 6-digit code"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
                style={[styles.input, { borderColor: accentColor, color: colors.text }]}
            />

            {error ? (
                <Text style={styles.errorText}>
                    {error}
                </Text>
            ) : null}

            <Pressable
                style={[
                    styles.button,
                    { backgroundColor: accentColor },
                ]}
                onPress={handleVerify}
                disabled={isDisabled}
                android_ripple={{
                    color: 'rgba(0,0,0,0.1)',
                    borderless: false,
                    foreground: true,
                }}
            >
                <Text style={styles.buttonText}>
                    {isSubmitting ? 'Verifying...' : 'Verify Email'}
                </Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    title: {
        fontSize: 26,
        marginBottom: 12,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 24,
    },
    input: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        letterSpacing: 4,
        textAlign: 'center',
        fontSize: 18,
    },
    button: {
        marginTop: 16,
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        overflow: 'hidden',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    errorText: {
        color: 'red',
        marginTop: 4,
        marginBottom: 4,
        textAlign: 'center',
    },
});

