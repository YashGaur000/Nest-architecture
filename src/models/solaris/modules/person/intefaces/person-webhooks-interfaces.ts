import { PersonIdentificationStatus } from '../enums/person.enums';

export interface PersonIdentificationWebhook {
  id: string;
  method: string;
  url: string;
  reference: string;
  completed_at: string;
  status: PersonIdentificationStatus;
  person_id: string;
  authorization_expires_at: string;
  confirmation_expires_at: string;
}
