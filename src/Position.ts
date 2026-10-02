export class Position {

  public latitude: number = 0;
  public longitude: number = 0;

  constructor(latitude: number, longitude: number, decimals?: number) {
    this.latitude = Number((decimals)?latitude.toFixed(decimals):latitude);
    this.longitude = Number((decimals)?longitude.toFixed(decimals):longitude);
  }
}