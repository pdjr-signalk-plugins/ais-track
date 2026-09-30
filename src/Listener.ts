import { Socket, createSocket } from 'dgram';
import { AisDecode, AisDecodeOptions } from 'ggencoder';
import { Positions } from './Positions';
import { Position } from './Position';

export class Listener {

  public port: number = 0;
  public resetInterval: number = 0;
  public positionAccuracy: number = 4;

  public udpSocket: Socket;
  public timestamp: number = 0;
  public resourceName: string | null = null;
  public positions: Positions;

  constructor(option: any, options: any, defaults: any) {
    if (!option.port) throw new Error('missing \'port\' property');

    this.port = option.port;
    this.positionAccuracy = getOption([option, options], 'positionAccuracy', defaults.POSITION_ACCURACY);
    this.resetInterval = getOption([option, options], 'resetInterval', defaults.RESET_INTERVAL);

    this.positions = new Positions();
    this.udpSocket = createSocket('udp4');
    this.udpSocket.on('message', (msg: any, rinfo: any) => {
      if ((this.timestamp != 0) && ((this.timestamp + (this.resetInterval * 1000)) < Date.now())) {
        this.saveResource();
        this.timestamp = 0;
      }
      if (this.timestamp == 0) {
        this.resourceName = (new Date()).toISOString();
      }
      this.timestamp = Date.now();
      var ais: AisDecodeOptions = new AisDecode('' + msg);
      this.positions.add(new Position(ais.lat || 0, ais.lon || 0));
    });
      
    /**
     * 
     * @param objects - an array of arbitrary objects which may contain 'name'
     * @param name - the identifier of a property that may be contained in 'objects'
     * @param fallback - the value to be returned if 'name' is not found in any object.
     * @returns 
     */
    function getOption(objects: any[], name: string, fallback: any): any {
      if (objects.length == 0) {
        return(fallback);
      } else {
        if (objects[0][name] !== undefined) {
          return(objects[0][name]);
        } else {
          return(getOption(objects.slice(1), name, fallback));
        }
      }
    }

  }

  startListening() {
    this.udpSocket.bind(this.port);
  }

  stopListening() {
    this.udpSocket.close();
    this.saveResource();
  }

  saveResource() {

  }

}

