import { DrawerScreenProps } from '@react-navigation/drawer';
import { StyleSheet, Text, View } from 'react-native';

import { DrawerParamList } from '../../../app/navigation/types';
import { AppHeader } from '../../../shared/components/AppHeader';
import { analytics } from '../../../shared/data/mockData';
import { colors, radius, spacing, typography } from '../../../shared/theme/theme';

type Props = DrawerScreenProps<DrawerParamList, 'Analytics'>;

const barHeightStyles = StyleSheet.create({
  bar0: { height: '55%' },
  bar1: { height: '72%' },
  bar2: { height: '90%' },
  bar3: { height: '65%' },
  bar4: { height: '80%' },
  bar5: { height: '40%' },
  bar6: { height: '25%' },
});

const trendStyles = StyleSheet.create({
  down: { color: colors.alertText },
  neutral: { color: colors.gray500 },
  up: { color: colors.activeText },
});

const toneStyles = StyleSheet.create({
  dangerCount: { color: colors.alertText },
  dangerLabel: { color: colors.alertText },
  dangerTile: { backgroundColor: colors.alertBg },
  infoCount: { color: colors.blue800 },
  infoLabel: { color: colors.blue800 },
  infoTile: { backgroundColor: colors.blue50 },
  warningCount: { color: colors.idleText },
  warningLabel: { color: colors.idleText },
  warningTile: { backgroundColor: colors.idleBg },
});

export function AnalyticsScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <AppHeader onMenuPress={navigation.openDrawer} rightAction={{ icon: 'download-outline' }} title="Analytics" />
      <View style={styles.content}>
        <View style={styles.kpiGrid}>
          {analytics.kpis.map((kpi) => (
            <View key={kpi.id} style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{kpi.label}</Text>
              <Text style={styles.kpiValue}>{kpi.value}</Text>
              <Text style={[styles.kpiDelta, trendStyles[kpi.trend]]}>{kpi.delta}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Daily Distance (km)</Text>
        <View style={styles.chartCard}>
          <View style={styles.barChart}>
            {analytics.dailyDistance.map((value, index) => (
              <View key={`${value}-${index}`} style={styles.barColumn}>
                <View style={[styles.bar, barHeightStyles[`bar${index}`], index === 2 && styles.barHighlight]} />
                <Text style={styles.barLabel}>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Alert Breakdown</Text>
        <View style={styles.tilesRow}>
          {analytics.alertBreakdown.map((tile) => (
            <View key={tile.id} style={[styles.tile, toneStyles[`${tile.tone}Tile`]]}>
              <Text style={[styles.tileCount, toneStyles[`${tile.tone}Count`]]}>{tile.count}</Text>
              <Text style={[styles.tileLabel, toneStyles[`${tile.tone}Label`]]}>{tile.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.blue200,
    borderRadius: 4,
    width: '100%',
  },
  barChart: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: spacing.sm,
    height: 120,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
    justifyContent: 'flex-end',
  },
  barHighlight: {
    backgroundColor: colors.blue600,
  },
  barLabel: {
    color: colors.gray500,
    fontSize: typography.tiny,
  },
  chartCard: {
    backgroundColor: colors.white,
    borderColor: colors.gray200,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.xl,
    padding: spacing.lg,
  },
  container: {
    backgroundColor: colors.gray50,
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  kpiCard: {
    backgroundColor: colors.white,
    borderColor: colors.gray200,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    minWidth: '48%',
    padding: spacing.lg,
  },
  kpiDelta: {
    fontSize: typography.tiny,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  kpiLabel: {
    color: colors.gray500,
    fontSize: typography.tiny,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  kpiValue: {
    color: colors.blue900,
    fontSize: typography.title,
    fontWeight: '700',
  },
  sectionTitle: {
    color: colors.blue900,
    fontSize: typography.body,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  tile: {
    borderRadius: radius.md,
    flex: 1,
    minWidth: 100,
    padding: spacing.lg,
  },
  tileCount: {
    fontSize: 20,
    fontWeight: '700',
  },
  tileLabel: {
    fontSize: typography.tiny,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  tilesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
});