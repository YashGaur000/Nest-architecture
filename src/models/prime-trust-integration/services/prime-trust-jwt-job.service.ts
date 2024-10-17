import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrimeTrustJwtService } from './prime-trust-jwt.service';

@Injectable()
export class PrimeTrustJwtJobService {
  constructor(private readonly primeTrustJwtService: PrimeTrustJwtService) {}

  @Cron('0 0 */5 * *') // Midnight every 5 days
  async handleCron() {
    try {
      await this.primeTrustJwtService.updateJwtToken();
      Logger.log('PrimeTrustJwt -> token updated i CRON JOB');
    } catch (error) {
      Logger.error('Failed to update JWT', error);
    }
  }
}
