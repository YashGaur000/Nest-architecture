import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserIdentityDto } from './pt-user.dto';

export class PTTransferMethod {
  @ApiProperty()
  'contact-id': string;

  @ApiProperty()
  'plaid-processor-token': string; //Plaid Processor Token after connecting the bank

  @ApiProperty()
  'ip-address': string;

  @ApiProperty()
  'bank-account-name': string; //User's account name . Ex. Sandeep

  @ApiProperty()
  'ach-check-type': string; //personal

  @ApiProperty()
  'funds-transfer-type': string; //ach
}

export class PTCreateTransferMethod {
  @ApiProperty()
  data: {
    type: string;
    attributes: PTTransferMethod;
  };
}

export class PTTransferDto extends PTCreateTransferMethod {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  identity: string;
}

export class PTCashTransferDto {
  @ApiProperty()
  amount: string;

  @ApiProperty()
  'account-name': string;

  @ApiProperty()
  'account-type': string;

  @ApiProperty()
  'account-number': string;

  @ApiProperty()
  'routing-number': string;
}

export class UsdSendTransactionDto extends UserIdentityDto {
  @ApiProperty()
  data: PTCashTransferDto;
}
