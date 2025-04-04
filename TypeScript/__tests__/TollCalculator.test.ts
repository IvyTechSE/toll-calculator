import { describe, test, expect, beforeEach, beforeAll } from 'bun:test';
import { TollCalculator } from '../src/models/TollCalculator';
import { Car } from '../src/models/Car';
import { Motorbike } from '../src/models/Motorbike';
import { Vehicle, VehicleType } from '../src/models/Vehicle';
import { DateService } from '../src/services/DateService';

// Create a custom vehicle class for testing
class CustomVehicle extends Vehicle {
  constructor(type: VehicleType) {
    super(type);
  }
}

describe('TollCalculator', () => {
  let calculator: TollCalculator;
  let car: Car;
  let motorbike: Motorbike;
  let bus: CustomVehicle;
  let diplomat: CustomVehicle;
  let dateService: DateService;

  // Fixed test dates
  const weekend = new Date('2025-04-05T12:00:00'); // Saturday
  const holiday = new Date('2025-12-24T12:00:00'); // Christmas Eve

  beforeEach(() => {
    calculator = new TollCalculator();
    car = new Car();
    motorbike = new Motorbike();
    bus = new CustomVehicle(VehicleType.BUS);
    diplomat = new CustomVehicle(VehicleType.DIPLOMAT);
    dateService = new DateService();
  });

  describe('Vehicle Types and Toll-Free Status', () => {
    test('cars should be charged toll fees', () => {
      expect(car.isTollFree()).toBe(false);
    });

    test('toll-free vehicles should be correctly identified', () => {
      expect(motorbike.isTollFree()).toBe(true);
      expect(bus.isTollFree()).toBe(true);
      expect(diplomat.isTollFree()).toBe(true);

      const emergency = new CustomVehicle(VehicleType.EMERGENCY);
      const military = new CustomVehicle(VehicleType.MILITARY);
      const foreign = new CustomVehicle(VehicleType.FOREIGN);
      const tractor = new CustomVehicle(VehicleType.TRACTOR);

      expect(emergency.isTollFree()).toBe(true);
      expect(military.isTollFree()).toBe(true);
      expect(foreign.isTollFree()).toBe(true);
      expect(tractor.isTollFree()).toBe(true);
    });
  });

  describe('Date Service', () => {
    test('weekends should be correctly identified as toll-free', () => {
      expect(dateService.isTollFreeDate(new Date('2025-04-05T12:00:00'))).toBe(
        true,
      ); // Saturday
      expect(dateService.isTollFreeDate(new Date('2025-04-06T12:00:00'))).toBe(
        true,
      ); // Sunday
      expect(dateService.isTollFreeDate(new Date('2025-04-07T12:00:00'))).toBe(
        false,
      ); // Monday
    });

    test('holidays should be correctly identified as toll-free', () => {
      // Test some known holidays
      expect(dateService.isTollFreeDate(new Date('2025-01-01T12:00:00'))).toBe(
        true,
      ); // New Year's Day
      expect(dateService.isTollFreeDate(new Date('2025-12-25T12:00:00'))).toBe(
        true,
      ); // Christmas
      expect(dateService.isTollFreeDate(new Date('2025-05-01T12:00:00'))).toBe(
        true,
      ); // May 1st
    });

    test('adding custom holidays should work', () => {
      const customDate = new Date('2025-03-17T12:00:00'); // Not normally a holiday
      expect(dateService.isTollFreeDate(customDate)).toBe(false);

      dateService.addHoliday(customDate);
      expect(dateService.isTollFreeDate(customDate)).toBe(true);
    });
  });

  describe('Single Fee Calculation', () => {
    test('toll-free vehicles should not be charged', () => {
      const date = new Date('2025-04-01T08:30:00');
      expect(calculator.calculateFee(motorbike, date)).toBe(0);
      expect(calculator.calculateFee(bus, date)).toBe(0);
      expect(calculator.calculateFee(diplomat, date)).toBe(0);
    });

    test('toll-free dates should not be charged', () => {
      // Weekend (Saturday)
      expect(calculator.calculateFee(car, weekend)).toBe(0);

      // Holiday (Christmas Eve)
      expect(calculator.calculateFee(car, holiday)).toBe(0);
    });

    test('calculates correct fee based on time of day', () => {
      // Test different time brackets
      const timeTests = [
        // Early morning (free)
        { time: '2025-04-01T03:00:00', expected: 0 },
        { time: '2025-04-01T05:59:59', expected: 0 },

        // Morning brackets
        { time: '2025-04-01T06:00:00', expected: 8 },
        { time: '2025-04-01T06:29:59', expected: 8 },
        { time: '2025-04-01T06:30:00', expected: 13 },
        { time: '2025-04-01T06:59:59', expected: 13 },

        // Morning rush hour (highest fee)
        { time: '2025-04-01T07:00:00', expected: 18 },
        { time: '2025-04-01T07:59:59', expected: 18 },

        // Transition to mid-morning
        { time: '2025-04-01T08:00:00', expected: 13 },
        { time: '2025-04-01T08:29:59', expected: 13 },

        // Daytime
        { time: '2025-04-01T08:30:00', expected: 8 },
        { time: '2025-04-01T14:59:59', expected: 8 },

        // Afternoon brackets
        { time: '2025-04-01T15:00:00', expected: 13 },
        { time: '2025-04-01T15:29:59', expected: 13 },

        // Afternoon rush hour (highest fee)
        { time: '2025-04-01T15:30:00', expected: 18 },
        { time: '2025-04-01T16:59:59', expected: 18 },

        // Evening transition
        { time: '2025-04-01T17:00:00', expected: 13 },
        { time: '2025-04-01T17:59:59', expected: 13 },
        { time: '2025-04-01T18:00:00', expected: 8 },
        { time: '2025-04-01T18:29:59', expected: 8 },

        // Night (free)
        { time: '2025-04-01T18:30:00', expected: 0 },
        { time: '2025-04-01T23:59:59', expected: 0 },
      ];

      for (const { time, expected } of timeTests) {
        expect(calculator.calculateFee(car, new Date(time))).toBe(expected);
      }
    });

    test('edge case: midnight should be free', () => {
      expect(
        calculator.calculateFee(car, new Date('2025-04-01T00:00:00')),
      ).toBe(0);
    });
  });

  describe('Daily Fee Calculation', () => {
    test('should respect the max daily fee of 60 SEK', () => {
      // Create multiple passages with high fees to exceed the 60 SEK limit
      const passages = [
        new Date('2025-04-01T07:15:00'), // 18 SEK
        new Date('2025-04-01T08:15:00'), // 13 SEK
        new Date('2025-04-01T10:15:00'), // 8 SEK
        new Date('2025-04-01T15:15:00'), // 13 SEK
        new Date('2025-04-01T16:15:00'), // 18 SEK
        new Date('2025-04-01T17:15:00'), // 13 SEK
      ];

      // Total would be 83 SEK (18+13+8+13+18+13), but should be capped at 60 SEK
      expect(calculator.calculateTotalDailyFee(car, passages)).toBe(60);
    });

    test('should only charge once per hour with the highest fee', () => {
      const passages = [
        new Date('2025-04-01T07:15:00'), // 18 SEK
        new Date('2025-04-01T07:45:00'), // 18 SEK (should be ignored as it's in the same hour)
        new Date('2025-04-01T08:15:00'), // 13 SEK
        new Date('2025-04-01T08:25:00'), // 13 SEK (should be ignored as it's in the same hour)
      ];

      // Should only charge for the highest fee in each hour: 18 + 13 = 31 SEK
      expect(calculator.calculateTotalDailyFee(car, passages)).toBe(31);
    });

    test('should handle passages at exactly the same time', () => {
      const passages = [
        new Date('2025-04-01T07:15:00'), // 18 SEK
        new Date('2025-04-01T07:15:00'), // Duplicate time - should be ignored
        new Date('2025-04-01T08:15:00'), // 13 SEK
      ];

      expect(calculator.calculateTotalDailyFee(car, passages)).toBe(31);
    });

    test('should handle sequential 60-minute windows correctly', () => {
      const passages = [
        new Date('2025-04-01T05:59:00'), // 0 SEK (night period)
        new Date('2025-04-01T06:25:00'), // 8 SEK
        new Date('2025-04-01T06:50:00'), // 13 SEK (within 60 min of 06:25)
        new Date('2025-04-01T07:25:00'), // 18 SEK (outside 60 min window of 06:25)
      ];

      // First 2 passages are within a 60-minute window, with 13 SEK being the highest
      // The 3rd passage (07:25) is outside this window, so charged separately at 18 SEK
      // Total: 13 + 18 = 31 SEK
      expect(calculator.calculateTotalDailyFee(car, passages)).toBe(31);
    });

    test('should handle overlapping hour windows correctly', () => {
      const passages = [
        new Date('2025-04-01T06:55:00'), // 13 SEK
        new Date('2025-04-01T07:10:00'), // 18 SEK (within 60 min of 06:55)
        new Date('2025-04-01T07:56:00'), // 18 SEK (outside 60 min window of 06:55)
        new Date('2025-04-01T08:15:00'), // 13 SEK (within 60 min of 07:56)
      ];

      // 1. First passage at 06:55 starts a 60-minute window
      // 2. Second passage at 07:10 is within this window, so highest fee (18 SEK) applies
      // 3. Third passage at 07:56 is outside the window from 06:55, so a new 60-minute window starts (18 SEK)
      // 4. Fourth passage at 08:15 is within 60 minutes of 07:56, so no additional charge
      // Total: 18 + 18 = 36 SEK
      expect(calculator.calculateTotalDailyFee(car, passages)).toBe(36);
    });

    test('should handle empty array of passages', () => {
      expect(calculator.calculateTotalDailyFee(car, [])).toBe(0);
    });

    test('should throw error if dates are not on the same day', () => {
      const passages = [
        new Date('2025-04-01T07:15:00'),
        new Date('2025-04-02T15:15:00'),
      ];

      expect(() => calculator.calculateTotalDailyFee(car, passages)).toThrow();
    });

    test('should return 0 for toll-free vehicles regardless of passages', () => {
      const passages = [
        new Date('2025-04-01T07:15:00'), // 18 SEK (if it were a car)
        new Date('2025-04-01T16:15:00'), // 18 SEK (if it were a car)
      ];

      expect(calculator.calculateTotalDailyFee(motorbike, passages)).toBe(0);
      expect(calculator.calculateTotalDailyFee(bus, passages)).toBe(0);
    });

    test('should return 0 for toll-free dates regardless of passages', () => {
      const weekendPassages = [
        new Date('2025-04-05T07:15:00'), // Weekend
        new Date('2025-04-05T16:15:00'), // Weekend
      ];

      const holidayPassages = [
        new Date('2025-12-24T07:15:00'), // Christmas Eve
        new Date('2025-12-24T16:15:00'), // Christmas Eve
      ];

      expect(calculator.calculateTotalDailyFee(car, weekendPassages)).toBe(0);
      expect(calculator.calculateTotalDailyFee(car, holidayPassages)).toBe(0);
    });
  });

  describe('Monthly Fee Calculation', () => {
    test('should calculate monthly fee with correct breakdown', () => {
      const passages = [
        // Day 1 - April 1st (Tuesday)
        new Date('2025-04-01T07:15:00'), // 18 SEK
        new Date('2025-04-01T08:15:00'), // 13 SEK

        // Day 2 - April 2nd (Wednesday)
        new Date('2025-04-02T16:15:00'), // 18 SEK
        new Date('2025-04-02T17:15:00'), // 13 SEK

        // Day 3 - April 5th (Saturday - weekend)
        new Date('2025-04-05T12:00:00'), // 0 SEK (weekend)

        // Day 4 - April 10th (Thursday)
        new Date('2025-04-10T07:15:00'), // 18 SEK
      ];

      const result = calculator.calculateTotalMonthlyFee(car, passages);

      // Expected: Day 1 (31 SEK) + Day 2 (31 SEK) + Day 4 (18 SEK) = 80 SEK
      expect(result.totalFee).toBe(80);

      // Should have 3 days in the breakdown (weekend day is skipped because fee is 0)
      expect(result.dailyBreakdown.length).toBe(3);

      // Days should be in chronological order
      expect(result.dailyBreakdown[0]?.date).toBe('2025-04-01');
      expect(result.dailyBreakdown[1]?.date).toBe('2025-04-02');
      expect(result.dailyBreakdown[2]?.date).toBe('2025-04-10');

      // Check fee for Day 1
      expect(result.dailyBreakdown[0]?.fee).toBe(31);
      expect(result.dailyBreakdown[0]?.passages).toEqual(['07:15', '08:15']);

      // Check fee for Day 2
      expect(result.dailyBreakdown[1]?.fee).toBe(31);
      expect(result.dailyBreakdown[1]?.passages).toEqual(['16:15', '17:15']);

      // Check fee for Day 4
      expect(result.dailyBreakdown[2]?.fee).toBe(18);
      expect(result.dailyBreakdown[2]?.passages).toEqual(['07:15']);
    });

    test('should correctly handle passages that span multiple months', () => {
      const passages = [
        // March
        new Date('2025-03-31T07:15:00'), // 18 SEK

        // April
        new Date('2025-04-01T07:15:00'), // 18 SEK
        new Date('2025-04-30T16:15:00'), // 18 SEK

        // May
        new Date('2025-05-01T12:00:00'), // 0 SEK (holiday - May 1st)
        new Date('2025-05-02T07:15:00'), // 18 SEK
      ];

      const result = calculator.calculateTotalMonthlyFee(car, passages);

      // Should group correctly by month/day and calculate fees
      expect(result.totalFee).toBe(72); // 18 + 18 + 18 + 18 = 72 SEK
      expect(result.dailyBreakdown.length).toBe(4); // 4 days with fees

      // Check that May 1st (holiday) is not included in the breakdown
      const hasMay1 = result.dailyBreakdown.some(
        (day) => day.date === '2025-05-01',
      );
      expect(hasMay1).toBe(false);
    });

    test('should return empty result for toll-free vehicles', () => {
      const passages = [
        new Date('2025-04-01T07:15:00'),
        new Date('2025-04-02T15:15:00'),
      ];

      const motorcycleResult = calculator.calculateTotalMonthlyFee(
        motorbike,
        passages,
      );
      const busResult = calculator.calculateTotalMonthlyFee(bus, passages);

      expect(motorcycleResult.totalFee).toBe(0);
      expect(motorcycleResult.dailyBreakdown.length).toBe(0);

      expect(busResult.totalFee).toBe(0);
      expect(busResult.dailyBreakdown.length).toBe(0);
    });

    test('should handle empty array of dates', () => {
      const result = calculator.calculateTotalMonthlyFee(car, []);

      expect(result.totalFee).toBe(0);
      expect(result.dailyBreakdown.length).toBe(0);
    });

    test('should correctly apply daily maximum fee for multiple passages on the same day', () => {
      // Many passages on the same day, exceeding the max daily fee
      const passages = [];
      for (let hour = 6; hour < 19; hour++) {
        passages.push(
          new Date(`2025-04-01T${hour.toString().padStart(2, '0')}:30:00`),
        );
      }

      const result = calculator.calculateTotalMonthlyFee(car, passages);

      expect(result.totalFee).toBe(60); // Max daily fee
      expect(result.dailyBreakdown.length).toBe(1);
      expect(result.dailyBreakdown[0]?.date).toBe('2025-04-01');
      expect(result.dailyBreakdown[0]?.fee).toBe(60);

      // One passage for each hour from 6:30 to 18:30
      expect(result.dailyBreakdown[0]?.passages.length).toBe(13);
    });

    test('should handle a complex combination of different days, times, and vehicle types', () => {
      const mixedPassages = [
        // Car on weekday - Day 1
        new Date('2025-04-01T07:15:00'), // 18 SEK
        new Date('2025-04-01T16:15:00'), // 18 SEK

        // Car on weekend - Day 2
        new Date('2025-04-05T07:15:00'), // 0 SEK (weekend)

        // Car on weekday - Day 3
        new Date('2025-04-03T07:15:00'), // 18 SEK

        // Car on holiday - Day 4
        new Date('2025-12-24T07:15:00'), // 0 SEK (holiday)

        // Car on weekday with max fee - Day 5
        ...[...Array(10)].map(
          (_, i) =>
            new Date(`2025-04-08T${(7 + i).toString().padStart(2, '0')}:15:00`),
        ),
      ];

      // Day 1: 07:15 (18 SEK) + 16:15 (18 SEK) = 36 SEK (passages more than 60 minutes apart)
      // Day 3: 07:15 (18 SEK) = 18 SEK
      // Day 5: Ten hourly passages from 07:15 to 16:15
      //   - These include 2x 18 SEK, 2x 13 SEK, and 6x 8 SEK = 110 SEK total
      //   - But capped at the daily maximum of 60 SEK
      // Total: 36 SEK + 18 SEK + 60 SEK = 114 SEK

      // Test car passages (should include Day 1, Day 3, and Day 5)
      const carResult = calculator.calculateTotalMonthlyFee(car, mixedPassages);
      expect(carResult.totalFee).toBe(114);
      expect(carResult.dailyBreakdown.length).toBe(3);

      // Test motorbike passages (should all be free)
      const bikeResult = calculator.calculateTotalMonthlyFee(
        motorbike,
        mixedPassages,
      );
      expect(bikeResult.totalFee).toBe(0);
      expect(bikeResult.dailyBreakdown.length).toBe(0);
    });
  });
});
