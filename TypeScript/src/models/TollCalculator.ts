import { DateService } from '../services/DateService';
import type { Vehicle } from './Vehicle';

export class TollCalculator {
  private dateService: DateService;

  constructor() {
    this.dateService = new DateService([new Date('2025-12-24')]);
  }

  public calculateFee(vehicle: Vehicle, date: Date) {
    if (vehicle.isTollFree()) return 0;
    if (this.dateService.isTollFreeDate(date)) return 0;

    return this.calculateFeeByTime(date);
  }

  private calculateFeeByTime(date: Date): number {
    return 5;
  }
}
