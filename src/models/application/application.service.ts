import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ApplicationSettings,
  ApplicationSettingsDocument,
} from './schemas/application.schema';
import { ApplicationSettingsDto } from './dto/application-settings.dto';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectModel(ApplicationSettings.name)
    private applicationModel: Model<ApplicationSettingsDocument>,
  ) {}

  async setApplicationSettings(
    applicationSettingsDto: ApplicationSettingsDto,
  ): Promise<void> {
    await this.applicationModel.updateOne(
      { app_id: 'kash' },
      applicationSettingsDto,
      {
        upsert: true,
      },
    );
  }

  async getApplicationSettings(): Promise<ApplicationSettings> {
    try {
      const settings = await this.applicationModel
        .findOne({ app_id: 'kash' })
        .exec();
      if (!settings) {
        await this.setApplicationSettings({ maintenance: false });
        return this.applicationModel.findOne({ app_id: 'kash' }).exec();
      }
      return settings;
    } catch (e) {
      Logger.error('Get Application Settings error', e);
    }
  }
}
