export enum VehicleType {
  CAR = 'Car',
  MOTORBIKE = 'Motorbike',
  TRACTOR = 'Tractor',
  EMERGENCY = 'Emergency',
  DIPLOMAT = 'Diplomat',
  FOREIGN = 'Foreign',
  MILITARY = 'Military',
  BUS = 'Bus',
}

export class Vehicle {
  private readonly type: VehicleType;

  constructor(type: VehicleType) {
    this.type = type;
  }

  getType(): VehicleType {
    return this.type;
  }

  isTollFree(): boolean {
    return [
      VehicleType.MOTORBIKE,
      VehicleType.EMERGENCY,
      VehicleType.DIPLOMAT,
      VehicleType.FOREIGN,
      VehicleType.MILITARY,
      VehicleType.TRACTOR,
      VehicleType.BUS,
    ].includes(this.type);
  }
}
