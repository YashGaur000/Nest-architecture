import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SolarisAuthService } from '../../auth/services/solaris-auth.service';
import { SOLARIS_API } from '../../../config/app.config';
import {
  SolarisCreateIdentificationInput,
  SolarisCreateIdentificationResponse,
  SolarisCreatePersonInput,
  SolarisCreatePersonTaxIdentificationInput,
  SolarisCreatePersonTaxIdentificationResponse,
  SolarisGenerateIdentificationUrlResponse,
  SolarisMobileNumberResponse,
  SolarisExternalPerson,
} from '../intefaces/person-interfaces';

@Injectable()
export class SolarisExternalPersonsService {
  constructor(
    private readonly httpService: HttpService,
    private readonly solarisAuthService: SolarisAuthService,
  ) {}

  async getPerson(personId: string): Promise<SolarisExternalPerson> {
    const auth = await this.solarisAuthService.authentication();
    const observable = this.httpService
      .get<SolarisExternalPerson>(`${SOLARIS_API}/v1/persons/${personId}`, {
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

    return lastValueFrom<SolarisExternalPerson>(observable).catch((error) => {
      Logger.error('Failed to get person, error', JSON.stringify(error));
      throw new HttpException('Failed to get person', HttpStatus.BAD_REQUEST);
    });
  }

  async createPerson(
    payload: SolarisCreatePersonInput,
  ): Promise<SolarisExternalPerson> {
    const auth = await this.solarisAuthService.authentication();
    const observable = this.httpService
      .post<SolarisExternalPerson>(`${SOLARIS_API}/v1/persons`, payload, {
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

    return lastValueFrom<SolarisExternalPerson>(observable).catch((error) => {
      Logger.error('Create new person failed, error', JSON.stringify(error));
      throw new HttpException(
        'Failed to create person',
        HttpStatus.BAD_REQUEST,
      );
    });
  }

  async updatePerson(
    id: string,
    payload: SolarisCreatePersonInput,
  ): Promise<SolarisExternalPerson> {
    const auth = await this.solarisAuthService.authentication();
    const observable = this.httpService
      .patch<SolarisExternalPerson>(
        `${SOLARIS_API}/v1/persons/${id}`,
        payload,
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

    return lastValueFrom<SolarisExternalPerson>(observable).catch((error) => {
      Logger.error('Create new person failed, error', error);
      throw new HttpException(
        'Failed to update person',
        HttpStatus.BAD_REQUEST,
      );
    });
  }

  async createTaxIdentification(
    personId: string,
    payload: SolarisCreatePersonTaxIdentificationInput,
  ): Promise<SolarisCreatePersonTaxIdentificationResponse> {
    const auth = await this.solarisAuthService.authentication();
    const observable = this.httpService
      .post<SolarisCreatePersonTaxIdentificationResponse>(
        `${SOLARIS_API}/v1/persons/${personId}/tax_identifications`,
        payload,
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

    return lastValueFrom<SolarisCreatePersonTaxIdentificationResponse>(
      observable,
    ).catch((error) => {
      Logger.error('Create tax identification failed, error', error);
      throw new HttpException(
        'Failed to create tax identification',
        HttpStatus.BAD_REQUEST,
      );
    });
  }

  async createIdentification(
    personId: string,
    payload: SolarisCreateIdentificationInput,
  ): Promise<SolarisCreateIdentificationResponse> {
    const auth = await this.solarisAuthService.authentication();
    const observable = this.httpService
      .post<SolarisCreateIdentificationResponse>(
        `${SOLARIS_API}/v1/persons/${personId}/identifications`,
        payload,
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

    return lastValueFrom<SolarisCreateIdentificationResponse>(observable).catch(
      (error) => {
        Logger.error('Create identification failed, error', error);
        throw new HttpException(
          'Failed to create identification',
          HttpStatus.BAD_REQUEST,
        );
      },
    );
  }

  async generateIdentificationUrl(
    personId: string,
    id: string,
  ): Promise<SolarisGenerateIdentificationUrlResponse> {
    const auth = await this.solarisAuthService.authentication();
    const observable = this.httpService
      .patch<SolarisGenerateIdentificationUrlResponse>(
        `${SOLARIS_API}/v1/persons/${personId}/identifications/${id}/request`,
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

    return lastValueFrom<SolarisGenerateIdentificationUrlResponse>(
      observable,
    ).catch((error) => {
      Logger.error('Generate identification url failed, error', error);
      throw new HttpException(
        'Failed to create identification url',
        HttpStatus.BAD_REQUEST,
      );
    });
  }

  async createMobileNumber(
    personId: string,
    mobileNumber: string,
  ): Promise<SolarisMobileNumberResponse> {
    const auth = await this.solarisAuthService.authentication();
    const observable = this.httpService
      .post<SolarisMobileNumberResponse>(
        `${SOLARIS_API}/v1/persons/${personId}/mobile_number`,
        { number: mobileNumber },
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

    return lastValueFrom<SolarisMobileNumberResponse>(observable).catch(
      (error) => {
        Logger.error('Create Mobile Number failed, error', error);
        throw new HttpException(
          'Create Mobile Number failed',
          HttpStatus.BAD_REQUEST,
        );
      },
    );
  }

  async mobileNumberAuthorize(
    personId: string,
    mobileNumber: string,
  ): Promise<SolarisMobileNumberResponse> {
    const auth = await this.solarisAuthService.authentication();
    const observable = this.httpService
      .post<SolarisMobileNumberResponse>(
        `${SOLARIS_API}/v1/persons/${personId}/mobile_number/authorize`,
        { number: mobileNumber },
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

    return lastValueFrom<SolarisMobileNumberResponse>(observable).catch(
      (error) => {
        Logger.error('Mobile Number Authorize failed, error', error);
        throw new HttpException(
          'Mobile Number Authorize failed',
          HttpStatus.BAD_REQUEST,
        );
      },
    );
  }

  async mobileNumberConfirm(
    personId: string,
    mobileNumber: string,
    token: string,
  ): Promise<SolarisMobileNumberResponse> {
    const auth = await this.solarisAuthService.authentication();
    const observable = this.httpService
      .post<SolarisMobileNumberResponse>(
        `${SOLARIS_API}/v1/persons/${personId}/mobile_number/confirm`,
        { number: mobileNumber, token },
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

    return lastValueFrom<SolarisMobileNumberResponse>(observable).catch(
      (error) => {
        Logger.error('Mobile Number Confirm failed, error', error);
        throw new HttpException(
          'Mobile Number Confirm failed',
          HttpStatus.BAD_REQUEST,
        );
      },
    );
  }
}
