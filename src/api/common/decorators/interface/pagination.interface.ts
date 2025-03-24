export interface IPaginator {
  data?: any;
  meta: {
    total?: number;
    totalPages?: number;
    currentPage: number;
    params?: object | any;
    path?: string;
    query?: string | number;
    hasNext?: boolean;
    hasPrevious?: boolean;
  };
}
