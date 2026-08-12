import { MaterialIcons } from '@expo/vector-icons';
import { TextProps } from 'react-native';

/**
 * App-wide icon component backed by MaterialIcons.
 *
 * Centralizes the icon set so screens/components import one component instead
 * of reaching into @expo/vector-icons directly. All glyph names are typed
 * against MaterialIcons.glyphMap, so invalid names fail at compile time.
 */
type AppIconProps = {
  name: keyof typeof MaterialIcons.glyphMap;
  size?: number;
  color?: string;
  style?: TextProps['style'];
};

export function AppIcon({ name, size, color, style }: AppIconProps) {
  return <MaterialIcons name={name} size={size} color={color} style={style} />;
}

export type AppIconName = keyof typeof MaterialIcons.glyphMap;
