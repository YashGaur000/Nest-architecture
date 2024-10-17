import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  CreateAccountInput,
  SolarisAccount,
} from '../intefaces/accounts.interfaces';
import { SolarisExternalAccountService } from './external-accounts.service';
import { SolarisPersonRepository } from '../../person/repositories/persons.repository';
import { GetAccountDto } from '../dto/get-account.dto';
import { SolarisInternalPersonsService } from '../../person/services/internal-persons.service';
import { mapToSolarisAccount } from '../mappers/accounts.mapper';
import { CreateCardDto } from '../dto/create-card.dto';

@Injectable()
export class SolarisInternalAccountsService {
  constructor(
    private readonly solarisInternalPersonsService: SolarisInternalPersonsService,
    private readonly solarisPersonRepository: SolarisPersonRepository,
    private readonly solarisExternalAccountService: SolarisExternalAccountService,
  ) {}

  async createAccount(personId: string): Promise<void> {
    try {
      const person = await this.solarisPersonRepository.getPersonByPersonId(
        personId,
      );
      if (!person) {
        throw new HttpException('User not exist', HttpStatus.BAD_REQUEST);
      }
      const createAccountInput: CreateAccountInput = {
        type: 'CHECKING_PERSONAL',
        purpose: 'Main Account',
      };
      const account = await this.solarisExternalAccountService.createAccount(
        personId,
        createAccountInput,
      );

      await this.solarisPersonRepository.updatePersonByPersonId(personId, {
        account_id: account.id,
      });
    } catch (error) {
      Logger.error(error, 'Failed to create account');
      throw new HttpException(
        'Failed to create account',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getAccount(getAccountDto: GetAccountDto): Promise<SolarisAccount> {
    try {
      // TODO change logic to get data of person
      const person = await this.solarisPersonRepository.getPerson(
        getAccountDto.identity,
      );
      if (!person) {
        throw new HttpException('User not exist', HttpStatus.BAD_REQUEST);
      }

      const account = await this.solarisExternalAccountService.getAccount(
        person.person_id,
        person.account_id,
      );
      return mapToSolarisAccount(account);
    } catch (error) {
      Logger.error(error, 'Failed to create account');
      throw new HttpException(
        'Failed to get account info',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
