export class DateService {
  private readonly holidays: Set<string>;

  constructor(holidays: Date[] = []) {
    this.holidays = new Set(holidays.map((date) => this.toDateString(date)));
  }

  /**
   * Checks if a given date is a toll-free day (weekend or holiday).
   *
   * @param date - The date to check
   * @returns true if the date is toll-free, false otherwise
   */
  isTollFreeDate(date: Date): boolean {
    const dayOfWeek = date.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return true;
    }

    return this.isHoliday(date);
  }

  /**
   * Checks if a date is a registered holiday.
   *
   * @param date - The date to check
   * @returns true if the date is a holiday, false otherwise
   */
  isHoliday(date: Date): boolean {
    const dateString = this.toDateString(date);
    return this.holidays.has(dateString);
  }

  /**
   * Converts a Date object to a string representation (YYYY-MM-DD).
   * This is used for holiday comparisons to ignore time components.
   *
   * @param date - The date to convert
   * @returns A string in YYYY-MM-DD format
   */
  private toDateString(date: Date): string {
    const dateString = date.toISOString().split('T')[0];
    if (!dateString) {
      throw new Error('Invalid date format');
    }
    return dateString;
  }
}
