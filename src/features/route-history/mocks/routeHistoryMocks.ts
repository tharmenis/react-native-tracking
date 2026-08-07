import { Vehicle, Trip } from '../../../shared/types/models';

// Mock vehicles data
export const vehicles: Vehicle[] = [
  {
    id: 'truck-001',
    name: 'Truck 12',
    plate: 'AB-1234-CD',
    driver: 'Driver Name',
    status: 'active',
    meta: 'Active in route',
    latitude: 37.7749,
    longitude: -122.4194,
    heading: 45,
    speed: 65,
    connected: true,
    lastSeen: new Date().toISOString(),
  },
  {
    id: 'truck-002',
    name: 'Truck 13',
    plate: 'EF-5678-GH',
    driver: 'Driver Name',
    status: 'idle',
    meta: 'Idle at depot',
    latitude: 34.0522,
    longitude: -118.2437,
    heading: 90,
    speed: 0,
    connected: true,
    lastSeen: new Date().toISOString(),
  },
  {
    id: 'truck-003',
    name: 'Truck 14',
    plate: 'IJ-9012-KL',
    driver: 'Driver Name',
    status: 'off',
    meta: 'Offline for maintenance',
    latitude: 40.7128,
    longitude: -74.0060,
    heading: 180,
    speed: 0,
    connected: false,
    lastSeen: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
  {
    id: 'truck-004',
    name: 'Truck 15',
    plate: 'MN-3456-OP',
    driver: 'Driver Name',
    status: 'active',
    meta: 'Active in route',
    latitude: 29.7604,
    longitude: -95.3698,
    heading: 270,
    speed: 45,
    connected: true,
    lastSeen: new Date().toISOString(),
  },
  {
    id: 'truck-005',
    name: 'Truck 16',
    plate: 'QR-7890-ST',
    driver: 'Driver Name',
    status: 'active',
    meta: 'Active in route',
    latitude: 33.4484,
    longitude: -112.0740,
    heading: 135,
    speed: 55,
    connected: true,
    lastSeen: new Date().toISOString(),
  },
  {
    id: 'truck-006',
    name: 'Truck 17',
    plate: 'UV-2345-WX',
    driver: 'Driver Name',
    status: 'idle',
    meta: 'Idle at depot',
    latitude: 39.9526,
    longitude: -75.1652,
    heading: 0,
    speed: 0,
    connected: true,
    lastSeen: new Date().toISOString(),
  },
  {
    id: 'truck-007',
    name: 'Truck 18',
    plate: 'YZ-6789-AB',
    driver: 'Driver Name',
    status: 'active',
    meta: 'Active in route',
    latitude: 32.7765,
    longitude: -96.7970,
    heading: 225,
    speed: 70,
    connected: true,
    lastSeen: new Date().toISOString(),
  },
  {
    id: 'truck-008',
    name: 'Truck 19',
    plate: 'CD-1234-EF',
    driver: 'Driver Name',
    status: 'off',
    meta: 'Offline for maintenance',
    latitude: 36.1627,
    longitude: -115.1190,
    heading: 90,
    speed: 0,
    connected: false,
    lastSeen: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
  },
  {
    id: 'truck-009',
    name: 'Truck 20',
    plate: 'GH-5678-IJ',
    driver: 'Driver Name',
    status: 'active',
    meta: 'Active in route',
    latitude: 30.2672,
    longitude: -97.7431,
    heading: 45,
    speed: 60,
    connected: true,
    lastSeen: new Date().toISOString(),
  },
  {
    id: 'truck-010',
    name: 'Truck 21',
    plate: 'KL-9012-MN',
    driver: 'Driver Name',
    status: 'idle',
    meta: 'Idle at depot',
    latitude: 37.3382,
    longitude: -121.8863,
    heading: 180,
    speed: 0,
    connected: true,
    lastSeen: new Date().toISOString(),
  },
];

// Helper function to generate realistic trip data
function generateTrip(vehicleId: string, startTime: Date): Trip {
  const endTime = new Date(startTime.getTime() + Math.random() * 2 * 60 * 60 * 1000); // Random duration between 0-2 hours
  
  // Generate path with realistic GPS points (20-200 points)
  const pathPoints: { lat: number; lng: number; timestamp: string; speedKmh?: number }[] = [];
  const pointCount = Math.floor(Math.random() * 180) + 20; // 20-200 points
  
  const baseLat = vehicles.find(v => v.id === vehicleId)?.latitude || 37.7749;
  const baseLng = vehicles.find(v => v.id === vehicleId)?.longitude || -122.4194;
  
  for (let i = 0; i < pointCount; i++) {
    // Create realistic path with some variation
    const latVariation = (Math.random() - 0.5) * 0.01; // ±0.005 degrees
    const lngVariation = (Math.random() - 0.5) * 0.01; // ±0.005 degrees
    
    const timestamp = new Date(startTime.getTime() + (i / pointCount) * (endTime.getTime() - startTime.getTime())).toISOString();
    
    pathPoints.push({
      lat: baseLat + latVariation,
      lng: baseLng + lngVariation,
      timestamp,
      speedKmh: Math.floor(Math.random() * 40) + 30, // Speed between 30-70 km/h
    });
  }
  
  const durationMin = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));
  const avgSpeedKmh = Math.floor(Math.random() * 20) + 40; // Speed between 40-60 km/h
  
  return {
    id: `trip-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    vehicleId,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    durationMin,
    avgSpeedKmh,
    path: pathPoints,
  };
}

// Generate trips for different time ranges
const now = new Date();
const trips: Trip[] = [];

// Generate recent trips (last 6h, 12h, 1 day)
for (let i = 0; i < 30; i++) {
  const vehicleId = vehicles[Math.floor(Math.random() * vehicles.length)].id;
  
  // Create trips in different time ranges
  const hoursAgo = Math.floor(Math.random() * 24); // Random from 0-24 hours ago
  const startTime = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
  
  trips.push(generateTrip(vehicleId, startTime));
}

// Add some older trips for testing custom range
for (let i = 0; i < 10; i++) {
  const vehicleId = vehicles[Math.floor(Math.random() * vehicles.length)].id;
  
  // Create trips from 1-30 days ago
  const daysAgo = Math.floor(Math.random() * 30) + 1;
  const startTime = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  
  trips.push(generateTrip(vehicleId, startTime));
}

export { trips };

// Mock API functions that return Promises
export async function getVehicles(): Promise<Vehicle[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(() => resolve(), 500));
  return vehicles;
}

export async function getTrips(vehicleId: string, start: Date, end: Date): Promise<Trip[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(() => resolve(), 800));
  
  // Filter trips by vehicle and date range
  const filteredTrips = trips.filter(trip => 
    trip.vehicleId === vehicleId &&
    new Date(trip.startTime) >= start &&
    new Date(trip.endTime) <= end
  );
  
  // Sort by start time (newest first)
  return filteredTrips.sort((a, b) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
}