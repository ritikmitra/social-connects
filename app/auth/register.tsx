import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { useState } from 'react';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/context/ThemeContext';

export default function RegisterScreen() {
    const { accentColor } = useAppTheme();
    const { colors } = useTheme();
    const router = useRouter();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const isDisabled =
        !fullName || !email || !password || !confirmPassword || password !== confirmPassword;

    const handleCreateAccount = () => {
        if (isDisabled) return;
        // TODO: Add registration logic here
        router.replace('/(tabs)');
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.title, { color: colors.text }]}>
                Create Account
            </Text>

            {/* BASIC INFO */}
            <Text style={[styles.sectionTitle, { color: accentColor }]}>
                Basic Info
            </Text>
            <TextInput
                placeholder="Full Name"
                placeholderTextColor="#94A3B8"
                value={fullName}
                onChangeText={setFullName}
                style={[styles.input, { borderColor: accentColor, color: colors.text }]}
            />
            <TextInput
                placeholder="Email"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                style={[styles.input, { borderColor: accentColor, color: colors.text }]}
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
                secureTextEntry
                autoCapitalize="none"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={[styles.input, { borderColor: accentColor, color: colors.text }]}
            />
            {password && confirmPassword && password !== confirmPassword && (
                <Text style={{ color: 'red', marginBottom: 8 }}>
                    Passwords do not match
                </Text>
            )}

            {/* CREATE ACCOUNT BUTTON */}
            <Pressable
                style={[
                    styles.button,
                    { backgroundColor: isDisabled ? '#CBD5E1' : accentColor },
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
                    Create Account
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
});