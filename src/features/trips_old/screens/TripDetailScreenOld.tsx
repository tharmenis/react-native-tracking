import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { RootStackParamList } from '../../../app/navigation/types';
import { AppHeader } from '../../../shared/components/AppHeader';
import { tripEvents, tripStops, trips } from '../../../shared/data/mockData';
import { colors, radius, spacing, typography } from '../../../shared/theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'TripDetail'>;

const eventDotStyles = StyleSheet.create({
  danger: { backgroundColor: colors.alert },
  success: { backgroundColor: colors.active },
  warning: { backgroundColor: colors.idle },
});

export function TripDetailScreen({ navigation, route }: Props) {
  const trip = trips.find((item) => item.id === route.params.tripId) ?? trips[0];

  return (
    <View style={styles.container}>
      <AppHeader onBackPress={navigation.goBack} rightAction={{ icon: 'download-outline' }} title={trip.id} />
      <ScrollView>
        <View style={styles.mapCard}>
          <View style={styles.tripPath} />
          <View style={styles.mapStart} />
          <View style={styles.mapEnd} />
          <View style={styles.replayButton}><Text style={styles.replayText}>Replay</Text></View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}><Text style={styles.statLabel}>Distance</Text><Text style={styles.statValue}>{trip.distance}</Text></View>
          <View style={styles.statCard}><Text style={styles.statLabel}>Duration</Text><Text style={styles.statValue}>{trip.duration}</Text></View>
          <View style={styles.statCard}><Text style={styles.statLabel}>Avg Speed</Text><Text style={styles.statValue}>{trip.avgSpeed}</Text></View>
          <View style={styles.statCard}><Text style={styles.statLabel}>Max Speed</Text><Text style={[styles.statValue, styles.overLimit]}>98 km/h</Text></View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Stops</Text>
          {tripStops.map((stop, index) => (
            <View key={stop.id} style={styles.timelineRow}>
              <View style={styles.timelineColumn}>
                <View style={[styles.timelineDot, stop.type === 'start' && styles.timelineDotStart, stop.type === 'end' && styles.timelineDotEnd]} />
                {index < tripStops.length - 1 ? <View style={styles.timelineLine} /> : null}
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelinePlace}>{stop.place}</Text>
                <Text style={styles.timelineMeta}>{stop.meta}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Events</Text>
          {tripEvents.map((event) => (
            <View key={event.id} style={styles.eventRow}>
              <View style={[styles.eventDot, eventDotStyles[event.tone]]} />
              <Text style={styles.eventText}>{event.text}</Text>
              <Text style={styles.eventTime}>{event.time}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray50,
    flex: 1,
  },
  eventDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  eventRow: {
    alignItems: 'center',
    borderBottomColor: colors.gray200,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  eventText: {
    color: colors.gray700,
    flex: 1,
    fontSize: typography.caption,
  },
  eventTime: {
    color: colors.gray500,
    fontSize: typography.tiny,
  },
  mapCard: {
    backgroundColor: colors.map,
    height: 180,
    overflow: 'hidden',
    position: 'relative',
  },
  mapEnd: {
    backgroundColor: colors.blue600,
    borderColor: colors.white,
    borderRadius: 7,
    borderWidth: 2,
    height: 14,
    position: 'absolute',
    right: 32,
    top: 32,
    width: 14,
  },
  mapStart: {
    backgroundColor: colors.activeText,
    borderColor: colors.white,
    borderRadius: 7,
    borderWidth: 2,
    bottom: 28,
    height: 14,
    left: 32,
    position: 'absolute',
    width: 14,
  },
  overLimit: {
    color: colors.alert,
  },
  replayButton: {
    backgroundColor: colors.white,
    borderColor: colors.gray200,
    borderRadius: radius.md,
    borderWidth: 1,
    bottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    position: 'absolute',
    right: spacing.md,
  },
  replayText: {
    color: colors.blue600,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  sectionBlock: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.blue900,
    fontSize: typography.body,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  statCard: {
    backgroundColor: colors.white,
    borderColor: colors.gray200,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    minWidth: '48%',
    padding: spacing.md,
  },
  statLabel: {
    color: colors.gray500,
    fontSize: typography.tiny,
    marginBottom: 2,
  },
  statValue: {
    color: colors.blue900,
    fontSize: typography.section,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    padding: spacing.lg,
  },
  timelineColumn: {
    alignItems: 'center',
    width: 24,
  },
  timelineContent: {
    flex: 1,
  },
  timelineDot: {
    backgroundColor: colors.blue50,
    borderColor: colors.blue200,
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    width: 24,
  },
  timelineDotEnd: {
    borderColor: colors.blue600,
  },
  timelineDotStart: {
    backgroundColor: colors.activeBg,
    borderColor: colors.activeText,
  },
  timelineLine: {
    backgroundColor: colors.gray200,
    flex: 1,
    marginVertical: spacing.xs,
    width: 2,
  },
  timelineMeta: {
    color: colors.gray500,
    fontSize: typography.tiny,
    marginTop: 2,
  },
  timelinePlace: {
    color: colors.gray900,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 64,
  },
  tripPath: {
    backgroundColor: colors.blue600,
    borderRadius: 999,
    height: 4,
    left: 36,
    position: 'absolute',
    right: 36,
    top: 90,
    transform: [{ rotate: '-15deg' }],
  },
});