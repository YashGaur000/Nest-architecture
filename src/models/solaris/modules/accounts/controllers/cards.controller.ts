import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Post } from '@nestjs/common';
import { CreateCardDto } from '../dto/create-card.dto';
import { SolarisInternalCardsService } from '../services/internal-cards.service';
import { GetCardsDto } from '../dto/get-cards.dto';
import { SolarisCard } from '../intefaces/cards.interfaces';
import { ActivateCardDto } from '../dto/activate-card.dto';
import { BlockCardDto } from '../dto/block-card.dto';
import { LostCardDto } from '../dto/lost-card.dto';

@ApiTags('Solaris -> cards')
@Controller('solaris/cards')
export class SolarisCardsController {
  constructor(
    private readonly solarisInternalCardsService: SolarisInternalCardsService,
  ) {}

  @Post('')
  @ApiCreatedResponse({
    description: 'Create card',
  })
  createCard(@Body() createCardDto: CreateCardDto): Promise<void> {
    return this.solarisInternalCardsService.createCard(createCardDto);
  }

  @Post('/activate')
  @ApiCreatedResponse({
    description: 'Activate card',
  })
  activateCard(@Body() activateCardDto: ActivateCardDto): Promise<void> {
    return this.solarisInternalCardsService.activateCard(activateCardDto);
  }

  @Post('/block')
  @ApiCreatedResponse({
    description: 'Block card',
  })
  blockCard(@Body() blockCardDto: BlockCardDto): Promise<void> {
    return this.solarisInternalCardsService.blockCard(blockCardDto);
  }

  @Post('/unblock')
  @ApiCreatedResponse({
    description: 'Unblock card',
  })
  unblockCard(@Body() blockCardDto: BlockCardDto): Promise<void> {
    return this.solarisInternalCardsService.unblockCard(blockCardDto);
  }

  @Post('/close')
  @ApiCreatedResponse({
    description: 'Close card',
  })
  closeCard(@Body() blockCardDto: BlockCardDto): Promise<void> {
    return this.solarisInternalCardsService.closeCard(blockCardDto);
  }

  @Post('/lost')
  @ApiCreatedResponse({
    description: 'Lost/Stolen card',
  })
  lostCard(@Body() lostCardDto: LostCardDto): Promise<void> {
    return this.solarisInternalCardsService.lostCard(lostCardDto);
  }

  @Post('/list')
  @ApiCreatedResponse({
    description: 'Get all cards',
    type: [SolarisCard],
  })
  getAllCards(@Body() getCardsDto: GetCardsDto): Promise<SolarisCard[]> {
    return this.solarisInternalCardsService.getAllCards(getCardsDto);
  }
}
