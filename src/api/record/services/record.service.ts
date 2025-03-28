import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Record } from '../schemas/record.schema';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { MbidService } from 'src/api/integrations/mbid/mbid.service';
import { parseStringPromise } from 'xml2js';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';
import { FindAllQueryDto } from '../dtos/filter-record.dto';
import { isValidId } from 'src/api/common/helpers/is-valid-id';

@Injectable()
export class RecordService {
  constructor(
    @InjectModel('Record') private recordModel: Model<Record>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly mbidService: MbidService,
  ) {}

  /**
   * Creates a new record based on the provided DTO, optionally overriding properties with third-party API data.
   * @param createRecordDto - The DTO containing record creation data.
   * @throws ConflictException when a record with same album, format and category already exist
   * @returns The created Record document.
   */
  async createRecord(createRecordDto: CreateRecordRequestDTO) {
    let recordData = { ...createRecordDto };
    let apiDetails = {};

    if (createRecordDto.mbid) {
      try {
        apiDetails = await this.fetchRecordDetails(createRecordDto.mbid);
        recordData = { ...recordData, ...apiDetails };
      } catch (error) {
        console.error('Failed to fetch record details:', error);
      }
    }
    const record = new this.recordModel(recordData);

    try {
      const newRecord = await record.save();

      await this.cacheManager.clear();

      if (createRecordDto.mbid && Object.keys(apiDetails).length > 0) {
        await this.cacheManager.set(createRecordDto.mbid, apiDetails, 600);
      }

      return newRecord;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Record already exists');
      }
      throw error;
    }
  }

  /**
   * Updates an existing record based on the provided DTO, optionally overriding properties with third-party API data.
   * @param id - The ID of the record to update.
   * @param updateRecordDto - The DTO containing update data.
   * @throws NotFoundException if the record is not found.
   * @returns The updated Record document.
   */
  async updateRecord(
    id: string,
    updateRecordDto: UpdateRecordRequestDTO,
  ): Promise<Record> {
    isValidId(id);
    const record = await this.recordModel.findById(id);
    if (!record) {
      throw new NotFoundException('Record not found');
    }

    let updateData = { ...updateRecordDto };
    let apiDetails = {};

    if (updateRecordDto.mbid && updateRecordDto.mbid !== record.mbid) {
      try {
        apiDetails = await this.fetchRecordDetails(updateRecordDto.mbid);

        updateData = { ...updateData, ...apiDetails };
      } catch (error) {
        console.error('Failed to fetch record details:', error);
      }
    } else if (updateRecordDto.mbid && updateRecordDto.mbid === record.mbid) {
      apiDetails = await this.cacheManager.get(updateRecordDto.mbid);

      updateData = { ...updateData, ...apiDetails };
    }

    Object.assign(record, updateData);
    const updatedRecord = await record.save();

    await this.cacheManager.clear();

    return updatedRecord;
  }

  async findAllRecords(
    query: any,
    pagination: { skip: number; limit: number },
  ): Promise<{ items: Record[]; total: number }> {
    const cacheKey = this.generateCacheKey(query, pagination);

    const cachedResult = await this.cacheManager.get<{
      items: Record[];
      total: number;
    }>(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }
    const filter = this.buildQueryFilter(query);

    const { skip, limit } = pagination;

    const [records, total] = await Promise.all([
      this.recordModel.find(filter).skip(skip).limit(limit).exec(),
      this.recordModel.countDocuments(filter).exec(),
    ]);

    const result = { items: records, total };

    try {
      await this.cacheManager.set(cacheKey, result);

      console.log('I have stored in redis');
    } catch (error) {
      console.error('Failed to cache records data:', error);
    }

    return result;
  }

  private async fetchRecordDetails(mbid: string) {
    const cacheKey = `record_detail_${mbid}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    try {
      const trackResponse = await this.mbidService.getTrackList(mbid);

      if (trackResponse) {
        const result = await parseStringPromise(trackResponse);

        const release = result.metadata.release[0];

        const medium = release['medium-list'][0].medium[0];

        const tracks = medium['track-list'][0].track;

        const trackList = tracks.map((track: any) => ({
          position: parseInt(track.position[0], 10),
          title: track.recording[0].title[0],
          duration: parseInt(track.length[0], 10),
        }));

        const releaseYear = release.date
          ? parseInt(release.date[0], 10)
          : undefined;
        const country = release.country ? release.country[0] : undefined;

        const album = release.title ? release.title[0] : undefined;

        const recordDetails = {
          album,
          trackList,
          releaseYear,
          country,
          //   format,
          mbid,
        };
        return recordDetails;
      }

      return {};
    } catch (error) {
      // console.error('Failed to fetch record details:', error);
      return {};
      //throw new BadRequestException('Invalid MBID or MusicBrainz API error');
    }
  }

  private buildQueryFilter(query: any): any {
    const filter: any = {};

    if (query.q) {
      filter.$or = [
        { artist: { $regex: new RegExp(query.q, 'i') } },
        { album: { $regex: new RegExp(query.q, 'i') } },
        { category: { $regex: new RegExp(query.q, 'i') } },
      ];
    }

    if (query.artist) {
      filter.artist = { $regex: new RegExp(query.artist, 'i') };
    }
    if (query.album) {
      filter.album = { $regex: new RegExp(query.album, 'i') };
    }
    if (query.format) {
      filter.format = query.format;
    }
    if (query.category) {
      filter.category = query.category;
    }

    return filter;
  }

  private generateCacheKey(
    query: FindAllQueryDto,
    pagination: { skip: number; limit: number },
  ): string {
    const queryString = JSON.stringify(query);
    const paginationString = JSON.stringify(pagination);
    return `records_${queryString}_${paginationString}`;
  }
}
