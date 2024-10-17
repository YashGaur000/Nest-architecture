import { Injectable } from '@nestjs/common';
import {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_SERVICE_TOKEN,
} from '../../environments';
import { UserIntercomService } from '../user/services/user-intercom.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const twilioClient = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

@Injectable()
export class TwoFactorAuthenticationService {
  constructor(private readonly userIntercomService: UserIntercomService) {}

  send(email: string) {
    return twilioClient.verify
      .services(TWILIO_SERVICE_TOKEN)
      .verifications.create({ to: email, channel: 'email' });
  }

  verify(code: string, email: string) {
    return twilioClient.verify
      .services(TWILIO_SERVICE_TOKEN)
      .verificationChecks.create({ code, to: email })
      .then(({ status }) => status);
  }

  is2FARequired(email: string) {
    return this.userIntercomService.is2FAVerificationRequired(email);
  }
}
