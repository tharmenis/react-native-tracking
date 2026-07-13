import { Ionicons } from '@expo/vector-icons';
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItem,
  createDrawerNavigator,
} from '@react-navigation/drawer';
import { CommonActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AlarmDetailScreen } from '../../features/alarms/screens/AlarmDetailScreen';
import { AlarmsScreen } from '../../features/alerts/screens/AlertsScreen';
import { AnalyticsScreen } from '../../features/analytics/screens/AnalyticsScreen';
import { LoginScreen } from '../../features/auth/screens/LoginScreen';
import { MapScreen } from '../../features/dashboard/screens/MapScreen';
import { DriverFormScreen } from '../../features/drivers/screens/DriverFormScreen';
import { DriversScreen } from '../../features/drivers/screens/DriversScreen';
import { VehicleDetailScreen } from '../../features/fleet/screens/VehicleDetailScreen';
import { VehiclesScreen } from '../../features/fleet/screens/VehiclesScreen';
import { TripDetailScreen } from '../../features/trips/screens/TripDetailScreen';
import { TripsScreen } from '../../features/trips/screens/TripsScreen';
import { currentUser } from '../../shared/data/mockData';
import { usePushNotifications } from '../../shared/notifications/PushNotificationsProvider';
import { colors, radius, spacing, typography } from '../../shared/theme/theme';
import { DrawerParamList, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { alarmBadgeCount } = usePushNotifications();
  const activeRoute = props.state.routeNames[props.state.index];

  const sections = [
    {
      title: 'Monitoring',
      items: [
        { label: 'Live Map', route: 'LiveMap', icon: 'location-outline' },
        { label: 'Alarms', route: 'Alarms', icon: 'notifications-outline', badge: alarmBadgeCount > 0 ? `${alarmBadgeCount}` : undefined },
        { label: 'Vehicles', route: 'Vehicles', icon: 'car-outline' },
      ],
    },
    {
      title: 'Management',
      items: [
        { label: 'Drivers', route: 'Drivers', icon: 'people-outline' },
        { label: 'Trips', route: 'Trips', icon: 'trail-sign-outline' },
        { label: 'Analytics', route: 'Analytics', icon: 'bar-chart-outline' },
      ],
    },
  ];

  return (
    <DrawerContentScrollView contentContainerStyle={styles.drawerScroll} {...props}>
      <View style={styles.drawerHeader}>
        <View style={styles.drawerAvatar}>
          <Text style={styles.drawerAvatarText}>{currentUser.initials}</Text>
        </View>
        <Text style={styles.drawerName}>{currentUser.name}</Text>
        <Text style={styles.drawerRole}>{currentUser.role} · {currentUser.company}</Text>
      </View>

      {sections.map((section) => (
        <View key={section.title} style={styles.drawerSection}>
          <Text style={styles.drawerSectionLabel}>{section.title}</Text>
          {section.items.map((item) => {
            const focused = activeRoute === item.route;

            return (
              <DrawerItem
                focused={focused}
                icon={({ color, size }) => (
                  <Ionicons color={color} name={item.icon as keyof typeof Ionicons.glyphMap} size={size} />
                )}
                key={item.route}
                label={() => (
                  <View style={styles.drawerLabelRow}>
                    <Text style={[styles.drawerLabel, focused && styles.drawerLabelActive]}>{item.label}</Text>
                    {item.badge ? <Text style={styles.drawerBadge}>{item.badge}</Text> : null}
                  </View>
                )}
                onPress={() => props.navigation.navigate(item.route as never)}
                style={focused ? styles.drawerItemActive : styles.drawerItem}
              />
            );
          })}
        </View>
      ))}

      <View style={styles.drawerFooter}>
        <Pressable
          onPress={() => {
            props.navigation.getParent()?.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              }),
            );
          }}
          style={styles.settingsButton}
        >
          <Ionicons color={colors.gray700} name="log-out-outline" size={20} />
          <Text style={styles.settingsText}>Sign Out</Text>
        </Pressable>
      </View>
    </DrawerContentScrollView>
  );
}

function MainDrawerNavigator() {
  return (
    <Drawer.Navigator
      id={undefined}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        sceneStyle: styles.drawerScene,
      }}
    >
      <Drawer.Screen component={MapScreen} name="LiveMap" />
      <Drawer.Screen component={AlarmsScreen} name="Alarms" />
      <Drawer.Screen component={VehiclesScreen} name="Vehicles" />
      <Drawer.Screen component={DriversScreen} name="Drivers" />
      <Drawer.Screen component={TripsScreen} name="Trips" />
      <Drawer.Screen component={AnalyticsScreen} name="Analytics" />
    </Drawer.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Stack.Navigator id={undefined} initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen component={LoginScreen} name="Login" />
      <Stack.Screen component={MainDrawerNavigator} name="Main" />
      <Stack.Screen component={AlarmDetailScreen} name="AlarmDetail" />
      <Stack.Screen component={DriverFormScreen} name="DriverForm" />
      <Stack.Screen component={TripDetailScreen} name="TripDetail" />
      <Stack.Screen component={VehicleDetailScreen} name="VehicleDetail" />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerAvatar: {
    alignItems: 'center',
    backgroundColor: colors.blue600,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 48,
  },
  drawerAvatarText: {
    color: colors.white,
    fontSize: typography.heading,
    fontWeight: '700',
  },
  drawerBadge: {
    backgroundColor: colors.alert,
    borderRadius: 10,
    color: colors.white,
    fontSize: typography.tiny,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  drawerFooter: {
    borderTopColor: colors.gray200,
    borderTopWidth: 1,
    marginTop: 'auto',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  drawerHeader: {
    borderBottomColor: colors.gray200,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  drawerItem: {
    borderRadius: radius.md,
    marginHorizontal: spacing.md,
  },
  drawerItemActive: {
    backgroundColor: colors.blue50,
    borderRadius: radius.md,
    marginHorizontal: spacing.md,
  },
  drawerLabel: {
    color: colors.gray700,
    fontSize: typography.body,
    fontWeight: '500',
  },
  drawerLabelActive: {
    color: colors.blue600,
    fontWeight: '700',
  },
  drawerLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
  },
  drawerName: {
    color: colors.gray900,
    fontSize: typography.heading,
    fontWeight: '700',
  },
  drawerRole: {
    color: colors.gray500,
    fontSize: typography.caption,
    marginTop: 2,
  },
  drawerScene: {
    backgroundColor: colors.gray50,
  },
  drawerScroll: {
    backgroundColor: colors.white,
    flexGrow: 1,
  },
  drawerSection: {
    paddingTop: spacing.lg,
  },
  drawerSectionLabel: {
    color: colors.gray500,
    fontSize: typography.tiny,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.xl,
    textTransform: 'uppercase',
  },
  settingsButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  settingsText: {
    color: colors.gray700,
    fontSize: typography.body,
    fontWeight: '500',
  },
});