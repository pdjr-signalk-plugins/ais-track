import { Socket, createSocket } from 'dgram';
import { AisDecode, AisDecodeOptions } from 'ggencoder';
import { Positions } from './Positions';
import { Position } from './Position';
import axios, { AxiosError } from 'axios';

export class Listener {

  public app: any | null = null;
  public port: number;
  public resetInterval: number;
  public positionAccuracy: number;
  public putUrl: string;

  public udpSocket: Socket;
  public timestamp: number = 0;
  public resourceName: string | null = null;
  public positions: Positions | null = null;

  constructor(options: any[], app: any) {
    if (!options[0].hasOwnProperty('port')) throw new Error('missing \'port\' property');

    this.app = app;
    this.port = options[0].port;
    this.resetInterval = getOption(options, 'resetInterval');
    this.positionAccuracy = getOption(options, 'positionAccuracy');
    this.putUrl = getOption(options, 'putUrl');

    this.udpSocket = createSocket('udp4');

    this.udpSocket.on('message', (msg: any, rinfo: any) => {
      this.app.debug(`Listener: position report received on port ${this.port}`);

      if ((this.timestamp != 0) && ((this.timestamp + (this.resetInterval * 60000)) < Date.now())) {
        this.app.debug(`Listener: saving current track "${this.resourceName}"`);
        this.saveResource();
        this.timestamp = 0;
      }
      if (this.timestamp == 0) {
        this.resourceName = (new Date()).toISOString();
        this.app.debug(`Listener: starting new track "${this.resourceName}"`);
        this.positions = new Positions(this.app);
      }
      this.timestamp = Date.now();
      var ais: AisDecodeOptions = new AisDecode('' + msg);
      if (this.positions) this.positions.add(new Position(ais.lat || 0, ais.lon || 0));
    });
      
    /**
     * 
     * @param objects - an array of arbitrary objects which may contain 'name'
     * @param name - the identifier of a property that may be contained in 'objects'
     * @param fallback - the value to be returned if 'name' is not found in any object.
     * @returns 
     */
    function getOption(options: any[], name: string): any {
      var retval: any = undefined;
      options.reverse().forEach((opt) => {
        if (opt.hasOwnProperty(name)) retval = opt[name];
      });
      return(retval);
    }

  this.app.debug(`Listener complete`);

  }

  startListening() {
    this.udpSocket.bind(this.port);
  }

  stopListening() {
    this.udpSocket.close();
    this.saveResource();
  }

  async saveResource() {
    console.log(`saving resource: ${(this.positions)?this.positions.length():0} to ${this.resourceName}`);
    if ((this.positions) && (this.positions.length() > 1)) {
      var json: any = {
        name: this.resourceName,
        feature: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [ this.positions.positions.map((p: Position) => { return([ p.longitude, p.latitude ]); }) ]
          }
        }
      };
      try {
        var res: any = await axios(this.putUrl, json);
        this.app.debug(`Listener: PUT response = ${res.status}`);
      } catch(e: any) {
        this.app.debug(`Listener: PUT failed`);
      }
    }
  }

}

