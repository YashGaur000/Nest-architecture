import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PrivetMemo, PrivetMemoDocument } from './schemas/private-memo.schema';
import { PrivateMemoDto } from './dto/private-memo.dto';
import { PrivateMemoGetDto } from './dto/private-memo-get.dto';
import { decrypt, encrypt } from '../../utils/crypto.utils';
import { GENERAL_KEY } from '../../environments';
import { UserProfileService } from '../user/services/user-profile.service';
import { PrivateMemoUpdateDto } from './dto/private-memo-update.dto';

@Injectable()
export class PrivateMemoService {
  constructor(
    @InjectModel(PrivetMemo.name)
    private readonly privetMemoModel: Model<PrivetMemoDocument>,
    private readonly userProfileService: UserProfileService,
  ) {}

  async createPrivetMemo(privetMemoDto: PrivateMemoDto): Promise<void> {
    const user = await this.userProfileService.getUserByIdentity(
      privetMemoDto.identity,
    );

    if (!user || user?.isUserBlocked) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    try {
      await this.privetMemoModel.updateOne(
        {
          tx_hash: privetMemoDto.th_hash,
          identity: privetMemoDto.identity,
        },
        {
          identity: privetMemoDto.identity,
          tx_hash: privetMemoDto.th_hash,
          tx_type: privetMemoDto.tx_type,
          memo: encrypt(privetMemoDto.memo, GENERAL_KEY),
          updated_date: new Date().toISOString(),
          created_date: new Date().toISOString(),
        },
        {
          upsert: true,
        },
      );
    } catch (e) {
      Logger.error('Create privet memo failed', e);
      throw new HttpException(
        'Failed to create privet memo',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async updatePrivetMemo(
    privetMemoUpdateDto: PrivateMemoUpdateDto,
  ): Promise<void> {
    const user = await this.userProfileService.getUserByIdentity(
      privetMemoUpdateDto.identity,
    );

    if (!user) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    try {
      await this.privetMemoModel.updateOne(
        {
          tx_hash: privetMemoUpdateDto.th_hash,
          identity: privetMemoUpdateDto.identity,
        },
        {
          memo: encrypt(privetMemoUpdateDto.memo, GENERAL_KEY),
          updated_date: new Date().toISOString(),
        },
      );
    } catch (e) {
      Logger.error('Update privet memo failed', e);
      throw new HttpException(
        'Failed to update privet memo',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findPrivetMemo(
    privetMemoGetDto: PrivateMemoGetDto,
  ): Promise<PrivetMemo> {
    const user = await this.userProfileService.getUserByIdentity(
      privetMemoGetDto.identity,
    );

    if (!user) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    const privetMemo = await this.privetMemoModel
      .findOne({
        tx_hash: privetMemoGetDto.th_hash,
        identity: privetMemoGetDto.identity,
      })
      .exec()
      .then();

    if (!privetMemo) {
      throw new HttpException('Privet memo not found', HttpStatus.NOT_FOUND);
    }

    return {
      identity: privetMemo.identity,
      memo: decrypt(privetMemo.memo, GENERAL_KEY),
      tx_hash: privetMemo.tx_hash,
      tx_type: privetMemo.tx_hash,
      updated_date: privetMemo.updated_date,
      created_date: privetMemo.created_date,
    };
  }
}
