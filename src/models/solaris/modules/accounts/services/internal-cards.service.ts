import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { SolarisPersonRepository } from '../../person/repositories/persons.repository';
import { CreateCardDto } from '../dto/create-card.dto';
import { SolarisExternalCardsService } from './external-cards.service';
import { SolarisExternalPersonsService } from '../../person/services/external-persons.service';
import { v4 as uuidv4 } from 'uuid';
import {
  ActivateCardInput,
  CreateCardInput,
  LostCardInput,
  SolarisCard,
} from '../intefaces/cards.interfaces';
import { GetCardsDto } from '../dto/get-cards.dto';
import { mapToSolarisCard } from '../mappers/cards.mapper';
import { CardStatusEnum, CardTypeEnum } from '../enums/cards.enums';
import { ActivateCardDto } from '../dto/activate-card.dto';
import { BlockCardDto } from '../dto/block-card.dto';
import { LostCardDto } from '../dto/lost-card.dto';

@Injectable()
export class SolarisInternalCardsService {
  constructor(
    private readonly solarisPersonRepository: SolarisPersonRepository,
    private readonly solarisExternalPersonsService: SolarisExternalPersonsService,
    private readonly solarisExternalCardsService: SolarisExternalCardsService,
  ) {}

  async createCard(createCardDto: CreateCardDto): Promise<void> {
    try {
      const internalPerson = await this.solarisPersonRepository.getPerson(
        createCardDto.identity,
      );
      if (!internalPerson) {
        throw new HttpException('User not exist', HttpStatus.BAD_REQUEST);
      }

      const externalPerson = await this.solarisExternalPersonsService.getPerson(
        internalPerson.person_id,
      );

      if (!externalPerson) {
        throw new HttpException('User not exist', HttpStatus.BAD_REQUEST);
      }

      const createCardInput: CreateCardInput = {
        pin: createCardDto.pin,
        type: createCardDto.type,
        // line_1: `${externalPerson.first_name}/${externalPerson.last_name}`, // TODO revert after go to PROD
        line_1: `${externalPerson.last_name}/${externalPerson.last_name}`,
        reference: `KASH#${uuidv4()}`,
      };

      await this.solarisExternalCardsService.createCard(
        internalPerson.person_id,
        internalPerson.account_id,
        createCardInput,
      );

      this.solarisPersonRepository.updatePerson(createCardDto.identity, {
        account_approved: true,
      });
    } catch (error) {
      Logger.error(error, 'Failed to create card');
      throw new HttpException('Failed to create card', HttpStatus.BAD_REQUEST);
    }
  }

  async getAllCards(getCardsDto: GetCardsDto): Promise<SolarisCard[]> {
    try {
      const internalPerson = await this.solarisPersonRepository.getPerson(
        getCardsDto.identity,
      );
      if (!internalPerson) {
        throw new HttpException('User not exist', HttpStatus.BAD_REQUEST);
      }

      const cards: SolarisCard[] = [];
      const existingCards = await this.solarisExternalCardsService
        .getAllCards(internalPerson.person_id)
        .catch(() => []);

      const standardCard = existingCards.find(
        (card) => card.type === CardTypeEnum.STANDARD,
      );

      const virtualCard = existingCards.find(
        (card) => card.type === CardTypeEnum.VIRTUAL,
      );

      if (!standardCard) {
        cards.push({
          type: CardTypeEnum.STANDARD,
          status: CardStatusEnum.NOT_ORDERED,
        });
      } else {
        cards.push(mapToSolarisCard(standardCard));
      }

      if (!virtualCard) {
        cards.push({
          type: CardTypeEnum.VIRTUAL,
          status: CardStatusEnum.NOT_ORDERED,
        });
      } else {
        cards.push(mapToSolarisCard(virtualCard));
      }

      return cards;
    } catch (error) {
      Logger.error(error, 'Failed to get all cards');
      throw new HttpException(
        'Failed to get all cards',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async activateCard(activateCardDto: ActivateCardDto): Promise<void> {
    try {
      const internalPerson = await this.solarisPersonRepository.getPerson(
        activateCardDto.identity,
      );
      if (!internalPerson) {
        throw new HttpException('User not exist', HttpStatus.BAD_REQUEST);
      }

      const externalPerson = await this.solarisExternalPersonsService
        .getPerson(internalPerson.person_id)
        .catch(() => null);

      if (!externalPerson) {
        throw new HttpException('User not exist', HttpStatus.BAD_REQUEST);
      }

      const existingCard = await this.solarisExternalCardsService
        .gatCardById(activateCardDto.card_id)
        .catch(() => null);

      if (!existingCard) {
        throw new HttpException(`Card not found`, HttpStatus.BAD_REQUEST);
      }

      let activateCardInput: ActivateCardInput = {};
      if (existingCard.type === CardTypeEnum.STANDARD) {
        if (!activateCardDto.verification_token) {
          throw new HttpException(
            'Verification token is required to activate a card',
            HttpStatus.BAD_REQUEST,
          );
        }
        activateCardInput = {
          verification_token: activateCardDto.verification_token,
        };
      }
      await this.solarisExternalCardsService.activateCard(
        activateCardDto.card_id,
        activateCardInput,
      );
    } catch (error) {
      Logger.error(error, 'Failed to activate card');
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async blockCard(blockCardDto: BlockCardDto): Promise<void> {
    try {
      const internalPerson = await this.solarisPersonRepository.getPerson(
        blockCardDto.identity,
      );
      if (!internalPerson) {
        throw new HttpException('User not exist', HttpStatus.BAD_REQUEST);
      }

      const externalPerson = await this.solarisExternalPersonsService
        .getPerson(internalPerson.person_id)
        .catch(() => null);

      if (!externalPerson) {
        throw new HttpException('User not exist', HttpStatus.BAD_REQUEST);
      }

      const existingCard = await this.solarisExternalCardsService
        .gatCardById(blockCardDto.card_id)
        .catch(() => null);

      if (!existingCard) {
        throw new HttpException(`Card not found`, HttpStatus.BAD_REQUEST);
      }

      await this.solarisExternalCardsService.blockCard(blockCardDto.card_id);
    } catch (error) {
      Logger.error(error, 'Failed to block card');
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async unblockCard(blockCardDto: BlockCardDto): Promise<void> {
    try {
      const internalPerson = await this.solarisPersonRepository.getPerson(
        blockCardDto.identity,
      );
      if (!internalPerson) {
        throw new HttpException('User not exist', HttpStatus.BAD_REQUEST);
      }

      const externalPerson = await this.solarisExternalPersonsService
        .getPerson(internalPerson.person_id)
        .catch(() => null);

      if (!externalPerson) {
        throw new HttpException('User not exist', HttpStatus.BAD_REQUEST);
      }

      const existingCard = await this.solarisExternalCardsService
        .gatCardById(blockCardDto.card_id)
        .catch(() => null);

      if (!existingCard) {
        throw new HttpException(`Card not found`, HttpStatus.BAD_REQUEST);
      }

      await this.solarisExternalCardsService.unblockCard(blockCardDto.card_id);
    } catch (error) {
      Logger.error(error, 'Failed to unblock card');
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async closeCard(blockCardDto: BlockCardDto): Promise<void> {
    try {
      const internalPerson = await this.solarisPersonRepository.getPerson(
        blockCardDto.identity,
      );
      if (!internalPerson) {
        throw new HttpException('User not exist', HttpStatus.BAD_REQUEST);
      }

      const externalPerson = await this.solarisExternalPersonsService
        .getPerson(internalPerson.person_id)
        .catch(() => null);

      if (!externalPerson) {
        throw new HttpException('User not exist', HttpStatus.BAD_REQUEST);
      }

      const existingCard = await this.solarisExternalCardsService
        .gatCardById(blockCardDto.card_id)
        .catch(() => null);

      if (!existingCard) {
        throw new HttpException(`Card not found`, HttpStatus.BAD_REQUEST);
      }

      await this.solarisExternalCardsService.closeCard(blockCardDto.card_id);
    } catch (error) {
      Logger.error(error, 'Failed to close card');
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async lostCard(lostCardDto: LostCardDto): Promise<void> {
    try {
      const internalPerson = await this.solarisPersonRepository.getPerson(
        lostCardDto.identity,
      );
      if (!internalPerson) {
        throw new HttpException('User not exist', HttpStatus.BAD_REQUEST);
      }

      const externalPerson = await this.solarisExternalPersonsService
        .getPerson(internalPerson.person_id)
        .catch(() => null);

      if (!externalPerson) {
        throw new HttpException('User not exist', HttpStatus.BAD_REQUEST);
      }

      const existingCard = await this.solarisExternalCardsService
        .gatCardById(lostCardDto.card_id)
        .catch(() => null);

      if (!existingCard) {
        throw new HttpException(`Card not found`, HttpStatus.BAD_REQUEST);
      }

      const lostCardInput: LostCardInput = {
        loss_reason: lostCardDto.loss_reason,
        lost_at: new Date().toISOString(),
        order_replacement: false,
        retain_pin: false,
      };
      await this.solarisExternalCardsService.lostCard(
        lostCardDto.card_id,
        lostCardInput,
      );
    } catch (error) {
      Logger.error(error, 'Failed to report about stolen card');
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }
}
