import { Position } from './Position'

export class Positions {

  private _app: any | undefined = undefined;
  private _positions: Position[] = [];
  private _consecutiveRepeats: number = 0;

  constructor(app?: any) {
    this._app = (app || undefined);
  }

  positions(): Position[] {
    return(this._positions);
  }

  length(): number {
    return(this._positions.length);
  }

  consecutiveRepeats(): number {
    return(this._consecutiveRepeats);
  }

  append(position: Position) {
    if ((this._positions.length == 0) || !((this._positions[this._positions.length - 1].latitude == position.latitude) && (this._positions[this._positions.length - 1].longitude == position.longitude))) {
      if (this._app) this._app.debug(`Positions: saving position #${this.length()} [ ${position.longitude}, ${position.latitude} ]`);
      this._positions.push(position);
      this._consecutiveRepeats = 0;
    } else {
      if (this._app) this._app.debug(`Positions: discarding duplicate position`);
      this._consecutiveRepeats++;
    }
  }
}