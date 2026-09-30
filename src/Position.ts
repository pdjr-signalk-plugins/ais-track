export class Position {

  static decimals: number = 4;

  public latitude: number = 0;
  public longitude: number = 0;

  constructor(latitude: number, longitude: number) {
    this.latitude = Number(latitude.toFixed(Position.decimals));
    this.longitude = Number(longitude.toFixed(Position.decimals));
  }

  public static setDecimals(decimals: number) {
    Position.decimals = decimals;
  }
}