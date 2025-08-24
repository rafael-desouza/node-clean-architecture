export interface PaginatedOutput<T> {
  data: T[];
  total: number;
  currentPage: number;
  perPage: number;
  lastPage: number;
}
