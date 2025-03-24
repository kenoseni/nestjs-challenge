import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class PaginationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const page = parseInt(request.query.page, 10) || 1;
    const limit = parseInt(request.query.limit, 10) || 10;

    if (page < 1 || limit < 1) {
      throw new BadRequestException('Page and limit must be positive integers');
    }
    const skip = (page - 1) * limit;

    request.pagination = { skip, limit };

    return next.handle().pipe(
      map((response) => {
        const { data } = response;
        console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>.', data);
        if (
          !data ||
          typeof data !== 'object' ||
          !Array.isArray(data.items) ||
          typeof data.total !== 'number'
        ) {
          throw new BadRequestException('Invalid pagination data format');
        }
        const { items, total } = data;
        return {
          ...response,
          data: {
            total,
            currentPage: page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrevious: page > 1,
            path: request.url,
            query: request.query,
            items,
          },
        };
      }),
    );
  }
}
