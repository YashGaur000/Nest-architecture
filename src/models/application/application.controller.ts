import { Controller, Get, HttpCode } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { ApplicationSettings } from './schemas/application.schema';

@Controller('application')
export class ApplicationController {
  constructor(private applicationService: ApplicationService) {}

  // @Post('settings')
  // @HttpCode(200)
  // async setApplicationSettings(
  //   @Body() applicationSettingsDto: ApplicationSettingsDto,
  // ): Promise<void> {
  //   return this.applicationService.setApplicationSettings(
  //     applicationSettingsDto,
  //   );
  // }

  // @Get('settings')
  // @HttpCode(200)
  // async getApplicationSettings(): Promise<ApplicationSettings> {
  //   return this.applicationService.getApplicationSettings();
  // }
}
