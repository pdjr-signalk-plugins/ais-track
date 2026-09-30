import { Position } from './Position'

export class Positions {

  public app: any;
  public positions: Position[] = [];

  constructor(app: any) {
    this.app = app;
  }

  length(): number {
    return(this.positions.length);
  }

  add(position: Position) {
    if ((this.positions.length == 0) || !((this.positions[this.positions.length - 1].latitude == position.latitude) && (this.positions[this.positions.length - 1].longitude == position.longitude))) {
      this.app.debug(`Positions: pushing new location: ${JSON.stringify(position)}`);
      this.positions.push(position);
    }
  }
}