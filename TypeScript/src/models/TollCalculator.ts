import { DateService } from '../services/DateService';
import type { Vehicle } from './Vehicle';

export interface TollFeeInterval {
  start: string; // Format: "HH:MM"
  end: string; // Format: "HH:MM"
  fee: number; // Amount in SEK
}

export interface DailyPassageDetails {
  date: string;
  passages: string[];
  fee: number;
}

export interface MonthlyFeeSummary {
  totalFee: number;
  dailyBreakdown: DailyPassageDetails[];
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

    if (sortedDates.length === 0) return 0;

    // Calculate the fee for each passage
    const passagesWithFees = sortedDates.map((date) => ({
      time: date,
      fee: this.calculateFeeByTime(date),
    }));

    // Apply the "charge once per hour" rule
    let totalFee = 0;
    let chargeablePassageIndex = 0;

    while (chargeablePassageIndex < passagesWithFees.length) {
      // Get the current passage
      const currentPassage = passagesWithFees[chargeablePassageIndex];
      if (!currentPassage) {
        console.error('Current passage is undefined or null');
        break;
      }
      let highestFeeInWindow = currentPassage.fee;

      // Find the highest fee within this 60-minute window
      let nextPassageIndex = chargeablePassageIndex + 1;
      while (nextPassageIndex < passagesWithFees.length) {
        const nextPassage = passagesWithFees[nextPassageIndex];
        if (!nextPassage) {
          console.error('Next passage is undefined or null');
          break;
        }
        const timeDiffMs =
          nextPassage.time.getTime() - currentPassage.time.getTime();
        const timeDiffMinutes = timeDiffMs / (1000 * 60);

        // If within 60 minutes of the starting passage, check the fee
        if (timeDiffMinutes < 60) {
          highestFeeInWindow = Math.max(highestFeeInWindow, nextPassage.fee);
          nextPassageIndex++;
        } else {
          // Beyond 60-minute window, stop checking
          break;
        }
      }

      // Add the highest fee from this window to the total
      totalFee += highestFeeInWindow;

      // Move to the next passage outside this window
      chargeablePassageIndex = nextPassageIndex;
    }

    // Apply the maximum daily fee cap
    return Math.min(totalFee, this.maxDailyFee);
  }

  public calculateTotalMonthlyFee(
    vehicle: Vehicle,
    dates: Date[],
  ): MonthlyFeeSummary {
    if (vehicle.isTollFree() || dates.length === 0) {
      return { totalFee: 0, dailyBreakdown: [] };
    }

    const passagesByDay = new Map<string, Date[]>();

    for (const date of dates) {
      const dayKey = this.formatDate(date);

      if (!passagesByDay.has(dayKey)) {
        passagesByDay.set(dayKey, []);
      }

      passagesByDay.get(dayKey)?.push(date);
    }

    let totalMonthlyFee = 0;
    const dailyBreakdown: DailyPassageDetails[] = [];

    for (const [dayKey, dayPassages] of passagesByDay) {
      const sortedPassages = [...dayPassages].sort(
        (a, b) => a.getTime() - b.getTime(),
      );

      const dailyFee = this.calculateTotalDailyFee(vehicle, sortedPassages);

      if (dailyFee > 0) {
        totalMonthlyFee += dailyFee;

        const formattedPassages = sortedPassages.map((date) => {
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          return `${hours}:${minutes}`;
        });

        dailyBreakdown.push({
          date: dayKey,
          passages: formattedPassages,
          fee: dailyFee,
        });
      }
    }

    return {
      totalFee: totalMonthlyFee,
      dailyBreakdown: dailyBreakdown.sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    };
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
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
