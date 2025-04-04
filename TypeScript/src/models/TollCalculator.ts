import { DateService } from '../services/DateService';
import type { Vehicle } from './Vehicle';

/**
 * Represents a time interval with an associated toll fee.
 */
export interface TollFeeInterval {
  /** Start time in "HH:MM" format */
  start: string;
  /** End time in "HH:MM" format */
  end: string;
  /** Toll fee amount in SEK */
  fee: number;
}

/**
 * Details of toll passages and fees for a single day.
 */
export interface DailyPassageDetails {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Array of passage times in HH:MM format */
  passages: string[];
  /** Total fee for the day in SEK (after applying hourly rules and daily cap) */
  fee: number;
}

/**
 * Summary of toll fees for a month, including breakdown by day.
 */
export interface MonthlyFeeSummary {
  /** Total fee for the month in SEK */
  totalFee: number;
  /** Detailed breakdown of toll passages and fees by day */
  dailyBreakdown: DailyPassageDetails[];
}

/**
 * Calculator for vehicle toll fees based on time of day, vehicle type, and date.
 * Implements the following business rules:
 * - Fees vary between 8-18 SEK depending on time of day
 * - Rush hours have the highest fees
 * - Maximum fee per day is 60 SEK
 * - A vehicle is charged only once per hour (highest fee applies)
 * - Some vehicle types are exempt from fees
 * - Weekends and holidays are toll-free
 */
export class TollCalculator {
  private dateService: DateService;
  private readonly tollFeeIntervals: TollFeeInterval[];
  private readonly maxDailyFee: number = 60;

  /**
   * Creates a new TollCalculator with predefined fee intervals.
   */
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

  /**
   * Calculates the toll fee for a single passage.
   *
   * @param vehicle - The vehicle making the passage
   * @param date - The date and time of the passage
   * @returns The toll fee in SEK (0 if toll-free)
   */
  public calculateFee(vehicle: Vehicle, date: Date): number {
    if (vehicle.isTollFree()) return 0;
    if (this.dateService.isTollFreeDate(date)) return 0;

    return this.calculateFeeByTime(date);
  }

  /**
   * Calculates the total toll fee for multiple passages on the same day.
   * Applies the "charge once per hour" rule and the maximum daily fee cap.
   *
   * @param vehicle - The vehicle making the passages
   * @param dates - Array of date/time passages (must all be on the same day)
   * @returns The total toll fee for the day in SEK
   * @throws Error if dates are not all on the same day
   */
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

  /**
   * Calculates the total toll fees for multiple passages across different days.
   * Groups passages by day, applies daily fee calculations, and provides a detailed breakdown.
   *
   * @param vehicle - The vehicle making the passages
   * @param dates - Array of date/time passages (can span multiple days)
   * @returns A summary of monthly fees with daily breakdown
   */
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

  /**
   * Formats a Date object as YYYY-MM-DD string.
   *
   * @param date - The date to format
   * @returns Formatted date string
   * @private
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Calculates the fee for a specific time of day based on predefined fee intervals.
   *
   * @param date - The date and time to calculate the fee for
   * @returns The toll fee in SEK
   * @private
   */
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

    // TODO: Handle case where no matching interval is found, report to responsible party
    console.error(
      `No matching toll fee interval found for time: ${currentTime}`,
    );
    return 0;
  }

  /**
   * Checks if a given time is within a specified interval.
   * Handles intervals that cross midnight (e.g., "18:30" to "05:59").
   *
   * @param time - The time to check in "HH:MM" format
   * @param start - Start of the interval in "HH:MM" format
   * @param end - End of the interval in "HH:MM" format
   * @returns True if the time is within the interval, false otherwise
   * @private
   */
  private isTimeInInterval(time: string, start: string, end: string): boolean {
    // Handle intervals that cross midnight (e.g., "18:30" to "05:59")
    if (start > end) {
      return time >= start || time <= end;
    }

    return time >= start && time <= end;
  }
}
