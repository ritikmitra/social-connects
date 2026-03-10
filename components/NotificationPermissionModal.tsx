import React from "react";
import { Modal, View, Text, Button, StyleSheet } from "react-native";

interface Props {
    visible: boolean;
    onEnable: () => void;
    onClose: () => void;
}

export default function NotificationPermissionModal({
    visible,
    onEnable,
    onClose,
}: Props) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.container}>
                <View style={styles.box}>
                    <Text style={styles.title}>🔔 Enable Notifications</Text>
                    <Text style={styles.desc}>
                        Stay updated with important alerts and updates.
                    </Text>

                    <Button title="Enable Notifications" onPress={onEnable} />
                    <Button title="Maybe Later" onPress={onClose} />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        backgroundColor: "#00000080",
    },
    box: {
        margin: 24,
        padding: 24,
        backgroundColor: "white",
        borderRadius: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: "600",
    },
    desc: {
        marginVertical: 10,
    },
});