import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Pressable,
    ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuthStore } from "@/store/auth.store";
import { loginApi, getMeApi } from "@/services/auth.service";
import { AxiosError } from 'axios';


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

    const handleSendOtp = () => {
        if (!otpSent) {
            console.log('Send OTP to:', email);
            setOtpSent(true);
            setResendTimer(60);
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
            handleSendOtp();
        }
    };
    const setUser = useAuthStore((s) => s.setUser);

    const handleLogin = async () => {
        if (isDisabled) return;
        setLoading(true);

        try {
            await loginApi(email, password);
            const me = await getMeApi();
            setUser(me);
            router.replace('/(tabs)');
        } catch (error) {
            if (error instanceof AxiosError) {
                // Check if the response exists and has data (which usually has the error message)
                if (error.response) {
                    console.log('Status code:', error.response.status);
                    console.log('Error message:', error.response.data || error.response.statusText);
                    // Optionally, you can show the error in the UI
                } else {
                    console.log('No response received from the server');
                }
            } else {
                console.log('An unknown error occurred:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View
            style={[styles.container, { backgroundColor: colors.background }]}
        >
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

            <Pressable
                onPress={handleLogin}
                disabled={isDisabled}
                style={[
                    styles.button,
                    { backgroundColor: isDisabled ? '#CBD5E1' : accentColor },
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
                    <Text style={styles.buttonText}>Login</Text>
                }

            </Pressable>
        </View>
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