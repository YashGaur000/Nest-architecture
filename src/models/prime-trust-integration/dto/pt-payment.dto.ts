import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PTCreatePaymentDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  identity: string;

  @ApiProperty()
  metadata: string;
}

export class PTCreateContribution {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  identity: string;

  @ApiProperty()
  amount: string;

  @ApiProperty()
  'funds-transfer-method-id': string;
}

export class PTCreateQuote {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  identity: string;

  @ApiProperty()
  amount: string;

  @ApiProperty()
  asset: string;

  @ApiProperty()
  walletAddress: string;
}

export class PTExecuteQuote {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  identity: string;

  @ApiProperty()
  'quote-id': string;
}

export class PTOffRampQuote {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  account_id: string;

  @ApiProperty()
  amount: string;

  @ApiProperty()
  asset: string;
}