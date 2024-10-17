import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { IntercomService } from './intercom.service';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { InvestmentRestrictions } from '../common/user-interfaces';

const TAG_ID_DISABLE_2FA_VERIFICATION = '6338819';
export const TAG_ID_PRIME_TRUST = '6360598';

@Injectable()
export class UserIntercomService {
  constructor(
    private httpService: HttpService,
    private intercomService: IntercomService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getUserByIdAndTagId(id: string, tagId: string) {
    try {
      const query = {
        query: {
          operator: 'AND',
          value: [
            { field: 'id', operator: '=', value: id },
            { field: 'tag_id', operator: '=', value: tagId },
          ],
        },
      };

      return this.intercomService.getUserByQuery(query);
    } catch (e) {
      throw new HttpException(
        'Something went wrong. Please try again later',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async isUserHasTag(email: string, tagName: string) {
    try {
      const tags = await this.intercomService.getTags();
      const tag = tags.find((tag) => tag.name === tagName);

      if (!tag) {
        return null;
      }

      const query = {
        query: {
          operator: 'AND',
          value: [
            { field: 'email', operator: '=', value: email },
            { field: 'tag_id', operator: '=', value: tag?.id },
          ],
        },
      };

      return this.intercomService.getUserByQuery(query);
    } catch (e) {
      throw new HttpException(
        'Something went wrong. Please try again later',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async addTagToUser(email: string, tagName: string) {
    const tags = await this.intercomService.getTags();
    const tag = tags.find((tag) => tag.name === tagName);

    if (!tag) {
      throw new HttpException(
        'Something went wrong. Please try again later',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const query = {
      query: {
        operator: 'AND',
        value: [{ field: 'email', operator: '=', value: email }],
      },
    };

    const user = await this.intercomService.getUserByQuery(query);

    if (!user) {
      throw new HttpException(
        'Something went wrong. Please try again later',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      await this.intercomService.attachContactToTag(user.id, tag.id);
    } catch (e) {
      throw new HttpException(
        'Something went wrong. Please try again later',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  getUserById(id: string): Promise<any> {
    const query = {
      query: {
        operator: 'AND',
        value: [{ field: 'id', operator: '=', value: id }],
      },
    };

    return this.intercomService.getUserByQuery(query);
  }

  getUserByEmail(email: string): Promise<any> {
    const query = {
      query: {
        operator: 'AND',
        value: [{ field: 'email', operator: '=', value: email }],
      },
    };

    return this.intercomService.getUserByQuery(query);
  }

  async getKashCreditsCount(email: string) {
    const tags = await this.intercomService.getTags();

    const kashCreditsTags = tags.filter((tag) =>
      tag.name.match(/KashCreditsPreLaunch_*/),
    );

    const query = {
      query: {
        operator: 'AND',
        value: [{ field: 'email', operator: '=', value: email }],
      },
    };

    const user = await this.intercomService.getUserByQuery(query);

    if (!user) {
      throw new HttpException(
        'Something went wrong. Please try again later',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const userTagIds =
      user?.tags?.data && user?.tags?.data.length
        ? user?.tags?.data.map(({ id }) => id)
        : [];
    return kashCreditsTags
      .filter((item) => userTagIds.includes(item.id))
      .map(({ name }) => {
        const values = name.split('_');
        return Number(values[1]);
      })
      .reduce((accumulator, a) => {
        return accumulator + a;
      }, 0);
  }

  async investmentRestrictions(email: string): Promise<InvestmentRestrictions> {
    const query = {
      query: {
        operator: 'AND',
        value: [{ field: 'email', operator: '=', value: email }],
      },
    };

    const user = await this.intercomService.getUserByQuery(query);

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const countries = [
      'United States',
      'Canada',
      'Austria',
      'Belgium',
      'Bulgaria',
      'Croatia',
      'Cyprus',
      'Czechia',
      'Denmark',
      'Estonia',
      'Finland',
      'France',
      'Germany',
      'Greece',
      'Hungary',
      'Ireland',
      'Italy',
      'Latvia',
      'Lithuania',
      'Luxembourg',
      'Malta',
      'Netherlands',
      'Poland',
      'Portugal',
      'Romania',
      'Slovakia',
      'Slovenia',
      'Spain',
      'Sweden',
      'Ukraine',
    ];

    const userCountry = user?.location?.country;
    if (!userCountry) {
      if (!user) {
        throw new HttpException('Location not found', HttpStatus.NOT_FOUND);
      }
    }

    return {
      investmentRestrictions: countries.includes(userCountry),
    };
  }

  async is2FAVerificationRequired(email: string) {
    try {
      // const tags = await this.intercomService.getTags();
      // const tag = tags.find(
      //   (tag) => tag.name === INTERCOM_TAG_DISABLE_2FA_VERIFICATION,
      // );
      //
      // if (!tag) {
      //   return null;
      // }

      const query = {
        query: {
          operator: 'AND',
          value: [
            { field: 'email', operator: '=', value: email },
            {
              field: 'tag_id',
              operator: '=',
              value: TAG_ID_DISABLE_2FA_VERIFICATION,
            },
          ],
        },
      };

      const user = await this.intercomService.getUserByQuery(query);
      return !!user;
    } catch (e) {
      throw new HttpException(
        'Something went wrong. Please try again later',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTotalUsersCount(): Promise<{ total: number }> {
    try {
      const count = await this.intercomService.getUsersCount();
      return (count && { total: Number(count) }) || null;
    } catch (e) {
      Logger.error(
        'Failed to get total count of users in intercom',
        JSON.stringify(e),
      );
      return null;
    }
  }
}
