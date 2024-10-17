import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ApplicationService } from './application.service';

export const GATEWAY_EVENT_APP_SETTINGS = 'application-settings';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ApplicationGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly applicationService: ApplicationService) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async emitApplicationSettings(): Promise<void> {
    const setting = await this.applicationService.getApplicationSettings();
    this.server.emit(GATEWAY_EVENT_APP_SETTINGS, setting);
  }
}
