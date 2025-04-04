import { Car } from './src/models/Car';
import { Motorbike } from './src/models/Motorbike';
import { TollCalculator } from './src/models/TollCalculator';

const calculator = new TollCalculator();

const car = new Car();
const motorbike = new Motorbike();

console.log(`Car toll fee: ${calculator.calculateFee(car, new Date())}`);   
console.log(`Motorbike toll fee: ${calculator.calculateFee(motorbike, new Date())}`);