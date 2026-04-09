export interface ApiResponse<T> {
  data: T;
  message: string;
  error?: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
