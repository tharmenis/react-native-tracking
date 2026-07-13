import { Ionicons } from '@expo/vector-icons';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { DrawerParamList, RootStackParamList } from '../../../app/navigation/types';
import { fetchVehicles } from '../api/vehicles';
import { AppHeader } from '../../../shared/components/AppHeader';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { colors, radius, spacing, typography } from '../../../shared/theme/theme';
import { Vehicle } from '../../../shared/types/models';

type Props = CompositeScreenProps<
  DrawerScreenProps<DrawerParamList, 'Vehicles'>,
  NativeStackScreenProps<RootStackParamList>
>;

const statusDotStyles = StyleSheet.create({
  active: { backgroundColor: colors.active },
  alert: { backgroundColor: colors.alert },
  idle: { backgroundColor: colors.idle },
  off: { backgroundColor: colors.off },
});

export function VehiclesScreen({ navigation }: Props) {
  const [vehicleItems, setVehicleItems] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void loadVehicles(controller.signal);

    return () => controller.abort();
  }, []);

  async function loadVehicles(signal?: AbortSignal, refresh = false) {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    const result = await fetchVehicles({ signal });

    setVehicleItems(result.vehicles);
    setNotice(result.message ?? null);
    setIsLoading(false);
    setIsRefreshing(false);
  }

  const activeCount = vehicleItems.filter((item) => item.status === 'active').length;
  const idleCount = vehicleItems.filter((item) => item.status === 'idle').length;

  return (
    <View style={styles.container}>
      <AppHeader onMenuPress={navigation.openDrawer} rightAction={{ icon: 'swap-vertical-outline' }} title="Vehicles" />
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      <View style={styles.tabsRow}>
        <Pressable style={[styles.tab, styles.tabActive]}><Text style={[styles.tabText, styles.tabTextActive]}>All ({vehicleItems.length})</Text></Pressable>
        <Pressable style={styles.tab}><Text style={styles.tabText}>Active ({activeCount})</Text></Pressable>
        <Pressable style={styles.tab}><Text style={styles.tabText}>Idle ({idleCount})</Text></Pressable>
      </View>
      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.blue600} size="small" />
          <Text style={styles.loadingText}>Loading vehicles…</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={[styles.listContent, vehicleItems.length === 0 && styles.emptyListContent]}
          data={vehicleItems}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl onRefresh={() => void loadVehicles(undefined, true)} refreshing={isRefreshing} tintColor={colors.blue600} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No vehicles returned</Text>
              <Text style={styles.emptyText}>Check the configured API path and confirm the remote instance exposes a vehicle list.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item.id, vehicle: item })}
              style={[styles.row, item.status === 'alert' && styles.alertRow]}
            >
              <View style={[styles.dot, statusDotStyles[item.status]]} />
              <View style={styles.info}>
                <Text style={styles.name}>
                  {item.name} <Text style={styles.plate}>{item.plate}</Text>
                </Text>
                <Text style={styles.meta}>{item.driver} · {item.meta}</Text>
              </View>
              <StatusBadge label={item.status === 'alert' ? (item.meta.includes('km/h') ? 'Speeding' : 'Alert') : undefined} status={item.status} />
            </Pressable>
          )}
        />
      )}
      <Pressable style={styles.addButton}><Ionicons color={colors.white} name="add" size={18} /><Text style={styles.addText}>Add Vehicle</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.blue600,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    margin: spacing.lg,
    paddingVertical: 14,
  },
  addText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '700',
  },
  alertRow: {
    backgroundColor: '#FFF5F5',
  },
  container: {
    backgroundColor: colors.gray50,
    flex: 1,
  },
  dot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxxl,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyText: {
    color: colors.gray500,
    fontSize: typography.caption,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  emptyTitle: {
    color: colors.gray900,
    fontSize: typography.body,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  loadingState: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.gray500,
    fontSize: typography.caption,
  },
  meta: {
    color: colors.gray700,
    fontSize: typography.caption,
    marginTop: 2,
  },
  name: {
    color: colors.gray900,
    fontSize: typography.body,
    fontWeight: '600',
  },
  plate: {
    color: colors.gray500,
    fontSize: typography.caption,
    fontWeight: '400',
  },
  notice: {
    backgroundColor: colors.blue50,
    color: colors.blue900,
    fontSize: typography.caption,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  row: {
    alignItems: 'center',
    backgroundColor: colors.white,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  tab: {
    borderBottomColor: 'transparent',
    borderBottomWidth: 2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  tabActive: {
    borderBottomColor: colors.blue600,
  },
  tabText: {
    color: colors.gray500,
    fontSize: typography.caption,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.blue600,
  },
  tabsRow: {
    backgroundColor: colors.white,
    borderBottomColor: colors.gray200,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
  },
});