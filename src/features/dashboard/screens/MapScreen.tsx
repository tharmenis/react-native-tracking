import { Ionicons } from '@expo/vector-icons';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DrawerParamList } from '../../../app/navigation/types';
import { fetchVehicles } from '../../fleet/api/vehicles';
import { colors, radius, shadows, spacing, typography } from '../../../shared/theme/theme';
import { Vehicle } from '../../../shared/types/models';

type Props = DrawerScreenProps<DrawerParamList, 'LiveMap'>;

const mapRefreshMs = 1500;
const minDelta = 0.002;
const maxDelta = 40;
const vehicleSearchResultCount = 6;

function markerColor(status: Vehicle['status']) {
  switch (status) {
    case 'alert':
      return colors.alert;
    case 'idle':
      return colors.idle;
    case 'off':
      return colors.off;
    case 'active':
    default:
      return colors.blue600;
  }
}

export function MapScreen({ navigation }: Props) {
  const [vehicleItems, setVehicleItems] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const mapRef = useRef<MapView | null>(null);
  const hasAutoFitted = useRef(false);
  const regionRef = useRef<Region>({
    latitude: -1.286389,
    longitude: 36.817223,
    latitudeDelta: 2.4,
    longitudeDelta: 2.4,
  });

  useEffect(() => {
    const controller = new AbortController();

    void loadVehicles(controller.signal, true);

    const refreshId = setInterval(() => {
      void loadVehicles();
    }, mapRefreshMs);

    return () => {
      controller.abort();
      clearInterval(refreshId);
    };
  }, []);

  async function loadVehicles(signal?: AbortSignal, firstLoad = false) {
    if (firstLoad) {
      setIsLoading(true);
    }

    const result = await fetchVehicles({ signal });

    setVehicleItems(result.vehicles);
    setNotice(result.message ?? null);
    setIsLoading(false);
  }

  const mappableVehicles = useMemo(
    () => vehicleItems.filter((vehicle) => typeof vehicle.latitude === 'number' && typeof vehicle.longitude === 'number'),
    [vehicleItems],
  );

  const visibleVehicles = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return mappableVehicles;
    }

    return mappableVehicles.filter((vehicle) => {
      const haystack = [vehicle.name, vehicle.plate, vehicle.driver, vehicle.meta].join(' ').toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [mappableVehicles, searchQuery]);

  const searchResults = useMemo(() => visibleVehicles.slice(0, vehicleSearchResultCount), [visibleVehicles]);

  const statusCount = useMemo(() => ({
    active: vehicleItems.filter((item) => item.status === 'active').length,
    alert: vehicleItems.filter((item) => item.status === 'alert').length,
    idle: vehicleItems.filter((item) => item.status === 'idle').length,
    off: vehicleItems.filter((item) => item.status === 'off').length,
  }), [vehicleItems]);

  const initialRegion = useMemo(() => {
    const firstVehicle = mappableVehicles[0];

    if (!firstVehicle || firstVehicle.latitude === undefined || firstVehicle.longitude === undefined) {
      return {
        latitude: -1.286389,
        longitude: 36.817223,
        latitudeDelta: 2.4,
        longitudeDelta: 2.4,
      };
    }

    return {
      latitude: firstVehicle.latitude,
      longitude: firstVehicle.longitude,
      latitudeDelta: 0.8,
      longitudeDelta: 0.8,
    };
  }, [mappableVehicles]);

  useEffect(() => {
    if (!isMapReady || hasAutoFitted.current || mappableVehicles.length === 0) {
      return;
    }

    hasAutoFitted.current = true;

    if (mappableVehicles.length === 1) {
      const vehicle = mappableVehicles[0];

      if (vehicle.latitude !== undefined && vehicle.longitude !== undefined) {
        const singleRegion: Region = {
          latitude: vehicle.latitude,
          longitude: vehicle.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        };

        regionRef.current = singleRegion;
        mapRef.current?.animateToRegion(singleRegion, 350);
      }

      return;
    }

    mapRef.current?.fitToCoordinates(
      mappableVehicles.map((vehicle) => ({
        latitude: vehicle.latitude as number,
        longitude: vehicle.longitude as number,
      })),
      {
        animated: true,
        edgePadding: {
          top: 130,
          right: 56,
          bottom: 150,
          left: 56,
        },
      },
    );
  }, [isMapReady, mappableVehicles]);

  function zoomBy(factor: number) {
    const nextRegion: Region = {
      ...regionRef.current,
      latitudeDelta: Math.min(maxDelta, Math.max(minDelta, regionRef.current.latitudeDelta * factor)),
      longitudeDelta: Math.min(maxDelta, Math.max(minDelta, regionRef.current.longitudeDelta * factor)),
    };

    regionRef.current = nextRegion;
    mapRef.current?.animateToRegion(nextRegion, 220);
  }

  function zoomToVehicle(vehicle: Vehicle) {
    if (vehicle.latitude === undefined || vehicle.longitude === undefined) {
      return;
    }

    const nextRegion: Region = {
      latitude: vehicle.latitude,
      longitude: vehicle.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };

    regionRef.current = nextRegion;
    mapRef.current?.animateToRegion(nextRegion, 320);
    setSearchQuery(vehicle.name);
    setIsSearchFocused(false);
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        <MapView
          initialRegion={initialRegion}
          onMapReady={() => {
            setIsMapReady(true);
          }}
          onRegionChangeComplete={(region) => {
            regionRef.current = region;
          }}
          provider={PROVIDER_GOOGLE}
          ref={mapRef}
          showsCompass={false}
          showsMyLocationButton={false}
          style={styles.map}
        >
          {mappableVehicles.map((vehicle) => (
            <Marker
              coordinate={{ latitude: vehicle.latitude as number, longitude: vehicle.longitude as number }}
              key={vehicle.id}
              pinColor={markerColor(vehicle.status)}
              rotation={vehicle.heading ?? 0}
              title={`${vehicle.name} (${vehicle.plate})`}
              description={`${vehicle.driver} · ${vehicle.meta}`}
            />
          ))}
        </MapView>

        <View style={styles.mapHeader}>
          <Pressable onPress={navigation.openDrawer} style={styles.menuButton}>
            <Ionicons color={colors.gray900} name="menu" size={22} />
          </Pressable>
          <View style={styles.searchContainer}>
            <View style={styles.searchField}>
              <Ionicons color={colors.gray500} name="search-outline" size={16} />
              <TextInput
                onBlur={() => {
                  setTimeout(() => setIsSearchFocused(false), 120);
                }}
                onChangeText={setSearchQuery}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search vehicle"
                placeholderTextColor={colors.gray500}
                returnKeyType="search"
                style={styles.searchInput}
                value={searchQuery}
              />
              {searchQuery.length > 0 ? (
                <Pressable hitSlop={8} onPress={() => setSearchQuery('')}>
                  <Ionicons color={colors.gray500} name="close-circle" size={18} />
                </Pressable>
              ) : null}
            </View>

            {isSearchFocused ? (
              <View style={styles.searchResults}>
                {searchResults.length > 0 ? (
                  searchResults.map((vehicle) => (
                    <Pressable key={vehicle.id} onPress={() => zoomToVehicle(vehicle)} style={styles.searchResultItem}>
                      <View style={[styles.searchResultDot, { backgroundColor: markerColor(vehicle.status) }]} />
                      <View style={styles.searchResultBody}>
                        <Text numberOfLines={1} style={styles.searchResultTitle}>{vehicle.name}</Text>
                        <Text numberOfLines={1} style={styles.searchResultSubtitle}>
                          {vehicle.plate} · {vehicle.driver}
                        </Text>
                      </View>
                    </Pressable>
                  ))
                ) : (
                  <View style={styles.searchEmptyState}>
                    <Text style={styles.searchEmptyText}>No vehicles match that search.</Text>
                  </View>
                )}
              </View>
            ) : null}
          </View>
        </View>

        {notice ? (
          <View style={styles.noticeBanner}>
            <Ionicons color={colors.blue900} name="information-circle-outline" size={16} />
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={colors.blue600} size="small" />
            <Text style={styles.loadingText}>Loading live vehicle map...</Text>
          </View>
        ) : null}

        <View style={styles.zoomControls}>
          <Pressable onPress={() => zoomBy(0.5)} style={styles.zoomButton}>
            <Ionicons color={colors.blue600} name="add" size={20} />
          </Pressable>
          <View style={styles.zoomDivider} />
          <Pressable onPress={() => zoomBy(2)} style={styles.zoomButton}>
            <Ionicons color={colors.blue600} name="remove" size={20} />
          </Pressable>
        </View>

        <View style={styles.statBar}>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: colors.active }]} />
            <Text style={styles.statNumber}>{statusCount.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: colors.alert }]} />
            <Text style={styles.statNumber}>{statusCount.alert}</Text>
            <Text style={styles.statLabel}>Alerts</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: colors.idle }]} />
            <Text style={styles.statNumber}>{statusCount.idle}</Text>
            <Text style={styles.statLabel}>Idle</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: colors.off }]} />
            <Text style={styles.statNumber}>{statusCount.off}</Text>
            <Text style={styles.statLabel}>Offline</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray50,
    flex: 1,
  },
  loadingOverlay: {
    ...shadows.card,
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    bottom: 118,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    position: 'absolute',
  },
  loadingText: {
    color: colors.gray700,
    fontSize: typography.caption,
  },
  map: {
    backgroundColor: colors.gray200,
    flex: 1,
  },
  mapHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    left: spacing.lg,
    position: 'absolute',
    right: spacing.lg,
    top: spacing.lg,
    zIndex: 4,
  },
  menuButton: {
    ...shadows.card,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  noticeBanner: {
    alignItems: 'center',
    backgroundColor: colors.blue50,
    borderColor: colors.blue100,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    left: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    position: 'absolute',
    right: spacing.lg,
    top: 84,
    zIndex: 4,
  },
  noticeText: {
    color: colors.blue900,
    flex: 1,
    fontSize: typography.caption,
  },
  safeArea: {
    backgroundColor: colors.gray50,
    flex: 1,
  },
  searchContainer: {
    flex: 1,
    position: 'relative',
  },
  searchEmptyState: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchEmptyText: {
    color: colors.gray500,
    fontSize: typography.caption,
  },
  searchField: {
    ...shadows.card,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 44,
    paddingHorizontal: spacing.lg,
  },
  searchInput: {
    flex: 1,
    color: colors.gray900,
    fontSize: typography.body,
    minWidth: 0,
    paddingVertical: 0,
  },
  searchResults: {
    ...shadows.card,
    backgroundColor: colors.white,
    borderColor: colors.gray200,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.sm,
    maxHeight: 256,
    overflow: 'hidden',
  },
  searchResultBody: {
    flex: 1,
  },
  searchResultDot: {
    borderRadius: 5,
    height: 10,
    marginTop: 5,
    width: 10,
  },
  searchResultItem: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchResultSubtitle: {
    color: colors.gray500,
    fontSize: typography.caption,
    marginTop: 2,
  },
  searchResultTitle: {
    color: colors.gray900,
    fontSize: typography.body,
    fontWeight: '600',
  },
  statBar: {
    ...shadows.card,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    bottom: spacing.xxxl,
    flexDirection: 'row',
    gap: spacing.lg,
    left: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    position: 'absolute',
  },
  statDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  statItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  statLabel: {
    color: colors.gray500,
    fontSize: typography.tiny,
  },
  statNumber: {
    color: colors.gray900,
    fontSize: typography.body,
    fontWeight: '700',
  },
  zoomButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  zoomControls: {
    ...shadows.card,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    gap: spacing.xs,
    padding: spacing.xs,
    position: 'absolute',
    right: spacing.lg,
    top: 150,
    zIndex: 4,
  },
  zoomDivider: {
    backgroundColor: colors.gray200,
    height: 1,
    marginHorizontal: spacing.xs,
  },
});
