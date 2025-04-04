import { DateService } from '../services/DateService';
import type { Vehicle } from './Vehicle';

export interface TollFeeInterval {
  start: string; // Format: "HH:MM"
  end: string; // Format: "HH:MM"
  fee: number; // Amount in SEK
}
export class TollCalculator {
  private dateService: DateService;
  private readonly tollFeeIntervals: TollFeeInterval[];
  private readonly maxDailyFee: number = 60;

  constructor() {
    this.dateService = new DateService();

    this.tollFeeIntervals = [
      { start: '06:00', end: '06:29', fee: 8 },
      { start: '06:30', end: '06:59', fee: 13 },
      { start: '07:00', end: '07:59', fee: 18 },
      { start: '08:00', end: '08:29', fee: 13 },
      { start: '08:30', end: '14:59', fee: 8 },
      { start: '15:00', end: '15:29', fee: 13 },
      { start: '15:30', end: '16:59', fee: 18 },
      { start: '17:00', end: '17:59', fee: 13 },
      { start: '18:00', end: '18:29', fee: 8 },
      { start: '18:30', end: '05:59', fee: 0 },
    ];
  }

  public calculateFee(vehicle: Vehicle, date: Date) {
    if (vehicle.isTollFree()) return 0;
    if (this.dateService.isTollFreeDate(date)) return 0;

    return this.calculateFeeByTime(date);
  }

  public calculateTotalDailyFee(vehicle: Vehicle, dates: Date[]): number {
    if (vehicle.isTollFree()) return 0;
    if (dates.length === 0) return 0;

    // Make sure all dates are on the same day
    const firstDate = dates[0];
    if (!(firstDate instanceof Date)) {
      throw new Error('Invalid date format');
    }
    const sameDay = dates.every(
      (date) =>
        date.getFullYear() === firstDate.getFullYear() &&
        date.getMonth() === firstDate.getMonth() &&
        date.getDate() === firstDate.getDate(),
    );

    if (!sameDay) {
      throw new Error('All dates must be on the same day');
    }

    if (this.dateService.isTollFreeDate(firstDate)) return 0;

    // Sort dates chronologically
    const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());

    // Group passages by hour to implement the "charge once per hour" rule
    const hourlyPassages = new Map<number, Date[]>();

    for (const date of sortedDates) {
      // Create a key based on the hour (0-23)
      const hourKey = date.getHours();

      if (!hourlyPassages.has(hourKey)) {
        hourlyPassages.set(hourKey, []);
      }

      hourlyPassages.get(hourKey)?.push(date);
    }

    // For each hour, find the passage with the highest fee
    let totalFee = 0;

    for (const [_, passages] of hourlyPassages) {
      let highestFeeInHour = 0;

      for (const date of passages) {
        const fee = this.calculateFeeByTime(date);
        highestFeeInHour = Math.max(highestFeeInHour, fee);
      }

      totalFee += highestFeeInHour;
    }

    // Apply the maximum daily fee cap
    return Math.min(totalFee, this.maxDailyFee);
  }

  private calculateFeeByTime(date: Date): number {
    // Format current time as HH:MM for comparison
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;

    // Find the matching time interval
    for (const interval of this.tollFeeIntervals) {
      if (this.isTimeInInterval(currentTime, interval.start, interval.end)) {
        return interval.fee;
      }
    }

    console.error(
      `No matching toll fee interval found for time: ${currentTime}`,
    ); // TODO: Handle this case and report it to responsible party
    return 0;
  }

  private isTimeInInterval(time: string, start: string, end: string): boolean {
    // Handle intervals that cross midnight (e.g., "18:30" to "05:59")
    if (start > end) {
      return time >= start || time <= end;
    }

    return time >= start && time <= end;
  }
}
