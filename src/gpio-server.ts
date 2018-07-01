import { createServer, Server } from 'http';
import * as express from 'express';
import * as socketIo from 'socket.io';
import { GpioService } from './gpio.service';

import Socket = NodeJS.Socket;

const gpioService = new GpioService(require('../gpio.config.json'));

class GpioServer {
  public static readonly PORT: number = 8080;
  private app: express.Application;
  private server: Server;
  private io: socketIo.Server;
  private port: string | number;

  constructor() {
    this.createServer();
    this.listen();
  }

  private createServer(): void {
    this.port = process.env.PORT || GpioServer.PORT;
    this.app = express();
    this.server = createServer(this.app);
    this.io = socketIo(this.server);
  }

  private listen(): void {
    this.server.listen(this.port, () => {
      console.log('Running server on port %s ', this.port);
      gpioService.registerTemperatureEvent(this.io);
    });

    this.io.on('connect', (socket: Socket) => {
      console.log('Connected client on port %s.', this.port);
      gpioService.initializeConnectEmissions(this.io);
      gpioService.registerLedEvent(socket, this.io);
      gpioService.registerLaserEvent(socket, this.io);
      gpioService.registerRGBEvent(socket, this.io);

      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}

process
    .on('exit', () => {
      gpioService.terminateAdapters();
      process.exit(); // exit completely
    })
    .on('SIGINT', () => { // on ctrl+c
      gpioService.terminateAdapters();
      process.exit(2); // exit completely
    });
export default new GpioServer().getApp();
