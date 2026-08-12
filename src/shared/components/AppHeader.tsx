import { AppIcon, AppIconName } from './AppIcon';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '../theme/theme';

type HeaderAction = {
  icon: AppIconName;
  onPress?: () => void;
};

type AppHeaderProps = {
  title: string;
  onMenuPress?: () => void;
  onBackPress?: () => void;
  rightAction?: HeaderAction;
};

export function AppHeader({ title, onMenuPress, onBackPress, rightAction }: AppHeaderProps) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        <Pressable onPress={onBackPress ?? onMenuPress} style={styles.iconButton}>
          <AppIcon
            color={colors.gray900}
            name={onBackPress ? 'arrow-back' : 'menu'}
            size={22}
          />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        {rightAction ? (
          <Pressable onPress={rightAction.onPress} style={styles.iconButton}>
            <AppIcon color={colors.blue600} name={rightAction.icon} size={20} />
          </Pressable>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.white,
  },
  container: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderBottomColor: colors.gray200,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  iconButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  iconPlaceholder: {
    width: 40,
  },
  title: {
    color: colors.blue900,
    flex: 1,
    fontSize: typography.section,
    fontWeight: '700',
  },
});