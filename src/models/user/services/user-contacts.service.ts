import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  UserContacts,
  UserContactsDocument,
} from '../schemas/user-contacts.schema';
import { UserCreateContactDto } from '../dto/user-create-contact.dto';
import { UserProfileService } from './user-profile.service';
import { decrypt, encrypt } from '../../../utils/crypto.utils';
import { USER_CONTACTS_MASTER_KEY } from '../../../environments';
import { UserContact } from '../common/user-interfaces';
import { UserUpdateContactDto } from '../dto/user-update-contact.dto';

@Injectable()
export class UserContactsService {
  constructor(
    @InjectModel(UserContacts.name)
    private userContactsModel: Model<UserContactsDocument>,
    private readonly userProfileService: UserProfileService,
  ) {}

  async getContact(identity: string, contactId: string): Promise<UserContact> {
    const user = await this.userProfileService.getUserByIdentity(identity);

    if (!user || user?.isUserBlocked) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    try {
      const userContact = await this.userContactsModel
        .findOne({ _id: contactId, identity })
        .exec();

      return {
        id: userContact._id,
        ...JSON.parse(decrypt(userContact.contact, USER_CONTACTS_MASTER_KEY)),
      };
    } catch (e) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }
  }

  async getContacts(identity: string): Promise<UserContact[]> {
    const user = await this.userProfileService.getUserByIdentity(identity);

    if (!user || user?.isUserBlocked) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    try {
      const userContacts = await this.userContactsModel
        .find({ identity })
        .exec();

      return userContacts.map((userContact) => {
        return {
          id: userContact._id,
          ...JSON.parse(decrypt(userContact.contact, USER_CONTACTS_MASTER_KEY)),
        };
      });
    } catch (e) {
      return [];
    }
  }

  async updateContact(
    identity: string,
    contactId: string,
    payload: UserUpdateContactDto,
  ) {
    const user = await this.userProfileService.getUserByIdentity(identity);

    if (!user || user?.isUserBlocked) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    if (payload?.walletAddress && payload?.walletAddress.length > 20) {
      throw new HttpException(
        'Max number of Wallet addresses are reached',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (payload?.phoneNumbers && payload?.phoneNumbers.length > 10) {
      throw new HttpException(
        'Max number of phone numbers are reached',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.getContact(identity, contactId);

    const contact = {
      name: payload.name,
      email: payload.email,
      iban: payload?.iban,
      walletAddress: payload?.walletAddress,
      phoneNumbers: payload?.phoneNumbers,
    };

    await this.userContactsModel.updateOne(
      { _id: contactId, identity },
      {
        contact: encrypt(JSON.stringify(contact), USER_CONTACTS_MASTER_KEY),
        updated_date: new Date().toISOString(),
      },
    );
  }

  async createContact(payload: UserCreateContactDto) {
    const user = await this.userProfileService.getUserByIdentity(
      payload.identity,
    );

    if (!user || user?.isUserBlocked) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    if (payload?.walletAddress && payload?.walletAddress.length > 20) {
      throw new HttpException(
        'Max number of Wallet addresses are reached',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (payload?.phoneNumbers && payload?.phoneNumbers.length > 10) {
      throw new HttpException(
        'Max number of phone numbers are reached',
        HttpStatus.BAD_REQUEST,
      );
    }

    const contact = {
      name: payload.name,
      email: payload.email,
      iban: payload?.iban,
      walletAddress: payload?.walletAddress,
      phoneNumbers: payload?.phoneNumbers,
    };

    const userContacts = new this.userContactsModel({
      identity: user.identity,
      contact: encrypt(JSON.stringify(contact), USER_CONTACTS_MASTER_KEY),
      updated_date: new Date().toISOString(),
      created_date: new Date().toISOString(),
    } as UserContacts);
    await userContacts.save();
  }

  async deleteContact(identity: string, contactId: string) {
    const user = await this.userProfileService.getUserByIdentity(identity);

    if (!user || user?.isUserBlocked) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    try {
      await this.userContactsModel
        .deleteOne({ _id: contactId, identity })
        .exec();
    } catch (e) {
      throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
    }
  }
}
