import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { useTheme } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppTheme } from '@/context/ThemeContext';
import { registerApi } from '@/services/auth.service';
import { Checkbox } from "expo-checkbox";
import * as Linking from 'expo-linking';
import { AxiosError } from 'axios';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
} from "react-native-reanimated";
import { KeyboardAvoidingView } from "react-native-keyboard-controller"


export default function RegisterScreen() {
    let { email } = useLocalSearchParams();
    email = typeof email === 'string' ? email : '';



    const openTerms = async () => {
        await Linking.openURL("https://policies.google.com/terms?hl=en");
    };

    const openUsagePolicy = async () => {
        await Linking.openURL("https://policies.google.com/privacy?hl=en");
    };

    const { accentColor } = useAppTheme();
    const { colors } = useTheme();
    const router = useRouter();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isTermsAccepted, setIsTermsAccepted] = useState(false);
    const [isUsagePolicyAccepted, setIsUsagePolicyAccepted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const opacity = useSharedValue(0);
    const translateY = useSharedValue(-10);

    useEffect(() => {
        if (error) {
            opacity.value = withTiming(1, { duration: 300 });
            translateY.value = withTiming(0, { duration: 300 });
        } else {
            opacity.value = withTiming(0, { duration: 200 });
            translateY.value = withTiming(-10, { duration: 200 });
        }
    }, [error, opacity, translateY]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [{ translateY: translateY.value }],
        };
    });


    const isDisabled =
        !firstName ||
        !lastName ||
        !email ||
        !password ||
        !confirmPassword ||
        password !== confirmPassword ||
        !isTermsAccepted ||
        !isUsagePolicyAccepted;

    const handleCreateAccount = async () => {
        if (isDisabled || isSubmitting) return;
        try {
            setIsSubmitting(true);
            await registerApi(
                email,
                password,
                firstName,
                lastName,
                isTermsAccepted,
                isUsagePolicyAccepted
            );
            router.push({ pathname: '/auth/verify-email', params: { email } });
        } catch (error) {
            if (error instanceof AxiosError) {
                if (error.response) {
                    setError(error.response.data?.detail || 'Registration failed');
                } else {
                    setError('Registration failed');
                }
            } else {
                setError('Registration failed');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior="padding" style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.title, { color: colors.text }]}>
                Create Account
            </Text>

            {/* BASIC INFO */}
            <Text style={[styles.sectionTitle, { color: accentColor }]}>
                Basic Info
            </Text>
            <TextInput
                placeholder="First Name"
                placeholderTextColor="#94A3B8"
                value={firstName}
                onChangeText={setFirstName}
                style={[styles.input, { borderColor: accentColor, color: colors.text }]}
            />
            <TextInput
                placeholder="Last Name"
                placeholderTextColor="#94A3B8"
                value={lastName}
                onChangeText={setLastName}
                style={[styles.input, { borderColor: accentColor, color: colors.text }]}
            />
            <TextInput
                editable={false}
                value={email}
                style={[styles.input, { borderColor: accentColor, color: '#94A3B8' }]}
            />

            {/* PASSWORD */}
            <Text style={[styles.sectionTitle, { color: accentColor }]}>
                Set Password
            </Text>
            <TextInput
                placeholder="Password"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
                style={[styles.input, { borderColor: accentColor, color: colors.text }]}
            />
            <TextInput
                placeholder="Confirm Password"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={[styles.input, { borderColor: accentColor, color: colors.text }]}
            />
            {!(password && confirmPassword) || password === confirmPassword ? null : (
                <Text style={{ color: 'red', marginBottom: 8 }}>
                    Passwords do not match
                </Text>
            )}

            {/* TERMS & USAGE POLICY */}
            <Pressable
                style={styles.checkboxRow}
                onPress={() => setIsTermsAccepted((prev) => !prev)}
            >
                <View style={styles.checkbox}>
                    <Checkbox
                        value={isTermsAccepted}
                        onValueChange={setIsTermsAccepted}
                        color={accentColor}
                    />
                </View>
                <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                    I accept the{" "}
                    <Text style={{ color: accentColor, textDecorationLine: "underline" }} onPress={openTerms}>
                        Terms & Conditions
                    </Text>
                </Text>
            </Pressable>

            <Pressable
                style={styles.checkboxRow}
                onPress={() => setIsUsagePolicyAccepted((prev) => !prev)}
            >
                <View style={styles.checkbox}>
                    <Checkbox
                        value={isUsagePolicyAccepted}
                        onValueChange={setIsUsagePolicyAccepted}
                        color={accentColor}
                    />
                </View>
                <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                    I accept the{" "}
                    <Text style={{ color: accentColor, textDecorationLine: "underline" }} onPress={openUsagePolicy}>
                        Usage Policy
                    </Text>
                </Text>
            </Pressable>

            {error && (
                <Text style={{ color: 'red', marginBottom: 8 }}>
                    <Animated.Text
                        style={[
                            {
                                color: "red",
                                marginBottom: 25,
                                textAlign: "center",
                            },
                            animatedStyle,
                        ]}
                    >
                        {error}
                    </Animated.Text>
                </Text>
            )}

            {/* CREATE ACCOUNT BUTTON */}
            <Pressable
                style={[
                    styles.button,
                    { backgroundColor: accentColor },
                ]}
                onPress={handleCreateAccount}
                disabled={isDisabled}
                android_ripple={{
                    color: 'rgba(0,0,0,0.1)',
                    borderless: false,
                    foreground: true,
                }}
            >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>
                    {isSubmitting ? 'Creating...' : 'Create Account'}
                </Text>
            </Pressable>
        </KeyboardAvoidingView>
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
        marginBottom: 24,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 18,
        marginVertical: 12,
    },
    input: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
    },
    button: {
        marginTop: 20,
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        overflow: 'hidden',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 6,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 1,
        marginRight: 8,
    },
    checkboxLabel: {
        flex: 1,
        fontSize: 14,
    },
});