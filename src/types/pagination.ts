interface PaginationData {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface FetchResult<T> {
  success: boolean;
  data?: T[];
  pagination?: PaginationData;
  error?: string;
}
