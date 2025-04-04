import { Vehicle, VehicleType } from './Vehicle';

export class Motorbike extends Vehicle {
  constructor() {
    super(VehicleType.MOTORBIKE);
  }
}
