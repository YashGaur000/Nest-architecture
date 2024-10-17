import { Injectable } from '@nestjs/common';
// Imports the Cloud KMS library
import { KeyManagementServiceClient } from '@google-cloud/kms';
import crc32c from 'fast-crc32c';
import crypto from 'crypto';
import {
  G_CLOUD_SOLARIS_RING_ID,
  G_CLOUD_KMS_KEY_VERSION,
  G_CLOUD_KMS_LOCATION_ID,
  G_CLOUD_KMS_PROJECT_ID,
  G_CLOUD_SOLARIS_CREDENTIALS,
} from '../../../config/app.config';

// Instantiates a client
const client = new KeyManagementServiceClient({
  keyFile: G_CLOUD_SOLARIS_CREDENTIALS,
});

@Injectable()
export class SolarisGCloudKmsService {
  async createKeyAsymmetricSign(keyID: string): Promise<unknown> {
    const keyRingName = client.keyRingPath(
      G_CLOUD_KMS_PROJECT_ID,
      G_CLOUD_KMS_LOCATION_ID,
      G_CLOUD_SOLARIS_RING_ID,
    );

    const [key] = await client.createCryptoKey({
      parent: keyRingName,
      cryptoKeyId: keyID,
      cryptoKey: {
        purpose: 'ASYMMETRIC_SIGN',
        versionTemplate: {
          algorithm: 'EC_SIGN_P256_SHA256',
        },
      },
    });

    return key;
  }

  async signAsymmetric(keyId: string, rawMessage: string): Promise<string> {
    const versionName = client.cryptoKeyVersionPath(
      G_CLOUD_KMS_PROJECT_ID,
      G_CLOUD_KMS_LOCATION_ID,
      G_CLOUD_SOLARIS_RING_ID,
      keyId,
      G_CLOUD_KMS_KEY_VERSION,
    );
    const message = Buffer.from(rawMessage);
    // Create a digest of the message. The digest needs to match the digest
    // configured for the Cloud KMS key.
    const hash = crypto.createHash('sha256');
    hash.update(message);
    const digest = hash.digest();

    // Optional but recommended: Compute digest's CRC32C.
    const digestCrc32c = crc32c.calculate(digest);

    // Sign the message with Cloud KMS
    const [signResponse] = await client.asymmetricSign({
      name: versionName,
      digest: {
        sha256: digest,
      },
      digestCrc32c: {
        value: digestCrc32c,
      },
    });

    if (signResponse.name !== versionName) {
      throw new Error('AsymmetricSign: request corrupted in-transit');
    }
    if (!signResponse.verifiedDigestCrc32c) {
      throw new Error('AsymmetricSign: request corrupted in-transit');
    }
    if (
      crc32c.calculate(signResponse.signature) !==
      Number(signResponse.signatureCrc32c.value)
    ) {
      throw new Error('AsymmetricSign: response corrupted in-transit');
    }

    // Example of how to display signature. Because the signature is in a binary
    // format, you need to encode the output before printing it to a console or
    // displaying it on a screen.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const encoded = signResponse.signature.toString('base64');
    console.log(`Signature: ${encoded}`);

    return encoded;
  }

  async getPublicKey(keyId: string): Promise<string> {
    const versionName = client.cryptoKeyVersionPath(
      G_CLOUD_KMS_PROJECT_ID,
      G_CLOUD_KMS_LOCATION_ID,
      G_CLOUD_SOLARIS_RING_ID,
      keyId,
      G_CLOUD_KMS_KEY_VERSION,
    );

    const [publicKey] = await client.getPublicKey({
      name: versionName,
    });

    if (publicKey.name !== versionName) {
      throw new Error('GetPublicKey: request corrupted in-transit');
    }
    if (crc32c.calculate(publicKey.pem) !== Number(publicKey.pemCrc32c.value)) {
      throw new Error('GetPublicKey: response corrupted in-transit');
    }
    return publicKey?.pem;
  }
}
