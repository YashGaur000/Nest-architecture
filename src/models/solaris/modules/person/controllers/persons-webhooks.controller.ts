import { Body, Controller, Logger, Post } from '@nestjs/common';
import { PersonsWebhooksService } from '../services/persons-webhooks.service';
import { PersonIdentificationWebhook } from '../intefaces/person-webhooks-interfaces';

@Controller('solaris/persons/webhooks')
export class SolarisPersonsWebhooksController {
  constructor(
    private readonly personsWebhooksService: PersonsWebhooksService,
  ) {}

  @Post('identification')
  async webhookIdentification(
    @Body() payload: PersonIdentificationWebhook,
  ): Promise<void> {
    Logger.log(JSON.stringify(payload), 'WEBHOOK identification');
    const data = Array.isArray(payload) ? payload : [payload];
    await this.personsWebhooksService.webhookIdentification(data);
  }
}
