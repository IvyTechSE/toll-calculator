import { Car } from './src/models/Car';
import { Motorbike } from './src/models/Motorbike';
import { TollCalculator } from './src/models/TollCalculator';

const rushHourMorning = new Date('2025-04-01T07:30:00');
const midDay = new Date('2025-04-01T12:00:00');
const rushHourEvening = new Date('2025-04-01T16:30:00');
const nightTime = new Date('2025-04-01T22:00:00');
const weekend = new Date('2025-04-05T12:00:00');
const holiday = new Date('2025-12-24T12:00:00');

const calculator = new TollCalculator();

const car = new Car();
const motorbike = new Motorbike();

console.log('--- Single Passage Tests ---');
console.log(
  `Car at rush hour (morning): ${calculator.calculateFee(car, rushHourMorning)} SEK`,
);
console.log(`Car at mid-day: ${calculator.calculateFee(car, midDay)} SEK`);
console.log(
  `Car at rush hour (evening): ${calculator.calculateFee(car, rushHourEvening)} SEK`,
);
console.log(`Car at night: ${calculator.calculateFee(car, nightTime)} SEK`);
console.log(`Car on weekend: ${calculator.calculateFee(car, weekend)} SEK`);
console.log(`Car on holiday: ${calculator.calculateFee(car, holiday)} SEK`);
console.log(
  `Motorbike at rush hour: ${calculator.calculateFee(motorbike, rushHourMorning)} SEK`,
);

const manyPassages = [];
for (let hour = 6; hour < 19; hour++) {
  manyPassages.push(
    new Date(`2025-04-01T${hour.toString().padStart(2, '0')}:30:00`),
  );
}

console.log('\n--- Max Daily Fee Test ---');
console.log(
  `Total fee for car with many passages: ${calculator.calculateTotalDailyFee(car, manyPassages)} SEK`,
);

const monthlyPassages = [
  // Day 1 - April 1st
  new Date('2025-04-01T07:15:00'), // 18 SEK
  new Date('2025-04-01T08:15:00'), // 13 SEK
  new Date('2025-04-01T16:15:00'), // 18 SEK

  // Day 2 - April 2nd
  new Date('2025-04-02T07:30:00'), // 18 SEK
  new Date('2025-04-02T17:30:00'), // 13 SEK

  // Weekend - April 5th (Saturday) - toll-free
  new Date('2025-04-05T12:00:00'), // 0 SEK (weekend)

  // Day 3 - April 8th
  new Date('2025-04-08T12:30:00'), // 8 SEK

  // Holiday - April 24th (Assumed holiday in the DateService)
  new Date('2025-12-24T14:30:00'), // 0 SEK (holiday)
];

console.log('\n--- Monthly Fee Calculation Test ---');
const monthlyResult = calculator.calculateTotalMonthlyFee(car, monthlyPassages);
console.log(`Total monthly fee: ${monthlyResult.totalFee} SEK`);
console.log('Daily breakdown:');
monthlyResult.dailyBreakdown.forEach((day) => {
  console.log(`  ${day.date}: ${day.passages.join(', ')} - ${day.fee} SEK`);
});

// Example of using JSON.stringify for detailed output
console.log('\nDetailed monthly statement:');
console.log(JSON.stringify(monthlyResult, null, 2));
