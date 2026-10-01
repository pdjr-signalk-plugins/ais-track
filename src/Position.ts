export class Position {

  public latitude: number = 0;
  public longitude: number = 0;

  constructor(latitude: number, longitude: number, decimals: number = 4) {
    this.latitude = Number(latitude.toFixed(decimals));
    this.longitude = Number(longitude.toFixed(decimals));
  }
}