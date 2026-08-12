import { DrawerScreenProps } from '@react-navigation/drawer';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { DrawerParamList, RootStackParamList } from '../../../app/navigation/types';
import { AppHeader } from '../../../shared/components/AppHeader';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { drivers } from '../../../shared/data/mockData';
import { colors, radius, spacing, typography } from '../../../shared/theme/theme';

type Props = CompositeScreenProps<
  DrawerScreenProps<DrawerParamList, 'Drivers'>,
  NativeStackScreenProps<RootStackParamList>
>;

const avatarStyles = StyleSheet.create({
  alert: { backgroundColor: colors.blue800 },
  active: { backgroundColor: colors.blue600 },
  idle: { backgroundColor: colors.blue400 },
  off: { backgroundColor: colors.off },
});

export function DriversScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <AppHeader onMenuPress={navigation.openDrawer} rightAction={{ icon: 'swap-vert' }} title="Drivers" />
      <View style={styles.tabsRow}>
        <Pressable style={[styles.tab, styles.tabActive]}><Text style={[styles.tabText, styles.tabTextActive]}>All (8)</Text></Pressable>
        <Pressable style={styles.tab}><Text style={styles.tabText}>On duty (6)</Text></Pressable>
        <Pressable style={styles.tab}><Text style={styles.tabText}>Off (2)</Text></Pressable>
      </View>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={drivers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('DriverForm', { mode: 'edit', driverId: item.id })}
            style={styles.row}
          >
            <View style={[styles.avatar, avatarStyles[item.status]]}>
              <Text style={styles.avatarText}>{item.initials}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{item.vehicle} · {item.route}</Text>
            </View>
            <StatusBadge status={item.status} />
          </Pressable>
        )}
      />
      <Pressable onPress={() => navigation.navigate('DriverForm', { mode: 'create' })} style={styles.addButton}>
        <Text style={styles.addText}>Add Driver</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.blue600,
    borderRadius: radius.md,
    justifyContent: 'center',
    margin: spacing.lg,
    paddingVertical: 14,
  },
  addText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '700',
  },
  avatar: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  avatarText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  container: {
    backgroundColor: colors.gray50,
    flex: 1,
  },
  info: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.xxl,
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