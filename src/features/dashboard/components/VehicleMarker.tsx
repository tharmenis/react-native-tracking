import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';
import Svg, { Polygon } from 'react-native-svg';

import { colors } from '../../../shared/theme/theme';
import { Vehicle } from '../../../shared/types/models';

const CIRCLE_SIZE = 26;
const OVERHANG = 10;
const CONTAINER_SIZE = CIRCLE_SIZE + OVERHANG * 2; // 46

type VehicleMarkerProps = {
  vehicle: Vehicle;
  onPress?: (vehicle: Vehicle) => void;
};

function VehicleMarkerBase({ vehicle, onPress }: VehicleMarkerProps) {
  if (vehicle.latitude === undefined || vehicle.longitude === undefined) {
    return null;
  }

  return (
    <Marker
      anchor={{ x: 0.5, y: 0.5 }}
      coordinate={{ latitude: vehicle.latitude, longitude: vehicle.longitude }}
      onPress={() => onPress?.(vehicle)}
      tracksViewChanges={true}
      title={`${vehicle.name} (${vehicle.plate})`}
      description={`${vehicle.driver} · ${vehicle.meta}`}
    >
      <View style={styles.markerBase}>
  <View style={styles.markerCircle} />
  <View style={[styles.rotatingHolder, { transform: [{ rotate: `${vehicle.heading ?? 0}deg` }] }]}>
    <Svg height={7.2} style={styles.markerArrow} viewBox="0 0 14 7.2" width={14}>
  <Polygon points="7,0 14,7.2 0,7.2" fill={colors.blue200} />
</Svg>
  </View>
</View>
    </Marker>
    
  );
}

export const VehicleMarker = memo(VehicleMarkerBase);

const styles = StyleSheet.create({
  markerBase: {
    width: CONTAINER_SIZE,
    height: CONTAINER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: colors.gray900,
    borderColor: colors.white,
    borderWidth: 2,
  },
  rotatingHolder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  markerArrow: {
    position: 'absolute',
   top: 4.8, 
  },
});