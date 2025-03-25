import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Put,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { Record } from '../schemas/record.schema';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { RecordCategory, RecordFormat } from '../schemas/record.enum';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';
import { RecordService } from '../services/record.service';
import { TransformInterceptor } from 'src/api/common/interceptors/transform.interceptor';
import { ResponseCode } from 'src/api/common/constant';
import { PaginationInterceptor } from 'src/api/common/interceptors/pagination.interceptor';
import { Pagination } from 'src/api/common/decorators/pagination.decorator';
import { FindAllQueryDto } from '../dtos/filter-record.dto';
import { RolesGuard } from 'src/api/user/guards/role.guard';
import { Roles } from 'src/api/common/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';

@Controller('records')
@UseInterceptors(TransformInterceptor)
export class RecordController {
  constructor(private readonly recordService: RecordService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('creator')
  @ApiOperation({ summary: 'Create a new record' })
  @ApiResponse({ status: 201, description: 'Record successfully created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async create(@Body() request: CreateRecordRequestDTO) {
    const record = await this.recordService.createRecord(request);

    return {
      responseCode: ResponseCode.SUCCESSFUL,
      responseText: 'Record successfully created.',
      data: record,
    };
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('creator')
  @ApiOperation({ summary: 'Update an existing record' })
  @ApiResponse({ status: 200, description: 'Record updated successfully' })
  @ApiResponse({ status: 404, description: 'Cannot find record to update' })
  async update(
    @Param('id') id: string,
    @Body() updateRecordDto: UpdateRecordRequestDTO,
  ) {
    const record = await this.recordService.updateRecord(id, updateRecordDto);

    return {
      responseCode: ResponseCode.SUCCESSFUL,
      responseText: 'Record successfully updated.',
      data: record,
    };
  }

  /**
   * Gets all record and filters by specified queries.
   * @returns The a paginated object containing array of order documents.
   */
  @Get()
  @UseInterceptors(PaginationInterceptor)
  @ApiOperation({ summary: 'Get all records with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'List of records',
    type: [Record],
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description:
      'Search query (search across multiple fields like artist, album, category, etc.)',
    type: String,
  })
  @ApiQuery({
    name: 'artist',
    required: false,
    description: 'Filter by artist name',
    type: String,
  })
  @ApiQuery({
    name: 'album',
    required: false,
    description: 'Filter by album name',
    type: String,
  })
  @ApiQuery({
    name: 'format',
    required: false,
    description: 'Filter by record format (Vinyl, CD, etc.)',
    enum: RecordFormat,
    type: String,
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by record category (e.g., Rock, Jazz)',
    enum: RecordCategory,
    type: String,
  })
  async findAll(
    @Query() query: FindAllQueryDto,
    @Pagination() pagination: { skip: number; limit: number },
  ) {
    const records = await this.recordService.findAllRecords(query, pagination);

    return {
      responseCode: ResponseCode.SUCCESSFUL,
      responseText: 'Record successfully fetched.',
      data: records,
    };
  }
}
