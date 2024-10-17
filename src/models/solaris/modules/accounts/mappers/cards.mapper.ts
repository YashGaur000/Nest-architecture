import { GetCardResponse, SolarisCard } from '../intefaces/cards.interfaces';

export const mapToSolarisCard = (
  getCardResponse: GetCardResponse,
): SolarisCard => {
  if (getCardResponse)
    return {
      id: getCardResponse.id,
      type: getCardResponse.type,
      expiration_date: getCardResponse.expiration_date,
      status: getCardResponse.status,
      representation: {
        line_1: getCardResponse?.representation?.line_1,
        masked_pan: getCardResponse?.representation?.masked_pan,
        formatted_expiration_date:
          getCardResponse?.representation?.formatted_expiration_date,
      },
    };
};
