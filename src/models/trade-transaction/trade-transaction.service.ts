import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  TradeTransactionLog,
  TxLogDocument,
} from './schemas/trade-transaction-log.schema';
import { Model } from 'mongoose';
import { CreateTxLogDto } from './dto/create-tx-log.dto';
import { decrypt, encrypt } from '../../utils/crypto.utils';
import { TxLog } from './models/trade-transaction-log';
import { TX_LOGS_MASTER_KEY } from '../../environments';

@Injectable()
export class TradeTransactionService {
  constructor(
    @InjectModel(TradeTransactionLog.name)
    private txLogModel: Model<TxLogDocument>,
  ) {}

  async createTxLog(
    createTxLogDto: CreateTxLogDto,
  ): Promise<TradeTransactionLog> {
    try {
      const createdTxLog = new this.txLogModel({
        identity: createTxLogDto.identity,
        tx_data: encrypt(JSON.stringify(createTxLogDto), TX_LOGS_MASTER_KEY),
        created_date: new Date().toISOString(),
      } as TradeTransactionLog);
      return createdTxLog.save();
    } catch (e) {
      Logger.error('Create trade-transaction log', e);
    }
  }

  async findAllTxLog(): Promise<TxLog[]> {
    return this.txLogModel
      .find()
      .exec()
      .then((data) => {
        return data.map((item) => {
          return {
            identity: item.identity,
            created_date: item.created_date,
            ...JSON.parse(decrypt(item.tx_data, TX_LOGS_MASTER_KEY)),
          };
        });
      });
  }
}
