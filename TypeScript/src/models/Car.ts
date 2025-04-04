import { Vehicle, VehicleType } from './Vehicle';

export class Car extends Vehicle {
  getType() {
    return VehicleType.CAR;
  }
}
