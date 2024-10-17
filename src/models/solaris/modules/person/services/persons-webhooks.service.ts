import { Injectable, Logger } from '@nestjs/common';
import { PersonIdentificationWebhook } from '../intefaces/person-webhooks-interfaces';
import { SolarisPersonRepository } from '../repositories/persons.repository';
import { SolarisInternalAccountsService } from '../../accounts/services/internal-accounts.service';
import { PersonIdentificationStatus } from '../enums/person.enums';

@Injectable()
export class PersonsWebhooksService {
  constructor(
    private readonly solarisPersonRepository: SolarisPersonRepository,
    private readonly solarisInternalAccountsService: SolarisInternalAccountsService,
  ) {}

  async webhookIdentification(
    data: PersonIdentificationWebhook[],
  ): Promise<void> {
    if (!data || !data.length) {
      Logger.error('WebhookIdentification: payload is empty');
    }
    for (const value of data) {
      try {
        Logger.log(JSON.stringify(value), `WebhookIdentification: RAW data`);

        const existingUser =
          await this.solarisPersonRepository.getPersonByPersonId(
            value.person_id,
          );
        if (!existingUser) {
          Logger.error(
            `WebhookIdentification: user with person id ${value.person_id} not exist in system`,
          );
          continue;
        }
        await this.solarisPersonRepository.updatePersonByPersonId(
          value.person_id,
          {
            $set: {
              'identifications.status': value.status,
              'identifications.updated_date': new Date().toISOString(),
            },
          },
        );

        if (value.status === PersonIdentificationStatus.successful) {
          await this.solarisInternalAccountsService.createAccount(
            value.person_id,
          );
          Logger.log('WebhookIdentification: successful, account created');
        }
        Logger.log(
          `WebhookIdentification: Successfully update identifications status from ${existingUser?.identifications?.status} to ${value.status} for person id ${value.person_id}`,
        );
      } catch (error) {
        Logger.error(
          JSON.stringify(error),
          'WebhookIdentification: failed to update identification status',
        );
      }
    }
  }
}
