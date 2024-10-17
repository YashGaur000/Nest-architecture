import { Body, Controller, Post } from '@nestjs/common';
import { KreditsInfoDto } from './dto/kredits-info.dto';
import { KreditsInfoLogDto } from './dto/kredits-info-log.dto';
import { KreditsInfoService } from './kredits-info.service';
import { KreditsInfoGetDto } from './dto/kredits-info-get.dto';
import { KreditsInfoUpdateDto } from './dto/kredits-update.dto';
import { KreditsInfoUpgradeDto } from './dto/kredits-upgrade.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('kredits-info')
@Controller('kredits-info')
export class KreditsInfoController {
  constructor(private readonly kreditsInfoService: KreditsInfoService) {}

  @Post('create')
  create(@Body() kreditsInfoDto: KreditsInfoDto): Promise<void> {
    return this.kreditsInfoService.createKreditsInfo(kreditsInfoDto);
  }

  @Post('deposit')
  deposit(@Body() kreditsInfoUpdateDto: KreditsInfoUpdateDto): Promise<void> {
    return this.kreditsInfoService.depositKreditsInfo(kreditsInfoUpdateDto);
  }

  @Post('withdraw')
  withdraw(@Body() kreditsInfoUpdateDto: KreditsInfoUpdateDto): Promise<void> {
    return this.kreditsInfoService.withdrawKreditsInfo(kreditsInfoUpdateDto);
  }

  @Post('get')
  get(@Body() kreditsInfoDto: KreditsInfoGetDto): Promise<KreditsInfoDto> {
    return this.kreditsInfoService.findKreditsInfo(kreditsInfoDto.identity);
  }

  @Post('get-log')
  get_log(
    @Body() kreditsInfoDto: KreditsInfoGetDto,
  ): Promise<KreditsInfoLogDto[]> {
    return this.kreditsInfoService.findKreditsInfoLog(kreditsInfoDto.identity);
  }

  @Post('upgrade-tier')
  upgrade(@Body() kreditsInfoUpgradeDto: KreditsInfoUpgradeDto): Promise<void> {
    return this.kreditsInfoService.upgradeTierKreditsInfo(
      kreditsInfoUpgradeDto,
    );
  }
}
