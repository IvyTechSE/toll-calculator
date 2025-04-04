import { describe, test, expect, beforeEach } from 'bun:test';
import { TollCalculator } from '../src/models/TollCalculator';
import { Car } from '../src/models/Car';
import { Motorbike } from '../src/models/Motorbike';
import { Vehicle, VehicleType } from '../src/models/Vehicle';

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

  beforeEach(() => {
    calculator = new TollCalculator();
    car = new Car();
    motorbike = new Motorbike();
    bus = new CustomVehicle(VehicleType.BUS);
  });

  describe('calculateFee', () => {
    test('toll-free vehicles should not be charged', () => {
      const date = new Date('2025-04-01T08:30:00');
      expect(calculator.calculateFee(motorbike, date)).toBe(0);
      expect(calculator.calculateFee(bus, date)).toBe(0);
    });

    test('toll-free dates should not be charged', () => {
      // Weekend (Saturday)
      const weekend = new Date('2025-04-05T08:30:00');
      expect(calculator.calculateFee(car, weekend)).toBe(0);

      // Holiday (Christmas Eve)
      const holiday = new Date('2025-12-24T08:30:00');
      expect(calculator.calculateFee(car, holiday)).toBe(0);
    });
    test('should handle sequential 60-minute windows correctly', () => {
      const passages = [
        new Date('2025-04-01T05:59:00'), // 0 SEK (night period)
        new Date('2025-04-01T06:25:00'), // 8 SEK
        new Date('2025-04-01T06:50:00'), // 13 SEK
        new Date('2025-04-01T07:25:00'), // 18 SEK
      ];

      // First 3 passages are within a 60-minute window, with 13 SEK being the highest
      // The 4th passage is outside this window, so charged separately at 18 SEK
      // Total: 13 + 18 = 31 SEK
      expect(calculator.calculateTotalDailyFee(car, passages)).toBe(31);
    }); // test/TollCalculator.test.ts
    test('calculates correct fee based on time of day', () => {
      // Test different time brackets
      const times = [
        { time: '2025-04-01T06:15:00', expected: 8 },
        { time: '2025-04-01T06:45:00', expected: 13 },
        { time: '2025-04-01T07:30:00', expected: 18 },
        { time: '2025-04-01T08:15:00', expected: 13 },
        { time: '2025-04-01T10:00:00', expected: 8 },
        { time: '2025-04-01T15:15:00', expected: 13 },
        { time: '2025-04-01T16:30:00', expected: 18 },
        { time: '2025-04-01T17:30:00', expected: 13 },
        { time: '2025-04-01T18:15:00', expected: 8 },
        { time: '2025-04-01T19:00:00', expected: 0 },
        { time: '2025-04-01T03:00:00', expected: 0 },
      ];

      for (const { time, expected } of times) {
        expect(calculator.calculateFee(car, new Date(time))).toBe(expected);
      }
    });
  });

  describe('calculateTotalDailyFee', () => {
    test('should respect the max daily fee of 60 SEK', () => {
      // Create multiple passages with high fees to exceed the 60 SEK limit
      const passages = [
        new Date('2025-04-01T07:15:00'), // 18 SEK
        new Date('2025-04-01T08:15:00'), // 13 SEK
        new Date('2025-04-01T15:15:00'), // 13 SEK
        new Date('2025-04-01T16:15:00'), // 18 SEK
        new Date('2025-04-01T17:15:00'), // 13 SEK
      ];

      // Total would be 75 SEK, but should be capped at 60 SEK
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

    test('should handle overlapping hour windows correctly', () => {
      const passages = [
        new Date('2025-04-01T06:55:00'), // 13 SEK
        new Date('2025-04-01T07:10:00'), // 18 SEK
        new Date('2025-04-01T08:15:00'), // 13 SEK
      ];

      // First passage at 06:55 and second at 07:10 are within the same hour window,
      // so only the higher fee (18 SEK) should be charged. Then 13 SEK for 08:15.
      // Total: 18 + 13 = 31 SEK
      expect(calculator.calculateTotalDailyFee(car, passages)).toBe(31);
    });

    test('should handle multiple passages within the same hour correctly', () => {
      const passages = [
        new Date('2025-04-01T08:15:00'), // 13 SEK
        new Date('2025-04-01T08:20:00'), // 13 SEK
        new Date('2025-04-01T08:25:00'), // 13 SEK
      ];

      // All passages are within the same hour, so only charge once: 13 SEK
      expect(calculator.calculateTotalDailyFee(car, passages)).toBe(13);
    });

    test('should return 0 for toll-free vehicles', () => {
      const passages = [
        new Date('2025-04-01T07:15:00'),
        new Date('2025-04-01T15:15:00'),
      ];

      expect(calculator.calculateTotalDailyFee(motorbike, passages)).toBe(0);
      expect(calculator.calculateTotalDailyFee(bus, passages)).toBe(0);
    });

    test('should return 0 for toll-free dates', () => {
      const passages = [
        new Date('2025-12-24T07:15:00'), // Christmas Eve
        new Date('2025-12-24T15:15:00'), // Christmas Eve
      ];

      expect(calculator.calculateTotalDailyFee(car, passages)).toBe(0);
    });

    test('should throw error if dates are not on the same day', () => {
      const passages = [
        new Date('2025-04-01T07:15:00'),
        new Date('2025-04-02T15:15:00'),
      ];

      expect(() => calculator.calculateTotalDailyFee(car, passages)).toThrow();
    });
  });

  describe('calculateTotalMonthlyFee', () => {
    test('should calculate monthly fee with correct breakdown', () => {
      const passages = [
        // Day 1
        new Date('2025-04-01T07:15:00'), // 18 SEK
        new Date('2025-04-01T08:15:00'), // 13 SEK
        // Day 2
        new Date('2025-04-02T16:15:00'), // 18 SEK
        new Date('2025-04-02T17:15:00'), // 13 SEK
        // Day 3 (weekend - Saturday)
        new Date('2025-04-05T12:00:00'), // 0 SEK (weekend)
        // Day 4
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

    test('should return empty result for toll-free vehicles', () => {
      const passages = [
        new Date('2025-04-01T07:15:00'),
        new Date('2025-04-02T15:15:00'),
      ];

      const result = calculator.calculateTotalMonthlyFee(motorbike, passages);

      expect(result.totalFee).toBe(0);
      expect(result.dailyBreakdown.length).toBe(0);
    });

    test('should handle empty array of dates', () => {
      const result = calculator.calculateTotalMonthlyFee(car, []);

      expect(result.totalFee).toBe(0);
      expect(result.dailyBreakdown.length).toBe(0);
    });

    test('should handle multiple passages on the same day', () => {
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
      expect(result.dailyBreakdown[0]?.passages.length).toBe(13); // One for each hour
    });
  });
});
