import { HttpService } from '@nestjs/axios';
import { map, take, firstValueFrom } from 'rxjs';
import { HttpException, Injectable } from '@nestjs/common';
import { AxiosRequestConfig, AxiosResponse } from 'axios';

export interface getInterface {
  url: string;
  config?: AxiosRequestConfig;
}

@Injectable()
export class HttpClient {
  constructor(private readonly http: HttpService) {}

  async getData(params: getInterface, header_fmt = 'xml'): Promise<any> {
    const headers = {
      'Content-Type': 'application/xml',
      Accept: `application/xml`,
    };
    if (header_fmt !== 'json') {
      return await firstValueFrom(
        this.http.get(params.url, { ...params.config, headers }).pipe(
          take(1),
          map((response: AxiosResponse) => {
            return response.data;
          }),
        ),
      ).catch((error) => this.throwHttpClientError(error));
    }
    return await firstValueFrom(
      this.http.get(params.url, { ...params.config }).pipe(
        take(1),
        map((response: AxiosResponse) => response.data),
      ),
    ).catch((error) => this.throwHttpClientError(error));
  }

  throwHttpClientError(error: any) {
    throw new HttpException(
      HttpException.createBody({
        message: error.response?.statusText ?? error.message,
        statusCode: error.response?.status,
        errorData: error?.response?.data,
      }),
      error.response?.status,
    );
  }
}
