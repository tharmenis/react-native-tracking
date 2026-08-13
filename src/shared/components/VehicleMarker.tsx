import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";
import Svg, { Path, Polygon } from "react-native-svg";

import { colors } from "../theme/theme";
import { AppIcon, AppIconName } from "./AppIcon";

const PIN_WIDTH = 52.916665;
const PIN_HEIGHT = 52.916666;
const PIN_SCALE = 0.76;
const DISPLAY_WIDTH = PIN_WIDTH * PIN_SCALE; // ~37
const DISPLAY_HEIGHT = PIN_HEIGHT * PIN_SCALE; // ~37

const PIN_PATH =
  "m 40.806862,33.908023 c -3.58073,5.29257 -14.348533,18.526424 -14.348533,18.526424 0,0 -10.767871,-13.233854 -14.348538,-18.526424 C 5.0576793,23.484351 6.0126623,13.212617 13.287194,5.9380875 16.92446,2.3008218 21.691425,0.48221971 26.458391,0.48221971 c 4.766967,0 9.533931,1.81860209 13.171197,5.45586779 7.274404,7.2745295 8.229388,17.5462635 1.177274,27.9699355 z";

type VehicleMarkerVariant = "default" | "inactive" | "selected";

type VehicleMarkerProps = {
  coordinate: { latitude: number; longitude: number };
  heading?: number;
  signal?: number;
  onPress?: () => void;
  /** Material icon shown in the pin's head. */
  icon?: AppIconName;
  /** Styling variant: default (active), inactive (off/greyed), selected. */
  variant?: VehicleMarkerVariant;
};

// Per-variant colors so styling stays centralized in this component.
const VARIANT_COLORS: Record<VehicleMarkerVariant, { pin: string; icon: string; arrow: string }> = {
  default: { pin: colors.blue600, icon: colors.blue600, arrow: colors.alert },
  inactive: { pin: colors.gray200, icon: colors.gray500, arrow: colors.gray200 },
  selected: { pin: colors.activeText, icon: colors.activeText, arrow: colors.alert },
};

function VehicleMarkerBase({
  coordinate,
  heading,
  onPress,
  icon = "directions-car",
  variant = "default",
}: VehicleMarkerProps) {
  if (coordinate.latitude === undefined || coordinate.longitude === undefined) {
    return null;
  }

  const palette = VARIANT_COLORS[variant];

  return (
    <Marker
      anchor={{ x: 0.5, y: 1 }}
      coordinate={coordinate}
      onPress={onPress}
      tracksViewChanges={true}
    >
      <View style={styles.markerBase}>
        <Svg
          height={DISPLAY_HEIGHT}
          viewBox={`0 0 ${PIN_WIDTH} ${PIN_HEIGHT}`}
          width={DISPLAY_WIDTH}
        >
          <Path d={PIN_PATH} fill={palette.pin} />
        </Svg>

        <View
          style={[
            styles.rotatingHolder,
            {
              transform: [{ rotate: `${heading ?? 0}deg` }],
              transformOrigin: "center center",
            },
          ]}
        >
          <Svg
            height={9}
            style={styles.bearingArrow}
            viewBox="0 0 12 9"
            width={12}
          >
            <Polygon points="6,0 12,9 0,9" fill={palette.arrow} />
          </Svg>
        </View>
        <View style={styles.iconBadge}>
          <AppIcon color={palette.icon} name={icon} size={14} />
        </View>
      </View>
    </Marker>
  );
}

export const VehicleMarker = memo(VehicleMarkerBase);

const styles = StyleSheet.create({
  markerBase: {
    width: DISPLAY_WIDTH,
    height: DISPLAY_HEIGHT,
    alignItems: "center",
    justifyContent: "flex-start",
    position: "relative",
    overflow: "visible",
  },
  iconBadge: {
    position: "absolute",
    top: DISPLAY_HEIGHT * 0.12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  rotatingHolder: {
    position: "absolute",
    // Anchor the holder's bottom edge to the badge's top edge.
    top: DISPLAY_HEIGHT * 0.12,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.blue100,
    overflow: "visible",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 4,
  },
  bearingArrow: {
    position: "absolute",
    top: 0,
    left: "50%",
    alignSelf: "center",
    transform: [{ translateX: "-50%" }, { translateY: "-90%" }],
  },
});
