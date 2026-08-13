export type VehicleStatus = 'active' | 'idle' | 'alert' | 'off';
export type AlertSeverity = 'danger' | 'warning' | 'info' | 'success';

export type AlarmSeverity = 'high' | 'medium' | 'low';

export type AlarmStatus = 'open' | 'acknowledged' | 'resolved';

export type Vehicle = {
  id: string;
  name: string;
  type: string;
  meta: string;
  status: VehicleStatus;
  imei: string;
  latitude?: number;
  longitude?: number;
  heading?: number;
  signal?: number;
  speed?: number;
  connected?: boolean;
  lastSeen?: string;
};

export type Driver = {
  id: string;
  initials: string;
  name: string;
  vehicle: string;
  route: string;
  status: VehicleStatus;
  phone: string;
  licenseNumber: string;
  licenseClass: string;
  expiryDate: string;
};

export type AlertItem = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  severity: AlertSeverity;
  read: boolean;
};

export type Alarm = {
  id: string;
  title: string;
  description: string;
  severity: AlarmSeverity;
  status: AlarmStatus;
  vehicleId: string;
  vehicleName: string;
  createdAt: string;
  updatedAt: string;
};

export type Trip = {
  id: string;
  vehicleName: string;
  origin: string;
  destination: string;
  distance: string;
  duration: string;
  avgSpeed: string;
  status: 'completed' | 'inProgress';
};