import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING } from '../../constants';
import { BatchStatus } from '../../types';

import { Batch } from '../../types';

interface BatchStatusBadgeProps {
    status: BatchStatus | string;
    batch?: Batch;
    style?: ViewStyle;
}

const getStatusConfig = (status: string, batch?: Batch) => {
    // Check for derived statuses first (Real-time updates)
    if (batch) {
        const dispatched = batch.dispatchedBoxes || 0;
        const received = batch.receivedBoxes || 0;
        const inTransit = dispatched - received;

        // If items are dispatched but not yet received, show In Transit
        // This takes precedence over HARVEST_COMPLETED if there's active transit
        if (inTransit > 0 && (status === BatchStatus.HARVEST_COMPLETED || status === BatchStatus.DISPATCH_IN_PROGRESS)) {
            return {
                label: `In Transit${batch.dispatchedBoxes ? ` (${inTransit}/${batch.dispatchedBoxes})` : ''}`,
                color: COLORS.status.warning,
                bg: 'rgba(255, 152, 0, 0.1)' // Orange
            };
        }

        // If entirely received (no transit) and harvest completed
        if (status === BatchStatus.HARVEST_COMPLETED && dispatched > 0 && inTransit === 0) {
            return { label: 'Received', color: COLORS.status.success, bg: 'rgba(56, 142, 60, 0.1)' }; // Dark Green
        }
    }

    switch (status) {
        case BatchStatus.CREATED:
        case 'CREATED':
            return { label: 'Created', color: COLORS.status.info, bg: 'rgba(0, 229, 255, 0.1)' };
        case BatchStatus.HARVEST_IN_PROGRESS:
        case 'HARVEST_IN_PROGRESS':
        case 'IN_PROGRESS': // Legacy support
            return { label: 'Harvesting', color: COLORS.status.info, bg: 'rgba(33, 150, 243, 0.1)' }; // Blue
        case BatchStatus.HARVEST_COMPLETED:
        case 'HARVEST_COMPLETED':
            return { label: 'Harvest Completed', color: COLORS.primary.main, bg: 'rgba(156, 39, 176, 0.1)' }; // Purple
        case BatchStatus.DISPATCH_IN_PROGRESS:
        case 'DISPATCH_IN_PROGRESS':
            return { label: 'Dispatching', color: COLORS.status.warning, bg: 'rgba(255, 152, 0, 0.1)' }; // Orange
        case BatchStatus.DISPATCH_COMPLETED:
        case 'DISPATCH_COMPLETED':
        case 'COMPLETED': // Legacy support
            return { label: 'Completed', color: COLORS.status.success, bg: 'rgba(76, 175, 80, 0.1)' }; // Green
        case BatchStatus.CANCELLED:
        case 'CANCELLED':
            return { label: 'Cancelled', color: COLORS.status.error, bg: 'rgba(244, 67, 54, 0.1)' }; // Red
        default:
            return { label: status, color: COLORS.text.muted, bg: 'rgba(255, 255, 255, 0.05)' };
    }
};

export const BatchStatusBadge: React.FC<BatchStatusBadgeProps> = ({ status, batch, style }) => {
    const config = getStatusConfig(status, batch);

    return (
        <View style={[styles.badge, { backgroundColor: config.bg }, style]}>
            <Text style={[styles.text, { color: config.color }]}>
                {config.label}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4, // Slightly taller for better touch target/visibility
        borderRadius: BORDER_RADIUS.full,
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontSize: 10, // TYPOGRAPHY.sizes.xs is usually 12, slightly smaller for badge
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
