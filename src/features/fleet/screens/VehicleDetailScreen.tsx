import { AppIcon, AppIconName } from '../../../shared/components/AppIcon';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DrawerParamList, RootStackParamList } from '../../../app/navigation/types';
import { AppHeader } from '../../../shared/components/AppHeader';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { alarms, vehicles } from '../../../shared/data/mockData';
import { colors, radius, spacing, typography } from '../../../shared/theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'VehicleDetail'>;

type ActionTarget = {
  screen: keyof DrawerParamList;
};

type ActionItem = {
  id: string;
  label: string;
  icon: AppIconName;
  target?: ActionTarget;
};

const actionTargets: ActionItem[] = [
  { id: 'track', label: 'Track', icon: 'place', target: { screen: 'LiveMap' } },
  { id: 'trips', label: 'Trips', icon: 'route', target: { screen: 'Trips' } },
  { id: 'alerts', label: 'Alarms', icon: 'notifications', target: { screen: 'Alarms' } },
  { id: 'more', label: 'More', icon: 'more-horiz' },
];

export function VehicleDetailScreen({ navigation, route }: Props) {
  const vehicle = route.params.vehicle ?? vehicles.find((item) => item.id === route.params.vehicleId) ?? vehicles[0];
  const recentAlarms = alarms.slice(0, 2);

  return (
    <View style={styles.container}>
      <AppHeader onBackPress={navigation.goBack} rightAction={{ icon: 'edit' }} title="Vehicle Detail" />
      <ScrollView>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <AppIcon color={colors.white} name="directions-car" size={24} />
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{vehicle.name}</Text>
            <Text style={styles.heroSub}>{vehicle.plate} · 2021 Toyota Hilux SR5</Text>
          </View>
          <StatusBadge label="Speeding" status="alert" />
        </View>

        <View style={styles.infoRows}>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Driver</Text><Text style={styles.infoValue}>{vehicle.driver}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Speed</Text><Text style={[styles.infoValue, styles.dangerValue]}>112 km/h (limit: 80)</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Location</Text><Text style={styles.infoValue}>Mombasa Rd, km 42</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Route</Text><Text style={styles.infoValue}>Nairobi → Mombasa</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>ETA</Text><Text style={styles.infoValue}>3h 20m · 380 km remaining</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Fuel</Text><Text style={styles.infoValue}>68%</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Alarms</Text>
          {recentAlarms.map((alarm) => (
            <View key={alarm.id} style={styles.alertCard}>
              <View style={[styles.alertIconTile, alarm.severity === 'high' ? styles.alertDanger : styles.alertWarning]}>
                <AppIcon color={alarm.severity === 'high' ? colors.alert : colors.idle} name={alarm.severity === 'high' ? 'warning' : 'schedule'} size={18} />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{alarm.title}</Text>
                <Text style={styles.alertTime}>{alarm.updatedAt}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.actionsGrid}>
          {actionTargets.map((action) => (
            <Pressable
              key={action.id}
              onPress={() => {
                if (!action.target) {
                  return;
                }
                navigation.navigate('Main', { screen: action.target.screen });
              }}
              style={styles.actionTile}
            >
              <AppIcon color={colors.blue600} name={action.icon} size={20} />
              <Text style={styles.actionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  actionLabel: {
    color: colors.gray700,
    fontSize: typography.tiny,
    fontWeight: '600',
  },
  actionTile: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.gray200,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  alertCard: {
    backgroundColor: colors.white,
    borderColor: colors.gray200,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  alertContent: {
    flex: 1,
  },
  alertDanger: {
    backgroundColor: colors.alertBg,
  },
  alertIconTile: {
    alignItems: 'center',
    borderRadius: radius.sm,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  alertTime: {
    color: colors.gray500,
    fontSize: typography.tiny,
    marginTop: 2,
  },
  alertTitle: {
    color: colors.gray900,
    fontSize: typography.body,
    fontWeight: '600',
  },
  alertWarning: {
    backgroundColor: colors.idleBg,
  },
  container: {
    backgroundColor: colors.gray50,
    flex: 1,
  },
  dangerValue: {
    color: colors.alert,
    fontWeight: '700',
  },
  hero: {
    alignItems: 'center',
    backgroundColor: colors.blue600,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  heroIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: radius.md,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  heroInfo: {
    flex: 1,
  },
  heroName: {
    color: colors.white,
    fontSize: typography.section,
    fontWeight: '700',
  },
  heroSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: typography.caption,
    marginTop: 2,
  },
  infoLabel: {
    color: colors.gray500,
    fontSize: typography.caption,
    width: 90,
  },
  infoRow: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderBottomColor: colors.gray200,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  infoRows: {
    marginBottom: spacing.lg,
  },
  infoValue: {
    color: colors.gray900,
    flex: 1,
    fontSize: typography.body,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    color: colors.blue900,
    fontSize: typography.body,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
});