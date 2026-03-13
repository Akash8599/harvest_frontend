import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Image, Alert } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../constants';

interface CameraComponentProps {
    onCapture?: (path: string) => void;
    onClose?: () => void;
}

export const CameraScreen: React.FC<CameraComponentProps> = ({ onCapture, onClose }) => {
    const navigation = useNavigation<any>();

    // Internal state
    const [isFrontCamera, setIsFrontCamera] = useState(false);
    const [flash, setFlash] = useState<'off' | 'on'>('off');
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [isTakingPhoto, setIsTakingPhoto] = useState(false);

    const device = useCameraDevice(isFrontCamera ? 'front' : 'back');
    const { hasPermission, requestPermission } = useCameraPermission();
    const camera = useRef<Camera>(null);

    // Reset state on mount (since it will be remounted when shown conditionally)
    React.useEffect(() => {
        setCapturedPhoto(null);
        setFlash('off');
    }, []);

    React.useEffect(() => {
        if (!hasPermission) {
            requestPermission();
        }
    }, [hasPermission]);

    const handleCapture = useCallback(async () => {
        if (camera.current && !isTakingPhoto) {
            setIsTakingPhoto(true);
            try {
                console.log('Taking photo...');
                const photo = await camera.current.takePhoto({
                    flash: flash,
                    enableShutterSound: false,
                    qualityPrioritization: 'balanced',
                });
                const path = `file://${photo.path}`;
                setCapturedPhoto(path);
            } catch (error: any) {
                console.error('Failed to take photo:', error);
                // Log more specific info if available
                if (error.code) console.log('Error code:', error.code);
                if (error.message) console.log('Error message:', error.message);

                Alert.alert('Capture Error', `Could not take photo: ${error.message || 'Unknown error'}`);
            } finally {
                setIsTakingPhoto(false);
            }
        }
    }, [flash, isTakingPhoto]);

    const handleConfirm = () => {
        if (capturedPhoto) {
            if (onCapture) {
                onCapture(capturedPhoto);
            } else {
                // Fallback to navigation if used as screen
                // @ts-ignore
                navigation.navigate('Inspections', { newPhoto: capturedPhoto });
            }
        }
    };

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            navigation.goBack();
        }
    };

    const handleRetake = () => {
        setCapturedPhoto(null);
    };

    if (!hasPermission) {
        return (
            <View style={styles.container}>
                <Text style={{ color: '#fff' }}>No Camera Permission</Text>
            </View>
        );
    }

    if (device == null) {
        return <View style={styles.container}><ActivityIndicator color={COLORS.primary.main} /></View>;
    }

    if (capturedPhoto) {
        return (
            <View style={styles.container}>
                <Image source={{ uri: capturedPhoto }} style={styles.previewImage} />
                <View style={styles.controlRow}>
                    <TouchableOpacity onPress={handleRetake} style={styles.actionButton}>
                        <Icon name="refresh" size={30} color="#fff" />
                        <Text style={styles.actionText}>Retake</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleConfirm} style={[styles.actionButton, { backgroundColor: COLORS.primary.main }]}>
                        <Icon name="check" size={30} color="#000" />
                        <Text style={[styles.actionText, { color: '#000' }]}>Use Photo</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Camera
                ref={camera}
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={true}
                photo={true}
            />

            {/* Top Controls */}
            <View style={styles.topControls}>
                <TouchableOpacity onPress={handleClose} style={styles.iconButton}>
                    <Icon name="close" size={28} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setFlash(f => f === 'off' ? 'on' : 'off')} style={styles.iconButton}>
                    <Icon name={flash === 'on' ? "flash" : "flash-off"} size={28} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                    onPress={handleCapture}
                    style={[styles.captureButton, isTakingPhoto && { opacity: 0.5 }]}
                    disabled={isTakingPhoto}
                >
                    {isTakingPhoto ? (
                        <ActivityIndicator color="#fff" size="large" />
                    ) : (
                        <View style={styles.captureInner} />
                    )}
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => setIsFrontCamera(prev => !prev)} style={styles.iconButton}>
                        <Icon name="camera-flip" size={28} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    previewImage: {
        flex: 1,
        resizeMode: 'contain',
    },
    topControls: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        zIndex: 10,
    },
    bottomControls: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 30,
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    captureInner: {
        width: 66,
        height: 66,
        borderRadius: 33,
        backgroundColor: '#fff',
    },
    iconButton: {
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 25,
    },
    controlRow: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 120,
        backgroundColor: 'rgba(0,0,0,0.8)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: 20,
    },
    actionButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 30,
    },
    actionText: {
        color: '#fff',
        marginTop: 5,
        fontWeight: '600',
    },
});
