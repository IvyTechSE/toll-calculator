/**
 * Toll Fee Calculator Entry Point
 *
 * A simplified demonstration of the toll fee calculation system.
 * This version shows basic functionality while providing comments on what
 * would be done to make this production-ready.
 */

import { Car } from './src/models/Car';
import { TollCalculator } from './src/models/TollCalculator';

// In a production environment:
// - We would implement proper error handling throughout the system
// - Add logging using a structured logging framework
// - Use dependency injection for better testability
// - Add input validation at the entry points
// - Implement proper configuration management (e.g., for fee schedules)
// - Use a proper date/time library for more robust holiday calculations

function demonstrateTollCalculator() {
  const calculator = new TollCalculator();
  const car = new Car();

  // Example: Calculate fee for a single passage
  const currentTime = new Date();
  const fee = calculator.calculateFee(car, currentTime);

  console.log(`Current time: ${currentTime.toLocaleTimeString()}`);
  console.log(`Toll fee: ${fee} SEK`);

  // Example: Calculate fee for multiple passages
  const morning = new Date();
  morning.setHours(7, 15, 0); // 07:15

  const evening = new Date();
  evening.setHours(16, 15, 0); // 16:15

  const dailyFee = calculator.calculateTotalDailyFee(car, [morning, evening]);
  console.log(`Daily fee for two passages: ${dailyFee} SEK`);

  // Production roadmap:
  // 1. REST API - Expose the calculator as a REST service with proper validation
  // 2. Persistence - Add database storage for passage history
  // 3. Reporting - Create comprehensive reporting capabilities
  // 4. Admin UI - Develop an interface for fee schedule management
  // 5. Monitoring - Implement health checks and performance monitoring
  // 6. Billing Integration - Connect with payment processing systems

  // For more complex scenarios check __tests__/TollCalculator.test.ts
}

demonstrateTollCalculator();
