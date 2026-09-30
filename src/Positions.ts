import { Position } from './Position'

export class Positions {

  public positions: Position[] = [];

  constructor() {

  }

  length(): number {
    return(this.positions.length);
  }

  add(position: Position) {
    if ((this.positions.length == 0) || !((this.positions[this.positions.length - 1].latitude == position.latitude) && (this.positions[this.positions.length - 1].longitude == position.longitude))) {
      this.positions.push(position);
    }
  }
}