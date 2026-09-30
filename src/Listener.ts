import { Socket, createSocket } from 'dgram';
import { AisDecode, AisDecodeOptions } from 'ggencoder';
import { Positions } from './Positions';
import { Position } from './Position';

export class Listener {

  public port: number;
  public resetInterval: number;
  public positionAccuracy: number;

  public udpSocket: Socket;
  public timestamp: number = 0;
  public resourceName: string | null = null;
  public positions: Positions | null = null;

  constructor(options: any[]) {
    if (!options[0].port) throw new Error('missing \'port\' property');

    this.port = options[0].port;
    this.resetInterval = getOption(options, 'resetInterval');
    this.positionAccuracy = getOption(options, 'positionAccuracy');

    this.udpSocket = createSocket('udp4');
    this.udpSocket.on('message', (msg: any, rinfo: any) => {
      if ((this.timestamp != 0) && ((this.timestamp + (this.resetInterval * 1000)) < Date.now())) {
        this.saveResource();
        this.timestamp = 0;
      }
      if (this.timestamp == 0) {
        this.resourceName = (new Date()).toISOString();
        this.positions = new Positions();
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

  }

  startListening() {
    this.udpSocket.bind(this.port);
  }

  stopListening() {
    this.udpSocket.close();
    this.saveResource();
  }

  saveResource() {
    console.log(`saving resource: ${(this.positions)?this.positions.length():0} to ${this.resourceName}`);
  }

}

