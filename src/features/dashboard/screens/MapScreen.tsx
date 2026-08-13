import { AppIcon } from "../../../shared/components/AppIcon";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Dimensions,
  Animated,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

import { DrawerParamList } from "../../../app/navigation/types";
import { fetchVehicles } from "../../fleet/api/vehicles";
import { VehicleMarker } from "../../../shared/components/VehicleMarker";
import { ZoomControls } from "../../../shared/components/ZoomControls";
import {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from "../../../shared/theme/theme";
import { Vehicle } from "../../../shared/types/models";

type Props = DrawerScreenProps<DrawerParamList, "LiveMap">;

const mapRefreshMs = 1500;
const vehicleSearchResultCount = 6;
const mapProvider = PROVIDER_GOOGLE;
const { height: screenHeight } = Dimensions.get("window");
const PANEL_HEIGHT = screenHeight * 0.3;

function markerColor(status: Vehicle["status"]) {
  switch (status) {
    case "alert":
      return colors.alert;
    case "idle":
      return colors.idle;
    case "off":
      return colors.off;
    case "active":
    default:
      return colors.blue600;
  }
}

export function MapScreen({ navigation }: Props) {
  const [vehicleItems, setVehicleItems] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [vehicleSource, setVehicleSource] = useState<
    "remote" | "mock" | "error" | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
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

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null,
  );
  const panelTranslateY = useRef(new Animated.Value(PANEL_HEIGHT)).current;

  const suppressNextMapPress = useRef(false);

  // Derive the live vehicle from the refreshed list so the panel values
  // (speed, status, signal) update on each fetch.
  const selectedVehicle = useMemo(
    () =>
      vehicleItems.find((vehicle) => vehicle.id === selectedVehicleId) ?? null,
    [vehicleItems, selectedVehicleId],
  );

  function openVehiclePanel(vehicle: Vehicle) {
    setSelectedVehicleId(vehicle.id);
    Animated.timing(panelTranslateY, {
      toValue: 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }

  function closeVehiclePanel() {
    Animated.timing(panelTranslateY, {
      toValue: PANEL_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setSelectedVehicleId(null));
  }

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
    setVehicleSource(result.source);
    setNotice(result.message ?? null);
    setIsLoading(false);
  }

  const mappableVehicles = useMemo(
    () =>
      vehicleItems.filter(
        (vehicle) =>
          typeof vehicle.latitude === "number" &&
          typeof vehicle.longitude === "number",
      ),
    [vehicleItems],
  );

  const visibleVehicles = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return mappableVehicles;
    }

    return mappableVehicles.filter((vehicle) => {
      const haystack = [vehicle.name, vehicle.meta].join(" ").toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [mappableVehicles, searchQuery]);

  const searchResults = useMemo(
    () => visibleVehicles.slice(0, vehicleSearchResultCount),
    [visibleVehicles],
  );

  const statusCount = useMemo(
    () => ({
      active: vehicleItems.filter((item) => item.status === "active").length,
      alert: vehicleItems.filter((item) => item.status === "alert").length,
      idle: vehicleItems.filter((item) => item.status === "idle").length,
      off: vehicleItems.filter((item) => item.status === "off").length,
    }),
    [vehicleItems],
  );

  const initialRegion = useMemo(() => {
    const firstVehicle = mappableVehicles[0];

    if (
      !firstVehicle ||
      firstVehicle.latitude === undefined ||
      firstVehicle.longitude === undefined
    ) {
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
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        <MapView
          initialRegion={initialRegion}
          onMapReady={() => {
            setIsMapReady(true);
          }}
          onRegionChangeComplete={(region) => {
            regionRef.current = region;
          }}
          provider={mapProvider}
          ref={mapRef}
          showsCompass={false}
          showsMyLocationButton={false}
          style={styles.map}
          onPress={() =>{
            if (suppressNextMapPress.current) {
              suppressNextMapPress.current = false;
              return;
            }
            closeVehiclePanel();  
          }}
        >
          {mappableVehicles.map((vehicle) => (
            <VehicleMarker
              key={vehicle.id}
              onPress={() => {
                openVehiclePanel(vehicle);
                suppressNextMapPress.current = true;
              }}
              coordinate={{
                latitude: vehicle.latitude!,
                longitude: vehicle.longitude!,
              }}
              heading={vehicle.heading}
              variant={
                vehicle.id === selectedVehicleId
                  ? 'selected'
                  : vehicle.status === 'off'
                    ? 'inactive'
                    : 'default'
              }
            />
          ))}
        </MapView>

        <View style={styles.mapHeader}>
          <Pressable onPress={navigation.openDrawer} style={styles.menuButton}>
            <AppIcon color={colors.gray900} name="menu" size={22} />
          </Pressable>
          <View style={styles.searchContainer}>
            <View style={styles.searchField}>
              <AppIcon color={colors.gray500} name="search" size={16} />
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
                <Pressable hitSlop={8} onPress={() => setSearchQuery("")}>
                  <AppIcon color={colors.gray500} name="cancel" size={18} />
                </Pressable>
              ) : null}
            </View>

            {isSearchFocused ? (
              <View style={styles.searchResults}>
                {searchResults.length > 0 ? (
                  searchResults.map((vehicle) => (
                    <Pressable
                      key={vehicle.id}
                      onPress={() => zoomToVehicle(vehicle)}
                      style={styles.searchResultItem}
                    >
                      <View
                        style={[
                          styles.searchResultDot,
                          { backgroundColor: markerColor(vehicle.status) },
                        ]}
                      />
                      <View style={styles.searchResultBody}>
                        <Text
                          numberOfLines={1}
                          style={styles.searchResultTitle}
                        >
                          {vehicle.name}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={styles.searchResultSubtitle}
                        ></Text>
                      </View>
                    </Pressable>
                  ))
                ) : (
                  <View style={styles.searchEmptyState}>
                    <Text style={styles.searchEmptyText}>
                      No vehicles match that search.
                    </Text>
                  </View>
                )}
              </View>
            ) : null}
          </View>
        </View>

        {notice ? (
          <View style={styles.noticeBanner}>
            <AppIcon color={colors.blue900} name="info-outline" size={16} />
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={colors.blue600} size="small" />
            <Text style={styles.loadingText}>Loading live vehicle map...</Text>
          </View>
        ) : null}

        <ZoomControls mapRef={mapRef} />

        {__DEV__ ? (
          <View style={styles.debugBanner}>
            <Text style={styles.debugText}>
              mapReady: {isMapReady ? "yes" : "no"}
            </Text>
            <Text style={styles.debugText}>
              vehicles: {vehicleItems.length}
            </Text>
            <Text style={styles.debugText}>
              mappable: {mappableVehicles.length}
            </Text>
            <Text style={styles.debugText}>
              visible: {visibleVehicles.length}
            </Text>
            <Text style={styles.debugText}>
              source: {vehicleSource ?? "n/a"}
            </Text>
          </View>
        ) : null}

        <View style={styles.statBar}>
          <View style={styles.statItem}>
            <View
              style={[styles.statDot, { backgroundColor: colors.active }]}
            />
            <Text style={styles.statNumber}>{statusCount.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          {/* <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: colors.alert }]} />
            <Text style={styles.statNumber}>{statusCount.alert}</Text>
            <Text style={styles.statLabel}>Alerts</Text>
          </View> */}
          {/* <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: colors.idle }]} />
            <Text style={styles.statNumber}>{statusCount.idle}</Text>
            <Text style={styles.statLabel}>Idle</Text>
          </View> */}
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: colors.off }]} />
            <Text style={styles.statNumber}>{statusCount.off}</Text>
            <Text style={styles.statLabel}>Offline</Text>
          </View>
        </View>
      </View>

      {selectedVehicle ? (
        <Animated.View
          style={[
            styles.vehiclePanel,
            { transform: [{ translateY: panelTranslateY }] },
          ]}
        >
          <View style={styles.panelHandle} />
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>{selectedVehicle.name}</Text>
            <Pressable hitSlop={8} onPress={closeVehiclePanel}>
              <AppIcon color={colors.gray500} name="cancel" size={20} />
            </Pressable>
          </View>
          <Text style={styles.panelSubtitle}>
            {/* {selectedVehicle.meta || 'Vehicle'} */}
          </Text>
          <View style={styles.panelStats}>
            <View style={styles.panelStat}>
              <Text style={styles.panelStatValue}>
                {selectedVehicle.speed ?? '—'} km/h
              </Text>
              <Text style={styles.panelStatLabel}>Speed </Text>
            </View>
            <View style={styles.panelStat}>
              <View style={styles.panelStatusRow}>
                <View
                  style={[
                    styles.panelStatusDot,
                    {
                      backgroundColor:
                        selectedVehicle.status === 'active'
                          ? colors.activeText
                          : markerColor(selectedVehicle.status),
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.panelStatValue,
                    // { color: markerColor(selectedVehicle.status) },
                  ]}
                >
                  {selectedVehicle.status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.panelStatLabel}>Status</Text>
            </View>
            <View style={styles.panelStat}>
              <View style={styles.signalBars}>
                {[1, 2, 3, 4, 5].map((bar) => {
                  const isActive = bar <= (selectedVehicle.signal ?? 0);
                  const color = isActive
                    ? (selectedVehicle.signal ?? 0) > 3
                      ? colors.activeText
                      : (selectedVehicle.signal ?? 0) === 3
                        ? colors.idle
                        : colors.alert
                    : colors.gray200;
                  return (
                    <View
                      key={bar}
                      style={[
                        styles.signalBar,
                        { height: 6 + bar * 3, backgroundColor: color },
                      ]}
                    />
                  );
                })}
              </View>
              <Text style={styles.panelStatLabel}>Signal</Text>
            </View>
          </View>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray50,
    flex: 1,
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    ...shadows.card,
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.white,
    borderRadius: radius.md,
    bottom: 118,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    position: "absolute",
  },
  loadingText: {
    color: colors.gray700,
    fontSize: typography.caption,
  },
  map: {
    backgroundColor: colors.gray200,
    flex: 1,
  },
  debugBanner: {
    backgroundColor: "rgba(24, 95, 165, 0.88)",
    borderRadius: radius.md,
    bottom: 92,
    gap: 2,
    maxWidth: 220,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    position: "absolute",
    right: spacing.lg,
    zIndex: 4,
  },
  debugText: {
    color: colors.white,
    fontSize: typography.tiny,
    fontWeight: "600",
  },
  mapHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    left: spacing.lg,
    position: "absolute",
    right: spacing.lg,
    top: spacing.lg,
    zIndex: 4,
  },
  menuButton: {
    ...shadows.card,
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.md,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  noticeBanner: {
    alignItems: "center",
    backgroundColor: colors.blue50,
    borderColor: colors.blue100,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    left: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    position: "absolute",
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
    position: "relative",
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
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    flexDirection: "row",
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
    overflow: "hidden",
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
    alignItems: "flex-start",
    flexDirection: "row",
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
    fontWeight: "600",
  },
  statBar: {
    ...shadows.card,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    bottom: spacing.xxxl,
    flexDirection: "row",
    gap: spacing.lg,
    left: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    position: "absolute",
  },
  statDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  statItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  statLabel: {
    color: colors.gray500,
    fontSize: typography.tiny,
  },
  statNumber: {
    color: colors.gray900,
    fontSize: typography.body,
    fontWeight: "700",
  },
  vehiclePanel: {
    ...shadows.card,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    bottom: 0,
    height: PANEL_HEIGHT,
    left: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    position: "absolute",
    right: 0,
    zIndex: 5,
  },
  panelHandle: {
    alignSelf: "center",
    backgroundColor: colors.gray200,
    borderRadius: 2,
    height: 4,
    marginBottom: spacing.md,
    width: 36,
  },
  panelHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  panelTitle: {
    color: colors.gray900,
    fontSize: typography.body,
    fontWeight: "700",
  },
  panelSubtitle: {
    color: colors.gray500,
    fontSize: typography.caption,
    marginTop: 2,
  },
  panelStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    borderTopColor: colors.gray50,
    borderTopWidth: 1,
    paddingTop: spacing.lg,
    borderBottomColor: colors.gray50,
    borderBottomWidth: 1,
    paddingBottom: spacing.lg,
  },
  panelStat: {
    alignItems: "center",
    flex: 1,
  },
  panelStatValue: {
    color: colors.gray900,
    fontSize: typography.heading,
    fontWeight: "700",
  },
  panelStatLabel: {
    color: colors.gray500,
    fontSize: typography.caption,
    marginTop: spacing.xs,
  },
  panelStatusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  panelStatusDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  signalBars: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 3,
    height: 22,
    justifyContent: "center",
  },
  signalBar: {
    borderRadius: 2,
    width: 4,
  },
});
