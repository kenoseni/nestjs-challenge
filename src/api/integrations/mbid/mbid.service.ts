import { Injectable } from '@nestjs/common';
import { HttpClient } from '../http.client';
import { tryCatchAsync } from 'src/api/common/helpers/try-catch';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class MbidService {
  constructor(private httpClient: HttpClient) {}

  async getTrackList(mbid: string, fmt = 'xml') {
    const [response, getTrackListError] = await tryCatchAsync(async () => {
      return this.httpClient.getData({
        url: `${process.env.MBID_BASE_URL}/ws/2/release/${mbid}?inc=recordings&fmt=${fmt}`,
      });
    });

    if (getTrackListError) {
      console.log(
        '==========Error From getTrackListError===========',
        getTrackListError,
      );
      throw getTrackListError;
    }
    return response;
  }
}
