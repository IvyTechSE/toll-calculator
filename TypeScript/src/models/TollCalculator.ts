import type { Vehicle } from './Vehicle';

export class TollCalculator {
  public calculateFee(vehicle: Vehicle, date: Date) {
    if (vehicle.isTollFree()) return 0;

    return 5;
  }
}
