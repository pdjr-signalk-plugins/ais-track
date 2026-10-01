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
        this.closeResource();
        this.timestamp = 0;
      }
      if (this.timestamp == 0) {
        this.openResource((new Date()).toISOString());
      }
      this.timestamp = Date.now();
      var ais: AisDecodeOptions = new AisDecode('' + msg);
      if (this.positions) this.positions.append(new Position(ais.lat || 0, ais.lon || 0));
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
  }

  startListening() {
    this.app.debug(`Listener: startListening: listening on port ${this.port}`);

    this.udpSocket.bind(this.port);
  }

  stopListening() {
    this.app.debug(`Listener: stopListening:`);

    this.udpSocket.close();
    this.closeResource();
  }

  openResource(name: string) {
    this.app.debug(`Listener: openResource: starting new track "${name}"`);

    this.resourceName = name;
    this.positions = new Positions(this.app);
  }

  async closeResource() {
    this.app.debug(`Listener: closeResource: saving resource: ${(this.positions)?this.positions.length():0} to ${this.resourceName}`);
    
    if ((this.positions) && (this.positions.length() > 1)) {
      const formData = new FormData();
      const jsonData = { name: this.resourceName, feature: { type: "Feature", geometry: { type: "LineString", coordinates: [ this.positions.positions.map((p: Position) => { return([ p.longitude, p.latitude ]); }) ] }}};
      const blob = new Blob([JSON.stringify(jsonData)], { type: 'application/json' });

      formData.append('file', blob, 'data.json');

      try {
        const response = await axios.post(this.putUrl, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        this.app.debug(`Listener: closeResource: response: ${response.data}`);
      } catch (error: any) {
        this.app.debug(`Listener: closeResource: error: ${error.response?.data || error.message}`);
      }
    } else {
      this.app.debug(`Listener: closeResource: refusing to save an empty track`);
    }
  }

}

