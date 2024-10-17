import { Body, Controller, Post } from '@nestjs/common';
import { CreatePersonDto } from '../dto/create-person.dto';
import {
  SolarisGenerateIdentificationUrlResponse,
  SolarisPerson,
} from '../intefaces/person-interfaces';
import { SolarisInternalPersonsService } from '../services/internal-persons.service';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { PersonIdentityDto } from '../dto/person-identity.dto';
import { PersonPhoneConfirmDto } from '../dto/person-phone-confirm.dto';

@ApiTags('Solaris -> persons')
@Controller('solaris/persons')
export class SolarisPersonsController {
  constructor(
    private readonly internalPersonsService: SolarisInternalPersonsService,
  ) {}

  @Post()
  @ApiCreatedResponse({
    description: 'The Person has been successfully created.',
  })
  createPerson(@Body() solarisPersonDto: CreatePersonDto): Promise<void> {
    return this.internalPersonsService.createPerson(solarisPersonDto);
  }

  @Post('me')
  @ApiCreatedResponse({
    description: 'Get Person.',
    type: SolarisPerson,
  })
  getPerson(
    @Body() personIdentityDto: PersonIdentityDto,
  ): Promise<SolarisPerson> {
    return this.internalPersonsService.getPerson(personIdentityDto.identity);
  }

  @Post('/identification')
  @ApiCreatedResponse({
    description: 'The Person identification has been successfully created.',
    type: SolarisGenerateIdentificationUrlResponse,
  })
  createIdentification(
    @Body() personIdentityDto: PersonIdentityDto,
  ): Promise<SolarisGenerateIdentificationUrlResponse> {
    return this.internalPersonsService.createIdentification(personIdentityDto);
  }

  @Post('/phone/authorize')
  @ApiCreatedResponse({
    description: 'The phone has been successfully authorized.',
  })
  mobileNumberAuthorize(
    @Body() personIdentityDto: PersonIdentityDto,
  ): Promise<void> {
    return this.internalPersonsService.mobileNumberAuthorize(personIdentityDto);
  }

  @Post('/phone/confirm')
  @ApiCreatedResponse({
    description: 'The phone has been successfully confirmed.',
  })
  mobileNumberConfirm(
    @Body() personPhoneConfirmDto: PersonPhoneConfirmDto,
  ): Promise<void> {
    return this.internalPersonsService.mobileNumberConfirm(
      personPhoneConfirmDto,
    );
  }
}
