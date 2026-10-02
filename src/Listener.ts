import { Socket, createSocket } from 'dgram';
import { AisDecode, AisDecodeOptions } from 'ggencoder';
import { Positions } from './Positions';
import { Position } from './Position';
import axios, { AxiosError } from 'axios';

export class Listener {

  public accessToken: string | undefined = undefined;
  public app: any = undefined;
  public name: string;
  public port: number;
  public positionAccuracy: number;
  public postUrl: string;
  public resetInterval: number;
  public resetRepeat: number | undefined = undefined;

  public udpSocket: Socket;
  public timestamp: number = 0;
  public resourceName: string | null = null;
  public positions: Positions | null = null;

  constructor(options: any[], app?: any) {
    if (!options[0].hasOwnProperty('port')) throw new Error('missing \'port\' property');

    this.accessToken = getOption(options, 'accessToken');
    this.app = (app || undefined);
    this.name = (options[0].hasOwnProperty('name'))?options[0].name:options[0].port;
    this.port = options[0].port;
    this.positionAccuracy = getOption(options, 'positionAccuracy');
    this.postUrl = getOption(options, 'postUrl');
    this.resetInterval = getOption(options, 'resetInterval');
    this.resetRepeat = getOption(options, 'resetRepeat');

    this.dump();

    this.udpSocket = createSocket('udp4');

    this.udpSocket.on('message', (msg: any, rinfo: any) => {
      this.app.debug(`Listener: position report received on port ${this.port}`);

      if (this.timestamp != 0) {
        if (((this.timestamp + (this.resetInterval * 60000)) < Date.now()) || (this.resetRepeat && this.positions && (this.positions.consecutiveRepeats() > this.resetRepeat))) {
          this.closeResource();
          this.timestamp = 0;
        }
      }

      if (this.timestamp == 0) {
        this.openResource((new Date()).toISOString());
      }

      this.timestamp = Date.now();
      var ais: AisDecodeOptions = new AisDecode('' + msg);
      if (this.positions) this.positions.append(new Position(ais.lat || 0, ais.lon || 0, this.positionAccuracy));
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

  dump() {
    console.log(`>>>>>>>>>>>>>>>> ${JSON.stringify({
      accessToken: this.accessToken,
      name: this.name,
      port: this.port,
      positionAccuracy: this.positionAccuracy,
      postUrl: this.postUrl,
      resetInterval: this.resetInterval,
      resetRepeat: this.resetRepeat
    }, null, 2)}`);
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
      const jsonData = { name: this.resourceName, feature: { type: "Feature", geometry: { type: "LineString", coordinates: [ this.positions.positions().map((p: Position) => { return([ p.longitude, p.latitude ]); }) ] }}};
      const blob = new Blob([JSON.stringify(jsonData)], { type: 'application/json' });

      formData.append('file', blob, 'data.json');

      try {
        const response = await axios.post(this.postUrl, formData, {
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

