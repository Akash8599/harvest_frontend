import React from 'react';
import { View, TextInput, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants';

interface GlassSearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    containerStyle?: ViewStyle;
    inputStyle?: TextStyle;
    iconColor?: string;
    placeholderTextColor?: string;
}

export const GlassSearchBar: React.FC<GlassSearchBarProps> = ({
    value,
    onChangeText,
    placeholder = 'Search...',
    containerStyle,
    inputStyle,
    iconColor = COLORS.text.muted,
    placeholderTextColor = COLORS.text.muted,
}) => {
    return (
        <View style={[styles.container, containerStyle]}>
            <Icon name="magnify" size={22} color={iconColor} style={styles.icon} />
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={placeholderTextColor}
                style={[styles.input, inputStyle]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        paddingHorizontal: 16,
        height: 50,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: TYPOGRAPHY.sizes.md,
        color: COLORS.text.primary,
        paddingVertical: SPACING.md,
    },
});
