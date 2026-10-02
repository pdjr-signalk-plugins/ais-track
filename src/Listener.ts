import { Socket, createSocket } from 'dgram';
import { AisDecode, AisDecodeOptions } from 'ggencoder';
import { Positions } from './Positions';
import { Position } from './Position';
import axios, { AxiosError } from 'axios';

export class Listener {

  private _app: any;
  private _name: string;
  private _port: number;
  private _postUrl: string;
  private _accessToken: string | undefined;
  private _positionAccuracy: number;
  private _resetInterval: number;
  private _resetRepeat: number;

  private _udpSocket: Socket;
  private _timestamp: number = 0;
  private _positions: Positions | undefined = undefined;
  private _resourceId: string = '';

  constructor(options: any[], app: any) {
    if (!options[0].hasOwnProperty('port')) throw new Error('missing \'port\' property');
    if (!options[0].hasOwnProperty('postUrl')) throw new Error('missing \'postUrl\' property');
  
    this._app = app;
    this._name = (options[0].hasOwnProperty('name'))?options[0].name:options[0].port;
    this._port = options[0].port;
    this._postUrl = getOption(options, 'postUrl');
    this._accessToken = getOption(options, 'accessToken');
    this._positionAccuracy = getOption(options, 'positionAccuracy');
    this._resetInterval = getOption(options, 'resetInterval');
    this._resetRepeat = getOption(options, 'resetRepeat');

    this._udpSocket = createSocket('udp4');

    this._app(`Listener: constructor: creating Listener "${this._name}" on port ${this._port}`);

    this._udpSocket.on('message', (msg: any, rinfo: any) => {
      this._app.debug(`Listener: position report received on port ${this._port}`);

      if (this._timestamp != 0) {
        if (((this._timestamp + (this._resetInterval * 60000)) < Date.now()) || (this._resetRepeat && this._positions && (this._positions.consecutiveRepeats() > this._resetRepeat))) {
          this.closeResource();
          this._timestamp = 0;
        }
      }

      if (this._timestamp == 0) {
        this.openResource((new Date()).toISOString());
      }

      this._timestamp = Date.now();
      var ais: AisDecodeOptions = new AisDecode('' + msg);
      if (this._positions) this._positions.append(new Position(ais.lat || 0, ais.lon || 0, this._positionAccuracy));
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

  getName() { return(this._name); }
  getPort() { return(this._port); }

  startListening() {
    this._app.debug(`Listener: startListening: listening on port ${this._port}`);
    this._udpSocket.bind(this._port);
  }

  stopListening() {
    this._app.debug(`Listener: stopListening:`);
    this._udpSocket.close();
    this.closeResource();
  }

  openResource(id: string) {
    this._app.debug(`Listener: openResource: starting new track`);
    this._resourceId = id;
    this._positions = new Positions(this._app);
  }

  async closeResource() {
    this._app.debug(`Listener: closeResource: saving resource with ${(this._positions)?this._positions.length():0}`);
    
    if ((this._positions) && (this._positions.length() > 1)) {
      const formData = new FormData();
      const jsonData = { name: this._name, feature: { type: "Feature", geometry: { type: "LineString", coordinates: [ this._positions.positions().map((p: Position) => { return([ p.longitude, p.latitude ]); }) ] }}};
      const blob = new Blob([JSON.stringify(jsonData)], { type: 'application/json' });

      formData.append('file', blob, 'data.json');

      try {
        const response = await axios.post(this._postUrl, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        this._app.debug(`Listener: closeResource: response: ${response.data}`);
      } catch (error: any) {
        this._app.debug(`Listener: closeResource: error: ${error.response?.data || error.message}`);
      }
    } else {
      this._app.debug(`Listener: closeResource: refusing to save an empty track`);
    }
  }

}

