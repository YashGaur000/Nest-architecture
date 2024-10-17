import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PTPlaidTransfer {
  @ApiProperty()
  data: {
    type: string; //funds-transfer-method
    attributes: {
      'contact-id': string;
      'plaid-processor-token': string;
      'funds-transfer-type': string; //ach
      'ach-check-type': string; //personal
      'bank-account-name': string;
      'ip-address': string;
    };
  };
}

export class TransferMethodDto extends PTPlaidTransfer {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  identity: string;
}
