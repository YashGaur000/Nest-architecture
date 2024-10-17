export interface MfaDevicesInput {
  person_id: string;
  key_type: string;
  name: string;
  key: string;
  key_purpose: 'restricted' | 'unrestricted';
}

export interface MfaDevicesResponse {
  id: string;
  key_id: string;
  challenge: {
    id: string;
    created_at: string;
    type: string;
    expires_at: string;
  };
}

export interface MfaDeviceAddKeyInput {
  key: string;
  key_type: string;
  key_purpose: 'restricted' | 'unrestricted';
  device_signature: {
    signature_key_purpose: 'restricted' | 'unrestricted';
    signature: string;
  };
}

export interface MfaDeviceAddKeyResponse {
  id: string;
}

export interface BindDeviceResponse {
  challenge_id: string;
}
