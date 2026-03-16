import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Pressable,
    ActivityIndicator,
    Animated
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuthStore } from "@/store/auth.store";
import { loginApi, getMeApi, requestOtp, verifyOtp } from "@/services/auth.service";
import { AxiosError } from 'axios';
import { KeyboardAvoidingView } from "react-native-keyboard-controller"


export default function LoginScreen() {
    const { colors } = useTheme();
    const { accentColor } = useAppTheme();
    let { email } = useLocalSearchParams();
    email = typeof email === 'string' ? email : '';
    const router = useRouter();

    const [mode, setMode] = useState<'password' | 'otp'>('password');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(-10)).current;
    const value = mode === 'password' ? password : otp;
    const isDisabled = value.length === 0;

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (resendTimer > 0) {
            timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [resendTimer]);

    useEffect(() => {
        if (value.length > 0) {
            setError(null);
        }
    }, [value]);


    useEffect(() => {
        if (error) {
            fadeAnim.setValue(0);
            slideAnim.setValue(-10);

            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [error, fadeAnim, slideAnim]);


    const handleSendOtp = async () => {
        if (!otpSent) {
            try {
                await requestOtp(email);
                setOtpSent(true);
                setResendTimer(60);
            } catch (error) {
                if (error instanceof AxiosError) {
                    if (error.response) {
                        console.log('Error message:', error.response.data || error.response.statusText);
                        setError(error.response.data?.detail || 'Failed to send OTP');
                    } else {
                        console.log('No response received from the server');
                    }
                } else {
                    console.log('An unknown error occurred:', error);
                    setError('Failed to send OTP');
                }
            }
        }
    };

    const handleSwitchMode = (newMode: 'password' | 'otp') => {
        setMode(newMode);
        if (newMode === 'otp') {
            handleSendOtp();
        }
    };

    const handleResendOtp = () => {
        if (resendTimer === 0) {
            setOtpSent(false);
            handleSendOtp();
        }
    };
    const setUser = useAuthStore((s) => s.setUser);

    const handleLogin = async () => {
        if (isDisabled) return;

        setLoading(true);
        setError(null);

        try {
            if (mode === 'otp') {
                const res = await verifyOtp(email, otp);

                if (!res.success) {
                    setError(res.message || 'Invalid or expired OTP');
                }
            } else {
                await loginApi(email, password);
            }

            const me = await getMeApi();
            setUser(me);
            router.replace('/(tabs)');

        } catch (error) {
            if (error instanceof AxiosError) {
                if (error.response) {
                    console.log('Error message:', error.response.data || error.response.statusText);
                    setError(error.response.data?.detail || 'Login failed');
                } else {
                    console.log('No response received from the server');
                    setError('Network error');
                }
            } else {
                console.log('Unknown error:', error);
                setError('Something went wrong');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior="padding" style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>
                    Welcome Back
                </Text>
                <Text style={[styles.subtitle, { color: '#94A3B8' }]}>
                    {email}
                </Text>
            </View>

            <View
                style={[
                    styles.card,
                    { backgroundColor: colors.card, borderColor: colors.border },
                ]}
            >
                <Text style={[styles.label, { color: colors.text }]}>
                    {mode === 'password' ? 'Password' : 'One-Time Password'}
                </Text>

                <TextInput
                    placeholder={
                        mode === 'password'
                            ? 'Enter your password'
                            : 'Enter 6-digit code'
                    }
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={mode === 'password'}
                    keyboardType={mode === 'otp' ? 'number-pad' : 'default'}
                    maxLength={mode === 'otp' ? 6 : undefined}
                    autoCapitalize="none"
                    value={value}
                    editable={!loading}
                    onChangeText={
                        mode === 'password' ? setPassword : setOtp
                    }
                    style={[
                        styles.input,
                        {
                            borderColor: accentColor,
                            color: colors.text,
                        },
                    ]}
                />

                {/* OTP mode: show resend timer */}
                {mode === 'otp' && (
                    <Pressable
                        onPress={handleResendOtp}
                        disabled={resendTimer > 0}
                    >
                        <Text
                            style={[
                                styles.switchText,
                                { color: resendTimer > 0 ? '#94A3B8' : accentColor },
                            ]}
                        >
                            {resendTimer > 0
                                ? `Resend OTP in ${resendTimer}s`
                                : 'Resend OTP'}
                        </Text>
                    </Pressable>
                )}

                {/* Switch mode */}
                <Pressable
                    onPress={() =>
                        handleSwitchMode(mode === 'password' ? 'otp' : 'password')
                    }
                >
                    <Text style={[styles.switchText, { color: accentColor }]}>
                        {mode === 'password'
                            ? 'Use OTP instead'
                            : 'Use password instead'}
                    </Text>
                </Pressable>
            </View>

            {error && (
                <Animated.Text
                    style={{
                        color: 'red',
                        marginBottom: 25,
                        textAlign: 'center',
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    }}
                >
                    {error}
                </Animated.Text>
            )}

            <Pressable
                onPress={handleLogin}
                disabled={isDisabled || loading}
                style={[
                    styles.button,
                    { backgroundColor: accentColor },
                ]}
                android_ripple={{
                    color: 'rgba(0,0,0,0.1)',
                    borderless: false,
                    foreground: true,
                }}
            >
                {loading ?
                    <ActivityIndicator size='small' color="white" animating={loading} />
                    :
                    <Text style={styles.buttonText}>{mode === 'password' ? 'Login' : 'Verify OTP'}</Text>
                }

            </Pressable>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24, justifyContent: 'center' },
    header: { marginBottom: 40 },
    title: { fontSize: 28, fontWeight: '700', marginBottom: 6 },
    subtitle: { fontSize: 14 },
    card: { borderWidth: 1, borderRadius: 18, padding: 20, marginBottom: 24 },
    label: { fontSize: 14, marginBottom: 8, fontWeight: '600' },
    input: { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 12 },
    switchText: { fontSize: 14, fontWeight: '600', marginTop: 4 },
    button: { padding: 18, borderRadius: 16, alignItems: 'center', overflow: 'hidden' },
    buttonText: { color: 'white', fontWeight: '700', fontSize: 16 },
});