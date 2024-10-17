import { Body, Controller, Post } from '@nestjs/common';
import { PrivateMemoDto } from './dto/private-memo.dto';
import { PrivateMemoService } from './private-memo.service';
import { PrivetMemo } from './schemas/private-memo.schema';
import { PrivateMemoGetDto } from './dto/private-memo-get.dto';
import { PrivateMemoUpdateDto } from './dto/private-memo-update.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('private-memo')
@Controller('private-memo')
export class PrivateMemoController {
  constructor(private readonly privetMemoService: PrivateMemoService) {}

  @Post('create')
  create(@Body() privetMemoDto: PrivateMemoDto): Promise<void> {
    return this.privetMemoService.createPrivetMemo(privetMemoDto);
  }

  @Post('update')
  update(@Body() privetMemoUpdateDto: PrivateMemoUpdateDto): Promise<void> {
    return this.privetMemoService.updatePrivetMemo(privetMemoUpdateDto);
  }

  @Post('get')
  get(@Body() privetMemoGetDto: PrivateMemoGetDto): Promise<PrivetMemo> {
    return this.privetMemoService.findPrivetMemo(privetMemoGetDto);
  }
}
