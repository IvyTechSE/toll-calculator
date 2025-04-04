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
