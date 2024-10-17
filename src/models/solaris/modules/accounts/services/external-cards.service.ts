import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { SolarisAuthService } from '../../auth/services/solaris-auth.service';
import { SOLARIS_API } from '../../../config/app.config';
import { catchError, map } from 'rxjs/operators';
import { lastValueFrom } from 'rxjs';
import {
  ActivateCardInput,
  CreateCardInput,
  CreateCardResponse,
  GetCardResponse,
  LostCardInput,
} from '../intefaces/cards.interfaces';

@Injectable()
export class SolarisExternalCardsService {
  constructor(
    private readonly httpService: HttpService,
    private readonly solarisAuthService: SolarisAuthService,
  ) {}

  async createCard(
    personId: string,
    accountId: string,
    createCardInput: CreateCardInput,
  ): Promise<CreateCardResponse> {
    const auth = await this.solarisAuthService.authentication();
    const observable = this.httpService
      .post<CreateCardResponse>(
        `${SOLARIS_API}/v1/persons/${personId}/accounts/${accountId}/cards`,
        createCardInput,
        {
          headers: {
            Authorization: `Bearer ${auth.access_token}`,
          },
        },
      )
      .pipe(
        map(({ data }) => data),
        catchError((e) => {
          throw new HttpException(e.response.data, e.response.status);
        }),
      );

    return lastValueFrom<CreateCardResponse>(observable).catch((error) => {
      Logger.error('Failed to create a card, error', JSON.stringify(error));
      throw new HttpException(
        'Failed to create a card, error',
        HttpStatus.BAD_REQUEST,
      );
    });
  }

  async getAllCards(personId: string): Promise<GetCardResponse[]> {
    const auth = await this.solarisAuthService.authentication();
    const observable = this.httpService
      .get<GetCardResponse[]>(`${SOLARIS_API}/v1/persons/${personId}/cards`, {
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
        },
      })
      .pipe(
        map(({ data }) => data),
        catchError((e) => {
          throw new HttpException(e.response.data, e.response.status);
        }),
      );

    return lastValueFrom<GetCardResponse[]>(observable).catch((error) => {
      Logger.error('Failed to get all cards, error', JSON.stringify(error));
      throw new HttpException(
        'Failed to get all cards',
        HttpStatus.BAD_REQUEST,
      );
    });
  }

  async gatCardById(cardId: string): Promise<GetCardResponse> {
    const auth = await this.solarisAuthService.authentication();
    const observable = this.httpService
      .get<GetCardResponse>(`${SOLARIS_API}/v1/cards/${cardId}`, {
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
        },
      })
      .pipe(
        map(({ data }) => data),
        catchError((e) => {
          throw new HttpException(e.response.data, e.response.status);
        }),
      );

    return lastValueFrom<GetCardResponse>(observable).catch((error) => {
      Logger.error('Failed to get card by id, error', JSON.stringify(error));
      throw new HttpException(
        'Failed to get card by id',
        HttpStatus.BAD_REQUEST,
      );
    });
  }

  async activateCard(
    cardId: string,
    activateCardInput: ActivateCardInput,
  ): Promise<GetCardResponse> {
    const auth = await this.solarisAuthService.authentication();
    const observable = this.httpService
      .post<GetCardResponse>(
        `${SOLARIS_API}/v1/cards/${cardId}/activate`,
        activateCardInput,
        {
          headers: {
            Authorization: `Bearer ${auth.access_token}`,
          },
        },
      )
      .pipe(
        map(({ data }) => data),
        catchError((e) => {
          throw new HttpException(e.response.data, e.response.status);
        }),
      );

    return lastValueFrom<GetCardResponse>(observable).catch((error) => {
      Logger.error('Failed to activate card, error', JSON.stringify(error));
      throw new HttpException(
        'Failed to activate card',
        HttpStatus.BAD_REQUEST,
      );
    });
  }

  async blockCard(cardId: string): Promise<GetCardResponse> {
    const auth = await this.solarisAuthService.authentication();
    const observable = this.httpService
      .post<GetCardResponse>(`${SOLARIS_API}/v1/cards/${cardId}/block`, null, {
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
        },
      })
      .pipe(
        map(({ data }) => data),
        catchError((e) => {
          throw new HttpException(e.response.data, e.response.status);
        }),
      );

    return lastValueFrom<GetCardResponse>(observable).catch((error) => {
      Logger.error('Failed to block card, error', JSON.stringify(error));
      throw new HttpException('Failed to block card', HttpStatus.BAD_REQUEST);
    });
  }

  async unblockCard(cardId: string): Promise<GetCardResponse> {
    const auth = await this.solarisAuthService.authentication();
    const observable = this.httpService
      .post<GetCardResponse>(
        `${SOLARIS_API}/v1/cards/${cardId}/unblock`,
        null,
        {
          headers: {
            Authorization: `Bearer ${auth.access_token}`,
          },
        },
      )
      .pipe(
        map(({ data }) => data),
        catchError((e) => {
          throw new HttpException(e.response.data, e.response.status);
        }),
      );

    return lastValueFrom<GetCardResponse>(observable).catch((error) => {
      Logger.error('Failed to unblock card, error', JSON.stringify(error));
      throw new HttpException('Failed to unblock card', HttpStatus.BAD_REQUEST);
    });
  }

  async closeCard(cardId: string): Promise<GetCardResponse> {
    const auth = await this.solarisAuthService.authentication();
    const observable = this.httpService
      .post<GetCardResponse>(`${SOLARIS_API}/v1/cards/${cardId}/close`, null, {
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
        },
      })
      .pipe(
        map(({ data }) => data),
        catchError((e) => {
          throw new HttpException(e.response.data, e.response.status);
        }),
      );

    return lastValueFrom<GetCardResponse>(observable).catch((error) => {
      Logger.error('Failed to close card, error', JSON.stringify(error));
      throw new HttpException('Failed to close card', HttpStatus.BAD_REQUEST);
    });
  }

  async lostCard(
    cardId: string,
    lostCardInput: LostCardInput,
  ): Promise<GetCardResponse> {
    const auth = await this.solarisAuthService.authentication();
    const observable = this.httpService
      .post<GetCardResponse>(
        `${SOLARIS_API}/v1/cards/${cardId}/lost_stolen_incidents`,
        lostCardInput,
        {
          headers: {
            Authorization: `Bearer ${auth.access_token}`,
          },
        },
      )
      .pipe(
        map(({ data }) => data),
        catchError((e) => {
          throw new HttpException(e.response.data, e.response.status);
        }),
      );

    return lastValueFrom<GetCardResponse>(observable).catch((error) => {
      Logger.error(
        'Failed to report about stolen card, error',
        JSON.stringify(error),
      );
      throw new HttpException(
        'Failed to report about stolen card',
        HttpStatus.BAD_REQUEST,
      );
    });
  }
}
