import { NavigatorScreenParams } from '@react-navigation/native';

import { Alarm, Vehicle } from '../../shared/types/models';

export type DrawerParamList = {
  LiveMap: undefined;
  Alarms: undefined;
  Vehicles: undefined;
  Drivers: undefined;
  Trips: undefined;
  Analytics: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Main: NavigatorScreenParams<DrawerParamList> | undefined;
  DriverForm: {
    mode: 'create' | 'edit';
    driverId?: string;
  };
  TripDetail: {
    tripId: string;
  };
  VehicleDetail: {
    vehicleId: string;
    vehicle?: Vehicle;
  };
  AlarmDetail: {
    alarmId: string;
    alarm?: Alarm;
  };
};