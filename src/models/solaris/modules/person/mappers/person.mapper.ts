import { CreatePersonDto } from '../dto/create-person.dto';
import {
  SolarisCreateIdentificationInput,
  SolarisCreatePersonInput,
  SolarisCreatePersonTaxIdentificationInput,
  SolarisExternalPerson,
  SolarisInternalPersonIdentification,
  SolarisPerson,
  SolarisUpdatePersonInput,
} from '../intefaces/person-interfaces';
import { SolarisInternalPerson } from '../schemas/person.schema';
import { SolarisPersonIdentification } from '../schemas/person-identification.schema';
import {
  PersonIdentificationFinal,
  PersonIdentificationRequestAction,
  PersonIdentificationStatus,
  PersonTaxReasonNoTin,
} from '../enums/person.enums';
import moment from 'moment';

export const mapCreatePersonPayload = (
  createPersonDto: CreatePersonDto,
): SolarisCreatePersonInput => ({
  salutation: createPersonDto.salutation,
  first_name: createPersonDto.first_name,
  last_name: createPersonDto.last_name,
  birth_date: moment(createPersonDto.birth_date).format('YYYY-MM-DD'),
  birth_city: createPersonDto.birth_city,
  birth_country: createPersonDto.birth_country,
  email: createPersonDto.email,
  nationality: createPersonDto.nationality,
  address: createPersonDto.address,
  mobile_number: createPersonDto.mobile_number,
  employment_status: createPersonDto.employment_status,
  tax_information: {
    marital_status: createPersonDto.marital_status,
  },
  fatca_relevant: createPersonDto.fatca_relevant,
  fatca_crs_confirmed_at:
    createPersonDto.fatca_crs_confirmed_at && new Date().toISOString(),
  terms_conditions_signed_at:
    createPersonDto.terms_conditions_signed_at && new Date().toISOString(),
  own_economic_interest_signed_at:
    createPersonDto.own_economic_interest_signed_at && new Date().toISOString(),
});

export const mapUpdatePersonPayload = (
  externalPerson: SolarisExternalPerson,
): SolarisUpdatePersonInput => ({
  salutation: externalPerson.salutation,
  first_name: externalPerson.first_name,
  last_name: externalPerson.last_name,
  birth_date: externalPerson.birth_date,
  birth_city: externalPerson.birth_city,
  birth_country: externalPerson.birth_country,
  email: externalPerson.email,
  nationality: externalPerson.nationality,
  address: externalPerson.address,
  mobile_number: externalPerson.mobile_number,
  employment_status: externalPerson.employment_status,
  tax_information: {
    marital_status: externalPerson?.tax_information?.marital_status,
  },
});

export const mapCreateTaxIdentificationPayload = (
  createPersonDto: CreatePersonDto,
): SolarisCreatePersonTaxIdentificationInput => {
  const reason_no_tin =
    createPersonDto.reason_no_tin !== PersonTaxReasonNoTin.HAVE_TAX_ID
      ? createPersonDto.reason_no_tin
      : null;
  return {
    number: createPersonDto?.tax_identification,
    reason_no_tin,
    reason_description: createPersonDto?.reason_description,
    country: createPersonDto.birth_country,
    primary: true,
  };
};

export const mapCreateIdentificationPayload =
  (): SolarisCreateIdentificationInput => ({
    method: 'idnow',
    language: 'EN',
  });

export const mapPersonFromDb = (
  person: SolarisInternalPerson,
): SolarisInternalPerson =>
  (person && {
    identity: person.identity,
    person_id: person.person_id,
    account_id: person?.account_id,
    tax_identification: person?.tax_identification,
    identifications: person?.identifications,
    device: person?.device,
    account_approved: person?.account_approved,
    pre_order_card_type: person?.pre_order_card_type,
  }) ||
  null;

export const mapSolarisPersonIdentification = (
  solarisPersonIdentification: SolarisPersonIdentification,
): SolarisInternalPersonIdentification => {
  if (!solarisPersonIdentification) {
    return null;
  }

  switch (solarisPersonIdentification.status) {
    case PersonIdentificationStatus.created:
      return {
        status: solarisPersonIdentification.status,
        final: PersonIdentificationFinal.NO,
        required_action: PersonIdentificationRequestAction.REQUEST_URL,
        description: 'The identification process was initiated.',
      };
    case PersonIdentificationStatus.pending:
      return {
        status: solarisPersonIdentification.status,
        final: PersonIdentificationFinal.NO,
        required_action: PersonIdentificationRequestAction.NONE,
        description:
          'A video identification URL was generated. The customer has yet to go through his/her video-identification.',
      };

    case PersonIdentificationStatus.pending_successful:
      return {
        status: solarisPersonIdentification.status,
        final: PersonIdentificationFinal.NO,
        required_action: PersonIdentificationRequestAction.NONE,
        description:
          'solarisBank is reviewing the customer. Creating a bank account at this time is not permitted. The identification may still be marked as successful but it is unlikely.',
      };

    case PersonIdentificationStatus.successful:
      return {
        status: solarisPersonIdentification.status,
        final: PersonIdentificationFinal.YES,
        required_action: PersonIdentificationRequestAction.NONE,
        description:
          'The customer was successfully video-identified (data may have changed).',
      };
    case PersonIdentificationStatus.aborted:
      return {
        status: solarisPersonIdentification.status,
        final: PersonIdentificationFinal.NO,
        required_action: PersonIdentificationRequestAction.RETRY_BY_CUSTOMER,
        description:
          'The customer aborted but can still video-identify using the same URL.',
      };

    case PersonIdentificationStatus.canceled:
      return {
        status: solarisPersonIdentification.status,
        final: PersonIdentificationFinal.NO,
        required_action: PersonIdentificationRequestAction.RETRY_BY_CUSTOMER,
        description:
          'The provider canceled the video-identification and the bank account was automatically blocked. The customer should video-identify again using the same URL.',
      };

    case PersonIdentificationStatus.failed:
      return {
        status: solarisPersonIdentification.status,
        final: PersonIdentificationFinal.NO,
        required_action: PersonIdentificationRequestAction.NEW_IDENTIFICATION,
        description: 'The video-identification was unsuccessful.',
      };
  }
};

export const mapSolarisPerson = (
  internalPerson: SolarisInternalPerson,
  externPerson: SolarisExternalPerson,
): SolarisPerson => ({
  id: externPerson.id,
  email: externPerson.email,
  mobile_number: externPerson.mobile_number,
  identification: mapSolarisPersonIdentification(
    internalPerson?.identifications,
  ),
  pre_order_card_type: internalPerson.pre_order_card_type,
  account_approved: internalPerson.account_approved,
  device: {
    unrestricted_key_verified:
      internalPerson?.device?.unrestricted_key_verified,
    restricted_key_verified: internalPerson?.device?.restricted_key_verified,
  },
});
