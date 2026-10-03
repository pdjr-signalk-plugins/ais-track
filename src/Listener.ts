import { Socket, createSocket } from 'dgram';
import { AisDecode, AisDecodeOptions } from 'ggencoder';
import { Track } from './Track';
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
  private _track: Track | undefined = undefined;
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

    this._app.debug(`Listener[${this._port}]: creating listener "${this._name}"`);

    this._udpSocket.on('message', (msg: any, rinfo: any) => {
      this._app.debug(`Listener[${this._port}]: message received`);

      if (this._track && this._resetInterval && ((this._resetInterval * 60000) < Date.now())) {
        this._app.debug(`Listener[${this._port}]: closing track because reset interval has been reached`);
        this.saveTrack();
        this._track = undefined;
      }

      if (this._track && this._resetRepeat && (this._track.consecutiveRepeats() > this._resetRepeat)) {
        this._app.debug(`Listener[${this._port}]: closing track because reset repeat count has been reached`);
        this.saveTrack();
        this._track = undefined;
      }

      this._timestamp = Date.now();

      if (!this._track) {
        this._track = new Track(this._timestamp, this._app);
      }

      var ais: AisDecodeOptions = new AisDecode('' + msg);
      this._track.append(new Position(ais.lat || 0, ais.lon || 0, this._positionAccuracy));
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
    this._app.debug(`Listener[${this._port}]: started listening`);
    this._udpSocket.bind(this._port);
  }

  stopListening() {
    this._app.debug(`Listener[${this._port}]: stopped listening`);
    this._udpSocket.close();
    this.saveTrack();
    this._track = undefined;
  }

  async saveTrack() {
    this._app.debug(`Listener[${this._port}]: saving track to "${this._postUrl}"`);
    
    if ((this._track) && (this._track.length() > 1)) {
      const formData = new FormData();
      const jsonData = { name: this._name, feature: { type: "Feature", geometry: { type: "LineString", coordinates: [ this._track.positions().map((p: Position) => { return([ p.longitude, p.latitude ]); }) ] }}};
      const blob = new Blob([JSON.stringify(jsonData)], { type: 'application/json' });

      formData.append('file', blob, 'data.json');

      try {
        this._app.debug(`Listener[${this._port}]: posting track "${this._name}" to "${this._postUrl}"`);
        const response = await axios.post(this._postUrl, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } catch (error: any) {
        this._app.debug(`Listener[${this._port}]: error posting "${this._name}" (${error.response?.data || error.message})`);
      }
    } else {
      this._app.debug(`Listener[${this._port}]: refusing to save empty track "${this._name}"`);
    }
  }

}

