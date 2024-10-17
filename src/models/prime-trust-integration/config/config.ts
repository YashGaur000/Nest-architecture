import * as dotenv from 'dotenv';

dotenv.config();

const PRIME_TRUST_JWT_URL = process.env.PRIME_TRUST_JWT_URL;
const PRIME_TRUST_JWT_USERNAME = process.env.PRIME_TRUST_JWT_USERNAME;
const PRIME_TRUST_JWT_PASSWORD = process.env.PRIME_TRUST_JWT_PASSWORD;

export {
  PRIME_TRUST_JWT_USERNAME,
  PRIME_TRUST_JWT_PASSWORD,
  PRIME_TRUST_JWT_URL,
};
