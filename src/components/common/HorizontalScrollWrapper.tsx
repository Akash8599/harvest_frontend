/**
 * HorizontalScrollWrapper
 *
 * A reusable, centralized horizontal scroll container.
 * Supports static children (ScrollView mode) and dynamic data lists (FlatList mode).
 *
 * Usage — static children:
 *   <HorizontalScrollWrapper>
 *     <Chip /><Chip /><Chip />
 *   </HorizontalScrollWrapper>
 *
 * Usage — dynamic list (FlatList mode):
 *   <HorizontalScrollWrapper
 *     data={items}
 *     keyExtractor={(item) => item.id}
 *     renderItem={({ item }) => <Card item={item} />}
 *   />
 */

import React, { useRef } from 'react';
import {
    ScrollView,
    FlatList,
    View,
    StyleSheet,
    StyleProp,
    ViewStyle,
    ListRenderItem,
    FlatListProps,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BaseProps {
    /** Extra style applied to the outer container View */
    containerStyle?: StyleProp<ViewStyle>;
    /** Content container style (padding inside the scroll area) */
    contentStyle?: StyleProp<ViewStyle>;
    /** Horizontal padding on each side of the scroll content. Default: 16 */
    horizontalPadding?: number;
    /** Gap between items (only used in FlatList mode via ItemSeparatorComponent). Default: 10 */
    itemGap?: number;
    /** Show horizontal scroll indicator. Default: false */
    showScrollIndicator?: boolean;
    /** Enable iOS-style snap-to-alignment. Default: false */
    snapEnabled?: boolean;
    /** Width to snap to (used when snapEnabled=true). E.g. card width + gap. */
    snapInterval?: number;
    /** Deceleration rate. 'fast' feels native, 'normal' is looser. Default: 'fast' */
    decelerationRate?: 'fast' | 'normal';
    /** Called whenever the scroll position changes */
    onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
    /** Fires once scrolling stops after momentum ends */
    onMomentumScrollEnd?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

/** ScrollView mode — wrap arbitrary children */
interface ChildrenProps extends BaseProps {
    children: React.ReactNode;
    data?: never;
    renderItem?: never;
    keyExtractor?: never;
}

/** FlatList mode — data-driven list */
interface ListProps<T> extends BaseProps {
    children?: never;
    data: T[];
    renderItem: ListRenderItem<T>;
    keyExtractor: (item: T, index: number) => string;
    /** Extra FlatList props (e.g. initialScrollIndex, getItemLayout) */
    flatListProps?: Partial<FlatListProps<T>>;
    /** Component to render when list is empty */
    EmptyComponent?: React.ReactNode;
}

type HorizontalScrollWrapperProps<T = any> = ChildrenProps | ListProps<T>;

// ─── Component ────────────────────────────────────────────────────────────────

function HorizontalScrollWrapperInner<T = any>(
    props: HorizontalScrollWrapperProps<T>,
) {
    const {
        containerStyle,
        contentStyle,
        horizontalPadding = 16,
        itemGap = 10,
        showScrollIndicator = false,
        snapEnabled = false,
        snapInterval,
        decelerationRate = 'fast',
        onScroll,
        onMomentumScrollEnd,
    } = props;

    const scrollRef = useRef<ScrollView>(null);

    // ── FlatList mode ──────────────────────────────────────────────────────────
    if ('data' in props && props.data !== undefined) {
        const { data, renderItem, keyExtractor, flatListProps, EmptyComponent } = props as ListProps<T>;

        return (
            <View style={[styles.container, containerStyle]}>
                <FlatList
                    horizontal
                    data={data}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    showsHorizontalScrollIndicator={showScrollIndicator}
                    contentContainerStyle={[
                        {
                            paddingHorizontal: horizontalPadding,
                            alignItems: 'center',
                        },
                        contentStyle,
                    ]}
                    // Snap
                    {...(snapEnabled && snapInterval
                        ? {
                            snapToInterval: snapInterval,
                            snapToAlignment: 'start',
                            decelerationRate,
                        }
                        : {})}
                    ItemSeparatorComponent={() => <View style={{ width: itemGap }} />}
                    onScroll={onScroll}
                    scrollEventThrottle={16}
                    onMomentumScrollEnd={onMomentumScrollEnd}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={EmptyComponent ? <View style={{ paddingHorizontal: horizontalPadding }}>{EmptyComponent}</View> : null}
                    {...flatListProps}
                />
            </View>
        );
    }

    // ── ScrollView mode (static children) ─────────────────────────────────────
    const { children } = props as ChildrenProps;

    return (
        <View style={[styles.container, containerStyle]}>
            <ScrollView
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={showScrollIndicator}
                contentContainerStyle={[
                    {
                        paddingHorizontal: horizontalPadding,
                        alignItems: 'center',
                    },
                    contentStyle,
                ]}
                // Snap
                {...(snapEnabled && snapInterval
                    ? {
                        snapToInterval: snapInterval,
                        snapToAlignment: 'start',
                        decelerationRate,
                    }
                    : {})}
                onScroll={onScroll}
                scrollEventThrottle={16}
                onMomentumScrollEnd={onMomentumScrollEnd}
                keyboardShouldPersistTaps="handled"
                // Bounce feels premium on iOS
                bounces
            >
                {children}
            </ScrollView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        width: '100%',
        flexGrow: 0,
    },
});

// ─── Export ───────────────────────────────────────────────────────────────────

export const HorizontalScrollWrapper = HorizontalScrollWrapperInner as <T = any>(
    props: HorizontalScrollWrapperProps<T>,
) => React.ReactElement;
