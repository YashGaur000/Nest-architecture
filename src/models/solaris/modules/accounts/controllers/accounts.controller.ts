import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Post } from '@nestjs/common';
import { GetAccountDto } from '../dto/get-account.dto';
import { SolarisInternalAccountsService } from '../services/internal-accounts.service';
import { SolarisAccount } from '../intefaces/accounts.interfaces';

@ApiTags('Solaris -> account')
@Controller('solaris/accounts')
export class SolarisAccountsController {
  constructor(
    private readonly solarisInternalAccountsService: SolarisInternalAccountsService,
  ) {}

  @Post('me')
  @ApiCreatedResponse({
    description: 'Get account details.',
    type: SolarisAccount,
  })
  getAccount(@Body() getAccountDto: GetAccountDto): Promise<SolarisAccount> {
    return this.solarisInternalAccountsService.getAccount(getAccountDto);
  }
}
