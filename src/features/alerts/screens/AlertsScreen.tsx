import { Ionicons } from '@expo/vector-icons';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { DrawerParamList } from '../../../app/navigation/types';
import { acknowledgeAlarm, fetchAlarms, resolveAlarm } from '../../../shared/api/alarms';
import { AppHeader } from '../../../shared/components/AppHeader';
import { usePushNotifications } from '../../../shared/notifications/PushNotificationsProvider';
import { Alarm } from '../../../shared/types/models';
import { colors, radius, spacing, typography } from '../../../shared/theme/theme';

type Props = DrawerScreenProps<DrawerParamList, 'Alarms'>;

type AlarmStatusFilter = 'open' | 'acknowledged' | 'resolved';

const iconMap = {
  high: 'warning-outline',
  low: 'checkmark-circle-outline',
  medium: 'time-outline',
} as const;

const severityToneMap = {
  high: { tile: colors.alertBg, text: colors.alertText },
  medium: { tile: colors.idleBg, text: colors.idleText },
  low: { tile: colors.activeBg, text: colors.activeText },
} as const;

const statusToneMap = {
  acknowledged: { backgroundColor: colors.blue50, color: colors.blue600 },
  open: { backgroundColor: colors.idleBg, color: colors.idleText },
  resolved: { backgroundColor: colors.activeBg, color: colors.activeText },
} as const;

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function AlarmsScreen({ navigation }: Props) {
  const { clearAlarmBadgeCount } = usePushNotifications();
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<AlarmStatusFilter>('open');

  const counts = useMemo(() => ({
    acknowledged: alarms.filter((alarm) => alarm.status === 'acknowledged').length,
    open: alarms.filter((alarm) => alarm.status === 'open').length,
    resolved: alarms.filter((alarm) => alarm.status === 'resolved').length,
  }), [alarms]);

  const visibleAlarms = useMemo(() => alarms.filter((alarm) => alarm.status === selectedStatus), [alarms, selectedStatus]);

  const statusTabs = [
    { key: 'open' as const, label: 'Open', count: counts.open },
    { key: 'acknowledged' as const, label: 'Acknowledged', count: counts.acknowledged },
    { key: 'resolved' as const, label: 'Resolved', count: counts.resolved },
  ];

  useEffect(() => {
    clearAlarmBadgeCount();
    void loadAlarms(true);
  }, [clearAlarmBadgeCount]);

  async function loadAlarms(initialLoad = false) {
    if (initialLoad) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    const result = await fetchAlarms();

    setAlarms(result.alarms);
    setNotice(result.message ?? null);
    setIsLoading(false);
    setIsRefreshing(false);
  }

  async function handleAction(alarmId: string, action: 'acknowledge' | 'resolve') {
    setActiveActionId(alarmId);

    try {
      if (action === 'acknowledge') {
        await acknowledgeAlarm(alarmId);
      } else {
        await resolveAlarm(alarmId);
      }

      setAlarms((current) => current.map((alarm) => (alarm.id === alarmId ? {
        ...alarm,
        status: action === 'acknowledge' ? 'acknowledged' : 'resolved',
        updatedAt: 'just now',
      } : alarm)));
      setNotice(null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to update alarm.');
    } finally {
      setActiveActionId(null);
    }
  }

  return (
    <View style={styles.container}>
      <AppHeader onMenuPress={navigation.openDrawer} title="Alarms" />
      <View style={styles.tabsRow}>
        {statusTabs.map((tab) => {
          const active = selectedStatus === tab.key;

          return (
            <Pressable key={tab.key} onPress={() => setSelectedStatus(tab.key)} style={[styles.tab, active && styles.tabActive]}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab.label} ({tab.count})
              </Text>
            </Pressable>
          );
        })}
      </View>
      {notice ? (
        <View style={styles.noticeBanner}>
          <Ionicons color={colors.blue900} name="information-circle-outline" size={16} />
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}
      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.blue600} size="small" />
          <Text style={styles.loadingText}>Loading alarms...</Text>
        </View>
      ) : null}
      <FlatList
        contentContainerStyle={styles.listContent}
        data={visibleAlarms}
        refreshControl={<RefreshControl onRefresh={() => void loadAlarms()} refreshing={isRefreshing} tintColor={colors.blue600} />}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const severityTone = severityToneMap[item.severity];
          const statusTone = statusToneMap[item.status];
          const busy = activeActionId === item.id;
          const rootNavigation = navigation.getParent() as {
            navigate: (screen: 'AlarmDetail', params: { alarmId: string; alarm: Alarm }) => void;
          } | null;

  

          return (
            <Pressable onPress={() => rootNavigation?.navigate('AlarmDetail', { alarmId: item.id, alarm: item })} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
              <View style={[styles.iconTile, { backgroundColor: severityTone.tile }]}>
                <Ionicons color={severityTone.text} name={iconMap[item.severity]} size={18} />
              </View>
              <View style={styles.content}>
                <View style={styles.headerRow}>
                  <Text style={styles.title}>{item.title}</Text>
                  <View style={[styles.statusPill, { backgroundColor: statusTone.backgroundColor }]}>
                    <Text style={[styles.statusPillText, { color: statusTone.color }]}>{capitalize(item.status)}</Text>
                  </View>
                </View>
                <Text style={styles.subtitle}>{item.description}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>{item.vehicleName}</Text>
                  <View style={[styles.severityPill, { backgroundColor: severityTone.tile }]}>
                    <Text style={[styles.severityPillText, { color: severityTone.text }]}>{capitalize(item.severity)}</Text>
                  </View>
                </View>
                <Text style={styles.time}>{item.updatedAt}</Text>
                <View style={styles.actionsRow}>
                  <Pressable
                    disabled={busy || item.status !== 'open'}
                    onPress={(event) => {
                      event.stopPropagation();
                      void handleAction(item.id, 'acknowledge');
                    }}
                    style={[styles.actionButton, styles.secondaryAction]}
                  >
                    <Text style={styles.secondaryActionText}>{busy ? 'Working...' : 'Acknowledge'}</Text>
                  </Pressable>
                  <Pressable
                    disabled={busy || item.status === 'resolved'}
                    onPress={(event) => {
                      event.stopPropagation();
                      void handleAction(item.id, 'resolve');
                    }}
                    style={[styles.actionButton, styles.primaryAction]}
                  >
                    <Text style={styles.primaryActionText}>{busy ? 'Working...' : 'Resolve'}</Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons color={colors.gray500} name="notifications-off-outline" size={28} />
            <Text style={styles.emptyTitle}>No {selectedStatus} alarms yet</Text>
            <Text style={styles.emptyText}>
              {selectedStatus === 'open'
                ? 'Open alarms will appear here when the backend delivers them.'
                : `There are no ${selectedStatus} alarms right now.`}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray50,
    flex: 1,
  },
  actionButton: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxl,
  },
  emptyText: {
    color: colors.gray500,
    fontSize: typography.caption,
    lineHeight: 18,
    textAlign: 'center',
  },
  emptyTitle: {
    color: colors.gray900,
    fontSize: typography.body,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  headerRow: {
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  iconTile: {
    alignItems: 'center',
    borderRadius: radius.sm,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  readRow: {
    opacity: 0.55,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  loadingState: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  loadingText: {
    color: colors.gray500,
    fontSize: typography.caption,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  metaText: {
    color: colors.gray500,
    flex: 1,
    fontSize: typography.caption,
  },
  noticeBanner: {
    alignItems: 'center',
    backgroundColor: colors.blue50,
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  noticeText: {
    color: colors.blue900,
    flex: 1,
    fontSize: typography.caption,
  },
  row: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  rowPressed: {
    opacity: 0.9,
  },
  primaryAction: {
    backgroundColor: colors.blue600,
  },
  primaryActionText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  secondaryAction: {
    backgroundColor: colors.blue50,
  },
  secondaryActionText: {
    color: colors.blue600,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  severityPill: {
    borderRadius: radius.xl,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  severityPillText: {
    fontSize: typography.tiny,
    fontWeight: '700',
  },
  statusPill: {
    borderRadius: radius.xl,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  statusPillText: {
    fontSize: typography.tiny,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.gray700,
    fontSize: typography.caption,
    marginTop: 2,
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
  time: {
    color: colors.gray500,
    fontSize: typography.tiny,
    marginTop: spacing.xs,
  },
  title: {
    color: colors.gray900,
    fontSize: typography.body,
    fontWeight: '600',
  },
});