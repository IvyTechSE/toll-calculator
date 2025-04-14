import { Vehicle, VehicleType } from './Vehicle';

export class Car extends Vehicle {
  constructor() {
    super(VehicleType.CAR);
  }
}
