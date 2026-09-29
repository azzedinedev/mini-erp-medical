import { Injectable, PipeTransform } from '@nestjs/common';

export interface PaginationQuery {
  page: number;
  pageSize: number;
  search?: string;
  sort?: string;
  direction: 'asc' | 'desc';
}

@Injectable()
export class PaginationPipe implements PipeTransform<Record<string, unknown>, PaginationQuery> {
  transform(value: Record<string, unknown>): PaginationQuery {
    const page = Math.max(Number(value.page ?? 1) || 1, 1);
    const pageSize = Math.min(Math.max(Number(value.pageSize ?? 20) || 20, 1), 100);
    const direction = value.direction === 'desc' ? 'desc' : 'asc';
    return {
      page,
      pageSize,
      direction,
      search: typeof value.search === 'string' ? value.search.trim() : undefined,
      sort: typeof value.sort === 'string' ? value.sort : undefined,
    };
  }
}
