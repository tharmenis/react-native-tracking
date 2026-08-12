import { DrawerScreenProps } from '@react-navigation/drawer';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { DrawerParamList, RootStackParamList } from '../../../app/navigation/types';
import { AppHeader } from '../../../shared/components/AppHeader';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { trips } from '../../../shared/data/mockData';
import { colors, radius, spacing, typography } from '../../../shared/theme/theme';

type Props = CompositeScreenProps<
  DrawerScreenProps<DrawerParamList, 'Trips'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function TripsScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <AppHeader onMenuPress={navigation.openDrawer} rightAction={{ icon: 'download' }} title="Trips" />
      <View style={styles.pillsRow}>
        <View style={[styles.pill, styles.pillActive]}><Text style={[styles.pillText, styles.pillTextActive]}>Today</Text></View>
        <View style={styles.pill}><Text style={styles.pillText}>Yesterday</Text></View>
        <View style={styles.pill}><Text style={styles.pillText}>This week</Text></View>
      </View>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate('TripDetail', { tripId: item.id })} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.vehicleName}</Text>
              <Text style={styles.cardId}>{item.id}</Text>
            </View>
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, styles.routeDotStart]} />
              <Text style={styles.routeLabel}>{item.origin}</Text>
              <View style={[styles.routeLine, item.status === 'inProgress' && styles.routeLineDashed]} />
              <Text style={styles.routeLabel}>{item.destination}</Text>
              <View style={[styles.routeDot, item.status === 'completed' ? styles.routeDotDone : styles.routeDotIdle]} />
            </View>
            <View style={styles.footerRow}>
              <View style={styles.statsRow}>
                <Text style={styles.stat}><Text style={styles.statStrong}>{item.distance}</Text></Text>
                <Text style={styles.stat}><Text style={styles.statStrong}>{item.duration}</Text></Text>
                <Text style={styles.stat}><Text style={styles.statStrong}>{item.avgSpeed}</Text></Text>
              </View>
              <StatusBadge label={item.status === 'completed' ? 'Completed' : 'In progress'} status={item.status === 'completed' ? 'active' : 'idle'} />
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderColor: colors.gray200,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardId: {
    color: colors.gray500,
    fontSize: typography.tiny,
  },
  cardTitle: {
    color: colors.gray900,
    fontSize: typography.body,
    fontWeight: '600',
  },
  container: {
    backgroundColor: colors.gray50,
    flex: 1,
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  pill: {
    backgroundColor: colors.white,
    borderColor: colors.gray200,
    borderRadius: radius.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  pillActive: {
    backgroundColor: colors.blue600,
    borderColor: colors.blue600,
  },
  pillText: {
    color: colors.gray700,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  pillTextActive: {
    color: colors.white,
  },
  pillsRow: {
    backgroundColor: colors.white,
    borderBottomColor: colors.gray200,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  routeDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  routeDotDone: {
    backgroundColor: colors.activeText,
  },
  routeDotIdle: {
    backgroundColor: colors.idle,
  },
  routeDotStart: {
    backgroundColor: colors.blue600,
  },
  routeLabel: {
    color: colors.gray700,
    fontSize: typography.caption,
  },
  routeLine: {
    backgroundColor: colors.blue200,
    flex: 1,
    height: 2,
    marginHorizontal: spacing.sm,
  },
  routeLineDashed: {
    backgroundColor: 'transparent',
    borderTopColor: colors.idle,
    borderTopWidth: 2,
  },
  routeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  stat: {
    color: colors.gray500,
    fontSize: typography.caption,
  },
  statStrong: {
    color: colors.gray900,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});