import { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppTheme } from '@/context/ThemeContext';
import { resendEmailVerificationApi, verifyEmailApi } from '@/services/auth.service';
import { AxiosError } from 'axios';

export default function VerifyEmailScreen() {
    const { colors } = useTheme();
    const { accentColor } = useAppTheme();
    const router = useRouter();
    let { email } = useLocalSearchParams();
    email = typeof email === 'string' ? email : '';

    const RESEND_COOLDOWN_SECONDS = 30;

    const [otp, setOtp] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);

    const isDisabled = !email || otp.length !== 6 || isSubmitting;

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const id = setInterval(() => {
            setResendCooldown((s) => (s <= 1 ? 0 : s - 1));
        }, 1000);
        return () => clearInterval(id);
    }, [resendCooldown]);

    const formatCooldown = (seconds: number) => {
        const mm = Math.floor(seconds / 60);
        const ss = seconds % 60;
        return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    };

    const handleVerify = async () => {
        if (isDisabled) return;
        try {
            setIsSubmitting(true);
            setError(null);
            setInfo(null);
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

    const handleResendOtp = async () => {
        if (!email || isResending || resendCooldown > 0) return;
        try {
            setIsResending(true);
            setError(null);
            setInfo(null);
            await resendEmailVerificationApi(email);
            setInfo('Code resent. Please check your email.');
            setResendCooldown(RESEND_COOLDOWN_SECONDS);
        } catch (err) {
            if (err instanceof AxiosError) {
                if (err.response) {
                    setError(err.response.data?.detail || 'Failed to resend code');
                } else {
                    setError('Failed to resend code');
                }
            } else {
                setError('Failed to resend code');
            }
        } finally {
            setIsResending(false);
        }
    };

    let resendText;

    if (isResending) {
        resendText = "Sending...";
    } else if (resendCooldown > 0) {
        resendText = `Resend in ${formatCooldown(resendCooldown)}`;
    } else {
        resendText = "Resend code";
    }

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

            {info ? (
                <Text style={styles.infoText}>
                    {info}
                </Text>
            ) : null}

            {error ? (
                <Text style={styles.errorText}>
                    {error}
                </Text>
            ) : null}

            <View style={styles.resendRow}>
                <Text style={[styles.resendHint, { color: colors.text }]}>
                    Didn&apos;t get the code?
                </Text>
                <Pressable
                    onPress={handleResendOtp}
                    disabled={!email || isResending || resendCooldown > 0}
                    hitSlop={10}
                >
                    <Text
                        style={[
                            styles.resendLink,
                            { color: accentColor },
                            (!email || isResending || resendCooldown > 0) ? styles.resendLinkDisabled : null,
                        ]}
                    >
                        {resendText}
                    </Text>
                </Pressable>
            </View>

            <Pressable
                style={[
                    styles.button,
                    { backgroundColor: accentColor },
                    isDisabled ? styles.buttonDisabled : null,
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
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    resendRow: {
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        flexWrap: 'wrap',
    },
    resendHint: {
        fontSize: 13,
        opacity: 0.8,
    },
    resendLink: {
        fontSize: 13,
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
    resendLinkDisabled: {
        opacity: 0.55,
        textDecorationLine: 'none',
    },
    errorText: {
        color: 'red',
        marginTop: 4,
        marginBottom: 4,
        textAlign: 'center',
    },
    infoText: {
        color: '#16A34A',
        marginTop: 4,
        marginBottom: 4,
        textAlign: 'center',
    },
});

