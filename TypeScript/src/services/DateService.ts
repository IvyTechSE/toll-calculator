/**
 * Service class for handling date-related operations in the toll fee system.
 * Provides functionality to determine toll-free dates (weekends and holidays).
 */
export class DateService {
  private readonly holidays: Set<string>;

  /**
   * Creates a new DateService with optional custom holidays.
   * Automatically adds default Swedish holidays for the current year.
   *
   * @param holidays - Optional array of custom holiday dates
   */
  constructor(holidays: Date[] = []) {
    this.holidays = new Set(holidays.map((date) => this.toDateString(date)));

    this.addDefaultSwedishHolidays(new Date().getFullYear());
  }

  /**
   * Checks if a given date is a toll-free day (weekend or holiday).
   *
   * @param date - The date to check
   * @returns true if the date is toll-free, false otherwise
   */
  isTollFreeDate(date: Date): boolean {
    const dayOfWeek = date.getDay();

    // 0 is Sunday, 6 is Saturday
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
   * Adds a specific date as a holiday.
   *
   * @param date - The date to add as a holiday
   */
  addHoliday(date: Date): void {
    this.holidays.add(this.toDateString(date));
  }

  /**
   * Converts a Date object to a string representation (YYYY-MM-DD).
   * This is used for holiday comparisons to ignore time components.
   *
   * @param date - The date to convert
   * @returns A string in YYYY-MM-DD format
   * @throws Error if the date cannot be converted to a valid string
   * @private
   */
  private toDateString(date: Date): string {
    const dateString = date.toISOString().split('T')[0];
    if (!dateString) {
      throw new Error('Invalid date format');
    }
    return dateString;
  }

  /**
   * Adds default Swedish holidays for a given year.
   * This is a simplified implementation - in production, we would use a proper calendar library
   * that accounts for dynamic holidays like Easter, Midsummer, etc.
   *
   * @param year - The year to generate holidays for
   * @private
   */
  private addDefaultSwedishHolidays(year: number): void {
    // New Year's Day
    this.addHoliday(new Date(year, 0, 1));

    // Epiphany
    this.addHoliday(new Date(year, 0, 6));

    // May 1st (Labor Day)
    this.addHoliday(new Date(year, 4, 1));

    // National Day
    this.addHoliday(new Date(year, 5, 6));

    // Christmas Eve
    this.addHoliday(new Date(year, 11, 24));

    // Christmas Day
    this.addHoliday(new Date(year, 11, 25));

    // Boxing Day
    this.addHoliday(new Date(year, 11, 26));

    // New Year's Eve
    this.addHoliday(new Date(year, 11, 31));

    // TODO: Add dynamic holidays like Easter, Midsummer, etc. Perhaps via an dedicated calendar library
  }
}
