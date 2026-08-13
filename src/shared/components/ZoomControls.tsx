import { Pressable, StyleSheet, View } from "react-native";
import MapView from "react-native-maps";

import { colors, radius, shadows, spacing } from "../theme/theme";
import { AppIcon } from "./AppIcon";

type ZoomControlsProps = {
  /** The map this control zooms. */
  mapRef: React.RefObject<MapView | null>;
  /** Zoom multiplier per press. Defaults to 1.5. */
  zoomFactor?: number;
};

/**
 * Reusable floating zoom in/out control cluster for map screens.
 * Zooms the provided map around its current center via getCamera/animateCamera.
 */
export function ZoomControls({ mapRef, zoomFactor = 1.15 }: ZoomControlsProps) {
  const zoomBy = (factor: number) => {
    mapRef.current?.getCamera().then((camera) => {
      mapRef.current?.animateCamera(
        { ...camera, zoom: camera.zoom * factor },
        { duration: 220 },
      );
    });
  };

  return (
    <View style={styles.zoomControls}>
      <Pressable onPress={() => zoomBy(zoomFactor)} style={styles.zoomButton}>
        <AppIcon color={colors.blue600} name="add" size={20} />
      </Pressable>
      <View style={styles.zoomDivider} />
      <Pressable onPress={() => zoomBy(1 / zoomFactor)} style={styles.zoomButton}>
        <AppIcon color={colors.blue600} name="remove" size={20} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  zoomControls: {
    ...shadows.card,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    gap: spacing.xs,
    padding: spacing.xs,
    position: "absolute",
    right: spacing.lg,
    top: 150,
    zIndex: 4,
  },
  zoomButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  zoomDivider: {
    backgroundColor: colors.gray200,
    height: 1,
    marginHorizontal: spacing.xs,
  },
});
