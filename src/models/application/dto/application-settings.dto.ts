import { IsNotEmpty } from 'class-validator';

export class ApplicationSettingsDto {
  @IsNotEmpty()
  maintenance: boolean;
}
