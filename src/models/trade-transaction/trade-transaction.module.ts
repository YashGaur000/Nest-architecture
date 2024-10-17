import { Module } from '@nestjs/common';
import { TradeTransactionController } from './trade-transaction.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  TradeTransactionLog,
  TradeTransactionLogSchema,
} from './schemas/trade-transaction-log.schema';
import { TradeTransactionService } from './trade-transaction.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TradeTransactionLog.name, schema: TradeTransactionLogSchema },
    ]),
  ],
  controllers: [TradeTransactionController],
  providers: [TradeTransactionService],
})
export class TradeTransactionModule {}
