import { Position } from './Position'

export class Track {

  private _timestamp: number = 0;
  private _app: any | undefined = undefined;
  private _positions: Position[] = [];
  private _consecutiveRepeats: number = 0;

  constructor(timestamp: number, app?: any) {
    this._timestamp = timestamp;
    this._app = (app || undefined);
  }

  timestamp(): number {
    return(this._timestamp)
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

  append(position: Position): string {
    if ((this._positions.length == 0) || !((this._positions[this._positions.length - 1].latitude == position.latitude) && (this._positions[this._positions.length - 1].longitude == position.longitude))) {
      this._positions.push(position);
      this._consecutiveRepeats = 0;
      return(`saving position #${this.length()} [ ${position.longitude}, ${position.latitude} ]`);
    } else {
      this._consecutiveRepeats++;
      return(`discarding duplicate position`);
    }
  }
}