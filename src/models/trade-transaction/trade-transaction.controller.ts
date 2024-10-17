import { Body, Controller, Get, Post } from '@nestjs/common';
import { TradeTransactionService } from './trade-transaction.service';
import { CreateTxLogDto } from './dto/create-tx-log.dto';

@Controller('trade-transaction')
export class TradeTransactionController {
  constructor(private readonly txService: TradeTransactionService) {}

  @Post('log')
  async create(@Body() createTxLogDto: CreateTxLogDto) {
    await this.txService.createTxLog(createTxLogDto);
  }
}
