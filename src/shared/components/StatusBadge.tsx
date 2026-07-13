import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme/theme';
import { VehicleStatus } from '../types/models';

type StatusBadgeProps = {
  status: VehicleStatus;
  label?: string;
};

const badgeStyleMap = {
  active: { container: 'activeContainer', text: 'activeText', label: 'Active' },
  idle: { container: 'idleContainer', text: 'idleText', label: 'Idle' },
  alert: { container: 'alertContainer', text: 'alertText', label: 'Alert' },
  off: { container: 'offContainer', text: 'offText', label: 'Parked' },
} as const;

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const styleKey = badgeStyleMap[status];

  return (
    <View style={[styles.base, styles[styleKey.container]]}>
      <Text style={[styles.text, styles[styleKey.text]]}>{label ?? styleKey.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  activeContainer: {
    backgroundColor: colors.activeBg,
  },
  activeText: {
    color: colors.activeText,
  },
  alertContainer: {
    backgroundColor: colors.alertBg,
  },
  alertText: {
    color: colors.alertText,
  },
  base: {
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
  },
  idleContainer: {
    backgroundColor: colors.idleBg,
  },
  idleText: {
    color: colors.idleText,
  },
  offContainer: {
    backgroundColor: colors.offBg,
  },
  offText: {
    color: colors.offText,
  },
  text: {
    fontSize: typography.tiny,
    fontWeight: '600',
  },
});