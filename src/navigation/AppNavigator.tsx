import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';

// Auth Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { UserApprovalScreen } from '../screens/admin/UserApprovalScreen';

import { CreateInspectionRequestScreen } from '../screens/inspections/CreateInspectionRequestScreen';
import { InspectionsScreen } from '../screens/inspections/InspectionsScreen';
import { CameraScreen } from '../screens/common/CameraScreen';

// Main Navigator
import { MainTabNavigator } from './MainTabNavigator';

// Harvest & Gate Pass Screens
import { SubmitHarvestScreen } from '../screens/harvest/SubmitHarvestScreen';
import { HarvestReportDetailsScreen } from '../screens/harvest/HarvestReportDetailsScreen';
import { CreateGatePassScreen } from '../screens/harvest/CreateGatePassScreen';
import { GatePassDetailsScreen } from '../screens/harvest/GatePassDetailsScreen';
import { BatchLifecycleScreen } from '../screens/batches/BatchLifecycleScreen';

import { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen name="UserApproval" component={UserApprovalScreen} />
          <Stack.Screen name="CreateInspectionRequest" component={CreateInspectionRequestScreen} />
          <Stack.Screen name="SubmitHarvest" component={SubmitHarvestScreen} />
          <Stack.Screen name="HarvestReportDetails" component={HarvestReportDetailsScreen} />
          <Stack.Screen name="CreateGatePass" component={CreateGatePassScreen} />
          <Stack.Screen name="GatePassDetails" component={GatePassDetailsScreen} />
          <Stack.Screen name="Inspections" component={InspectionsScreen} />
          <Stack.Screen name="BatchLifecycle" component={BatchLifecycleScreen} />
          <Stack.Screen name="Camera" component={CameraScreen} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
};
