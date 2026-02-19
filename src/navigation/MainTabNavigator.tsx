import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types';
import { COLORS, SPACING } from '../constants';

// Screens
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { FarmsScreen } from '../screens/farms/FarmsScreen';
import { BatchesScreen } from '../screens/batches/BatchesScreen';
import { InventoryScreen } from '../screens/inventory/InventoryScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { InspectionsScreen } from '../screens/inspections/InspectionsScreen';
import { HarvestScreen } from '../screens/harvest/HarvestScreen';
import { GatePassScreen } from '../screens/harvest/GatePassScreen';
import { LedgerScreen } from '../screens/ledger/LedgerScreen';
import { SalesScreen } from '../screens/sales/SalesScreen';

export type MainTabParamList = {
  Dashboard: undefined;
  Farms: undefined;
  Batches: undefined;
  Inventory: undefined;
  Profile: undefined;
  Inspections: undefined;
  Harvest: undefined;
  GatePass: undefined;
  Ledger: undefined;
  Sales: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

interface TabItem {
  name: keyof MainTabParamList;
  icon: string;
  label: string;
  roles: UserRole[];
}

const TAB_ITEMS: TabItem[] = [
  { name: 'Dashboard', icon: 'view-dashboard', label: 'Dashboard', roles: [UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.VENDOR, UserRole.STORE_KEEPER] },
  { name: 'Farms', icon: 'map-marker', label: 'Farms', roles: [UserRole.SUPER_ADMIN, UserRole.MANAGER] },
  { name: 'Inspections', icon: 'camera', label: 'Inspections', roles: [UserRole.VENDOR, UserRole.SUPER_ADMIN, UserRole.MANAGER] },
  { name: 'Batches', icon: 'package-variant', label: 'Batches', roles: [UserRole.SUPER_ADMIN, UserRole.MANAGER] },
  { name: 'Harvest', icon: 'basket', label: 'Harvest', roles: [UserRole.VENDOR] },
  { name: 'GatePass', icon: 'truck-delivery', label: 'Gate Pass', roles: [UserRole.VENDOR, UserRole.STORE_KEEPER] },
  { name: 'Inventory', icon: 'warehouse', label: 'Inventory', roles: [UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.STORE_KEEPER] },
  { name: 'Sales', icon: 'cash-register', label: 'Sales', roles: [UserRole.SUPER_ADMIN, UserRole.MANAGER] },
  { name: 'Ledger', icon: 'book-open', label: 'Ledger', roles: [UserRole.VENDOR] },
  { name: 'Profile', icon: 'account', label: 'Profile', roles: [UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.VENDOR, UserRole.STORE_KEEPER] },
];

import { farmApi } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { Batch, BatchStatus } from '../types';

// ... (existing imports)

interface TabItem {
  name: keyof MainTabParamList;
  icon: string;
  label: string;
  roles: UserRole[];
  badgeCount?: number; // Add badge property
}

// ... (TAB_ITEMS definition remains)

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface TabButtonProps {
  route: any;
  descriptors: any;
  state: any;
  navigation: any;
  index: number;
  tabItem: any;
  badgeCount?: number;
}

const TabButton: React.FC<TabButtonProps> = ({ route, state, navigation, index, tabItem, badgeCount }) => {
  const isFocused = state.index === index;

  const onPress = () => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(isFocused ? 1.1 : 1, { damping: 15, stiffness: 300 }) },
    ],
  }));

  const iconColor = isFocused ? COLORS.primary.main : COLORS.text.muted;

  return (
    <AnimatedTouchable
      onPress={onPress}
      style={[
        styles.tabItem,
        animatedStyle,
        isFocused ? styles.tabItemFocused : null
      ]}
    >
      <View>
        <Icon
          name={tabItem.icon}
          size={24}
          color={iconColor}
        />
        {badgeCount ? (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>
              {badgeCount > 99 ? '99+' : badgeCount}
            </Text>
          </View>
        ) : null}
      </View>

      <Animated.Text
        style={[
          styles.tabLabel,
          { color: iconColor },
        ]}
        numberOfLines={1}
      >
        {tabItem.label}
      </Animated.Text>

      {isFocused && <View style={styles.activeIndicator} />}
    </AnimatedTouchable>
  );
};

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const { user } = useAuthStore();
  const userRole = user?.role;

  // --- Data Fetching for Badges ---

  // 1. Batches (For Harvest & GatePass)
  const { data: batches = [] } = useQuery({
    queryKey: ['allBatches'], // Shared query key
    queryFn: async () => {
      const response = await farmApi.getAllBatches();
      return response.data.data;
    },
    enabled: !!user,
    staleTime: 1000 * 60, // 1 minute stale time to reduce requests
  });

  // 2. Inspections (For Inspections tab)
  const { data: myRequests = [] } = useQuery({
    queryKey: ['myInspectionRequests'],
    queryFn: async () => {
      if (userRole !== UserRole.VENDOR) return [];
      const response = await farmApi.getMyInspectionRequests(); // Fetch all, matching screen logic
      return response.data.data;
    },
    enabled: userRole === UserRole.VENDOR,
  });

  const { data: pendingInspections = [] } = useQuery({
    queryKey: ['pendingInspections'],
    queryFn: async () => {
      if (userRole === UserRole.VENDOR) return [];
      const response = await farmApi.getPendingInspections();
      return response.data.data;
    },
    enabled: userRole === UserRole.SUPER_ADMIN || userRole === UserRole.MANAGER,
  });

  // 3. Farms (For Farms tab badge)
  const { data: farms = [] } = useQuery({
    queryKey: ['farms'],
    queryFn: async () => {
      if (userRole === UserRole.VENDOR) return [];
      const response = await farmApi.getAllFarms();
      return response.data.data;
    },
    enabled: userRole === UserRole.SUPER_ADMIN || userRole === UserRole.MANAGER,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });


  // --- Compute Counts ---

  /* DEBUG LOGGING */
  // console.log('CustomTabBar Render', { userRole, batches: batches.length });

  const getBadgeCount = (tabName: string): number => {
    let count = 0;

    // Farms: Show total count of farms
    if (tabName === 'Farms') {
      return farms.length;
    }

    // Harvest: Show pending harvest batches for everyone (Vendor sees theirs, Admin sees all)
    if (tabName === 'Harvest') {
      count = batches.filter((b: Batch) =>
        b.status === BatchStatus.CREATED || b.status === BatchStatus.HARVEST_IN_PROGRESS
      ).length;
    }

    // Gate Pass: Show pending dispatch batches for everyone
    if (tabName === 'GatePass') {
      count = batches.filter((b: Batch) =>
        b.status !== BatchStatus.DISPATCH_COMPLETED && 
        b.status !== BatchStatus.IN_TRANSIT && 
        b.status !== BatchStatus.DELIVERED && 
        b.status !== BatchStatus.CANCELLED
      ).length;
    }

    // Batches: Show total active batches (same as "Active" tab in BatchesScreen)
    if (tabName === 'Batches') {
      count = batches.filter((b: Batch) =>
        b.status === BatchStatus.CREATED ||

        b.status === BatchStatus.HARVEST_IN_PROGRESS ||
        b.status === BatchStatus.HARVEST_COMPLETED ||
        b.status === BatchStatus.DISPATCH_IN_PROGRESS
      ).length;
    }

    if (tabName === 'Inspections') {
      if (userRole === UserRole.VENDOR) {
        // Vendor Badge = Actionable Requests + Pending My Inspections
        const actionableStatuses = ['PENDING', 'ASSIGNED', 'REQUESTED', 'IN_PROGRESS'];

        // Count actionable requests (not yet fulfilled)
        const actionableRequestsCount = myRequests.filter((req: any) =>
          actionableStatuses.includes(req.status)
        ).length; // Note: In tab bar we might not have 'myInspections' to cross-reference fulfilled ones easily without another query.
        // Ideally we should cross-reference, but for now let's assume 'myInspectionRequests' returns what is needed, or just count them.
        // Actually, 'myRequests' comes from 'myInspectionRequests' which we switched to fetch ALL in the screen.
        // But here it uses 'PENDING' in the queryFn below! We need to fix the queryFn here too.

        // We'll update the query parameters in the useQuery hook next.

        // For now, let's assume myRequests contains the relevant list.
        count = actionableRequestsCount;

        // We also need to add "In Review" inspections if we had access to them here. 
        // The current implementation of MainTabNavigator doesn't fetch 'myInspections' (history), only 'myInspectionRequests'.
        // To be accurate, we should probably just show actionable requests count as the primary badge for "Actions Needed".
        // "In Review" is passive waiting, so maybe badge isn't strictly necessary? 
        // User request says "Pending count must include ONLY actionable inspections".
        // So "In Review" (waiting for admin) is NOT actionable for the Vendor.
        // So we just count actionable requests.

      } else {
        count = pendingInspections.length;
      }
    }
    // console.log(`Badge for ${tabName}: ${count}`);
    return count;
  };


  const visibleTabs = TAB_ITEMS.filter(tab =>
    tab.roles.includes(userRole as UserRole)
  );

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const tabItem = visibleTabs.find(t => t.name === route.name);
          if (!tabItem) return null;

          const count = getBadgeCount(route.name);

          return (
            <TabButton
              key={route.key}
              route={route}
              descriptors={descriptors}
              state={state}
              navigation={navigation}
              index={index}
              tabItem={tabItem}
              badgeCount={count}
            />
          );
        })}
      </View>
    </View>
  );
};

export const MainTabNavigator: React.FC = () => {
  const { user } = useAuthStore();
  const userRole = user?.role;

  const getInitialRouteName = (): keyof MainTabParamList => {
    switch (userRole) {
      case UserRole.VENDOR:
        return 'Inspections';
      case UserRole.STORE_KEEPER:
        return 'Inventory';
      default:
        return 'Dashboard';
    }
  };

  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={getInitialRouteName()}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Farms" component={FarmsScreen} />
      <Tab.Screen name="Inspections" component={InspectionsScreen} />
      <Tab.Screen name="Batches" component={BatchesScreen} />
      <Tab.Screen name="Harvest" component={HarvestScreen} />
      <Tab.Screen name="GatePass" component={GatePassScreen} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="Sales" component={SalesScreen} />
      <Tab.Screen name="Ledger" component={LedgerScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: COLORS.background.dark,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    paddingTop: SPACING.xs,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glass.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    paddingVertical: SPACING.xs, // Tighter vertical padding
    justifyContent: 'space-between', // Spread evenly
    paddingHorizontal: SPACING.xs,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
    flex: 1, // Distribute space equally
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary.main,
  },
  tabItemFocused: {
    // No background or expansion, just subtle if needed, or rely on icon color
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: COLORS.status.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: COLORS.background.dark,
    zIndex: 10, // Ensure it's on top
    elevation: 5, // Android shadow/elevation
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
