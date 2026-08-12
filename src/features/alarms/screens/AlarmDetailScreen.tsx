import { AppIcon } from '../../../shared/components/AppIcon';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { RootStackParamList } from '../../../app/navigation/types';
import { acknowledgeAlarm, fetchAlarms, resolveAlarm } from '../../../shared/api/alarms';
import { AppHeader } from '../../../shared/components/AppHeader';
import { alarms as fallbackAlarms } from '../../../shared/data/mockData';
import { usePushNotifications } from '../../../shared/notifications/PushNotificationsProvider';
import { Alarm } from '../../../shared/types/models';
import { colors, radius, spacing, typography } from '../../../shared/theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AlarmDetail'>;

const severityMap = {
  high: { backgroundColor: colors.alertBg, color: colors.alertText, icon: 'warning' as const },
  low: { backgroundColor: colors.activeBg, color: colors.activeText, icon: 'check-circle' as const },
  medium: { backgroundColor: colors.idleBg, color: colors.idleText, icon: 'schedule' as const },
};

const statusMap = {
  acknowledged: { backgroundColor: colors.blue50, color: colors.blue600 },
  open: { backgroundColor: colors.idleBg, color: colors.idleText },
  resolved: { backgroundColor: colors.activeBg, color: colors.activeText },
};

type Tone = {
  backgroundColor: string;
  color: string;
};

export function AlarmDetailScreen({ navigation, route }: Props) {
  const { clearAlarmBadgeCount } = usePushNotifications();
  const [alarm, setAlarm] = useState<Alarm | null>(route.params.alarm ?? null);
  const [isLoading, setIsLoading] = useState(!route.params.alarm);
  const [busyAction, setBusyAction] = useState<'acknowledge' | 'resolve' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const severityTone = useMemo(() => (alarm ? severityMap[alarm.severity] : severityMap.medium), [alarm]);
  const statusTone = useMemo(() => (alarm ? statusMap[alarm.status] : statusMap.open), [alarm]);

  useEffect(() => {
    clearAlarmBadgeCount();

    if (alarm) {
      return;
    }

    void loadAlarm();
  }, [alarm, clearAlarmBadgeCount]);

  async function loadAlarm() {
    setIsLoading(true);

    const result = await fetchAlarms();
    const foundAlarm = result.alarms.find((item) => item.id === route.params.alarmId) ?? fallbackAlarms.find((item) => item.id === route.params.alarmId) ?? null;

    setAlarm(foundAlarm);
    setNotice(result.message ?? null);
    setIsLoading(false);
  }

  async function handleAction(action: 'acknowledge' | 'resolve') {
    if (!alarm) {
      return;
    }

    setBusyAction(action);

    try {
      if (action === 'acknowledge') {
        await acknowledgeAlarm(alarm.id);
      } else {
        await resolveAlarm(alarm.id);
      }

      setAlarm({
        ...alarm,
        status: action === 'acknowledge' ? 'acknowledged' : 'resolved',
        updatedAt: 'just now',
      });
      setNotice(null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to update alarm.');
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <View style={styles.container}>
      <AppHeader onBackPress={navigation.goBack} title="Alarm Detail" />
      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.blue600} size="small" />
          <Text style={styles.loadingText}>Loading alarm...</Text>
        </View>
      ) : null}
      {notice ? (
        <View style={styles.noticeBanner}>
          <AppIcon color={colors.blue900} name="info-outline" size={16} />
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}
      <ScrollView contentContainerStyle={styles.content}>
        {alarm ? (
          <>
            <View style={styles.hero}>
              <View style={[styles.heroIcon, { backgroundColor: severityTone.backgroundColor }]}>
                <AppIcon color={severityTone.color} name={severityTone.icon} size={22} />
              </View>
              <View style={styles.heroContent}>
                <Text style={styles.heroKicker}>Alarm {alarm.id}</Text>
                <Text style={styles.heroTitle}>{alarm.title}</Text>
                <Text style={styles.heroDescription}>{alarm.description}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <DetailRow label="Status" tone={statusTone} value={alarm.status} />
              <DetailRow label="Severity" tone={severityTone} value={alarm.severity} />
              <DetailRow label="Vehicle" value={alarm.vehicleName} />
              <DetailRow label="Created" value={alarm.createdAt} />
              <DetailRow label="Updated" value={alarm.updatedAt} />
            </View>

            <View style={styles.actionsCard}>
              <Pressable disabled={busyAction !== null || alarm.status !== 'open'} onPress={() => void handleAction('acknowledge')} style={[styles.actionButton, styles.secondaryButton]}>
                <Text style={styles.secondaryButtonText}>{busyAction === 'acknowledge' ? 'Working...' : 'Acknowledge'}</Text>
              </Pressable>
              <Pressable disabled={busyAction !== null || alarm.status === 'resolved'} onPress={() => void handleAction('resolve')} style={[styles.actionButton, styles.primaryButton]}>
                <Text style={styles.primaryButtonText}>{busyAction === 'resolve' ? 'Working...' : 'Resolve'}</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <AppIcon color={colors.gray500} name="notifications-off" size={28} />
            <Text style={styles.emptyTitle}>Alarm not found</Text>
            <Text style={styles.emptyText}>The selected alarm is not available in the current feed.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value, tone }: { label: string; value: string; tone?: Tone }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      {tone ? (
        <View style={[styles.detailPill, { backgroundColor: tone.backgroundColor }]}>
          <Text style={[styles.detailValue, { color: tone.color }]}>{value}</Text>
        </View>
      ) : (
        <Text style={styles.detailValue}>{value}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  actionsCard: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: radius.md,
    flex: 1,
    paddingVertical: 14,
  },
  card: {
    backgroundColor: colors.white,
    borderBottomColor: colors.gray200,
    borderBottomWidth: 1,
    borderTopColor: colors.gray200,
    borderTopWidth: 1,
    marginTop: spacing.lg,
  },
  container: {
    backgroundColor: colors.gray50,
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  detailLabel: {
    color: colors.gray500,
    fontSize: typography.caption,
    width: 92,
  },
  detailPill: {
    borderRadius: radius.xl,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  detailRow: {
    alignItems: 'center',
    borderBottomColor: colors.gray200,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  detailValue: {
    color: colors.gray900,
    flex: 1,
    fontSize: typography.body,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
  },
  emptyText: {
    color: colors.gray500,
    fontSize: typography.caption,
    lineHeight: 18,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  emptyTitle: {
    color: colors.gray900,
    fontSize: typography.body,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  hero: {
    alignItems: 'center',
    backgroundColor: colors.white,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  heroContent: {
    flex: 1,
  },
  heroDescription: {
    color: colors.gray500,
    fontSize: typography.caption,
    marginTop: 2,
  },
  heroIcon: {
    alignItems: 'center',
    borderRadius: radius.md,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  heroKicker: {
    color: colors.gray500,
    fontSize: typography.tiny,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: colors.gray900,
    fontSize: typography.section,
    fontWeight: '700',
    marginTop: 2,
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
  primaryButton: {
    backgroundColor: colors.blue600,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: colors.blue50,
  },
  secondaryButtonText: {
    color: colors.blue600,
    fontSize: typography.caption,
    fontWeight: '700',
  },
});