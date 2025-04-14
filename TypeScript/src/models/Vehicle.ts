/**
 * Represents different types of vehicles for toll fee calculations.
 */
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

/**
 * Base class for all vehicle types in the toll system.
 * Provides common functionality for determining toll exemption status.
 */
export class Vehicle {
  private readonly type: VehicleType;

  /**
   * Creates a new vehicle with the specified type.
   *
   * @param type - The type of vehicle
   */
  constructor(type: VehicleType) {
    this.type = type;
  }

  /**
   * Gets the type of the vehicle.
   *
   * @returns The vehicle type
   */
  getType(): VehicleType {
    return this.type;
  }

  /**
   * Determines if the vehicle is exempt from toll fees.
   * According to current regulations, vehicles like motorbikes, emergency vehicles,
   * diplomatic vehicles, foreign vehicles, military vehicles, tractors, and buses
   * are exempt from toll fees.
   *
   * @returns True if the vehicle is exempt from toll fees, false otherwise
   */
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
