import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, UpdateQuery } from 'mongoose';
import {
  SolarisInternalPerson,
  SolarisPersonDocument,
} from '../schemas/person.schema';
import { UpdateSolarisPerson } from '../intefaces/person-interfaces';
import { mapPersonFromDb } from '../mappers/person.mapper';

@Injectable()
export class SolarisPersonRepository {
  constructor(
    @InjectModel(SolarisInternalPerson.name)
    private readonly solarisPersonModel: Model<SolarisPersonDocument>,
  ) {}

  createPerson(payload: SolarisInternalPerson) {
    const solarisPerson = new this.solarisPersonModel({
      identity: String(payload.identity),
      person_id: payload.person_id,
      tax_identification: payload.tax_identification,
      pre_order_card_type: payload.pre_order_card_type,
      account_approved: payload.account_approved,
      device: null,
      identifications: null,
      updated_date: new Date().toISOString(),
      created_date: new Date().toISOString(),
    } as SolarisInternalPerson);
    return solarisPerson.save();
  }

  updatePerson(identity: string, payload: UpdateQuery<UpdateSolarisPerson>) {
    return this.solarisPersonModel.updateOne(
      { identity: String(identity) },
      {
        ...payload,
        updated_date: new Date().toISOString(),
      },
      { multi: true },
    );
  }

  updatePersonByPersonId(
    personId: string,
    payload: UpdateQuery<UpdateSolarisPerson>,
  ) {
    return this.solarisPersonModel.updateOne(
      { person_id: String(personId) },
      {
        ...payload,
        updated_date: new Date().toISOString(),
      },
      { multi: true },
    );
  }

  getPerson(identity: string): Promise<SolarisInternalPerson> {
    return this.solarisPersonModel
      .findOne({ identity: String(identity) })
      .exec()
      .then((user) => mapPersonFromDb(user));
  }

  getPersonByPersonId(personId: string): Promise<SolarisInternalPerson> {
    return this.solarisPersonModel
      .findOne({ person_id: String(personId) })
      .exec()
      .then((user) => mapPersonFromDb(user));
  }
}
