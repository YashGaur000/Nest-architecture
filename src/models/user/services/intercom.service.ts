import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { map } from 'rxjs/operators';
import { INTERCOM_ACCESS_TOKEN, INTERCOM_API } from '../../../environments';
import { UserUpdateDto } from '../dto/user-update.dto';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class IntercomService {
  constructor(private readonly httpService: HttpService) {}

  getUsersCount() {
    const observable = this.httpService
      .get(`${INTERCOM_API}/contacts`, {
        headers: {
          Authorization: `Bearer ${INTERCOM_ACCESS_TOKEN}`,
        },
      })
      .pipe(
        map((response) => response.data),
        map((result) => result?.total_count),
      );
    return lastValueFrom(observable);
  }

  getUserByQuery(query) {
    return this.httpService
      .post(`${INTERCOM_API}/contacts/search`, query, {
        headers: {
          Authorization: `Bearer ${INTERCOM_ACCESS_TOKEN}`,
        },
      })
      .pipe(
        map((response) => response.data),
        map((result) => result.data && result.data[0]),
      )
      .toPromise();
  }

  getTags() {
    return this.httpService
      .get(`${INTERCOM_API}/tags`, {
        headers: {
          Authorization: `Bearer ${INTERCOM_ACCESS_TOKEN}`,
        },
      })
      .pipe(
        map((response) => response.data),
        map((result) => result.data),
      )
      .toPromise();
  }

  updateContacts(userId: string, payload: UserUpdateDto) {
    return this.httpService
      .put(
        `${INTERCOM_API}/contacts/${userId}`,
        {
          phone: payload.phone,
          name: payload.name,
          email: payload.email,
          // custom_attributes: {
          //
          // }
        },
        {
          headers: {
            Authorization: `Bearer ${INTERCOM_ACCESS_TOKEN}`,
          },
        },
      )
      .pipe(map((response) => response.data))
      .toPromise();
  }

  attachContactToTag(userId: string, tagId: string) {
    return this.httpService
      .post(
        `${INTERCOM_API}/contacts/${userId}/tags`,
        {
          id: tagId,
        },
        {
          headers: {
            Authorization: `Bearer ${INTERCOM_ACCESS_TOKEN}`,
          },
        },
      )
      .pipe(map((response) => response.data))
      .toPromise();
  }
}
