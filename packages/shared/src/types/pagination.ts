export type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginationQuery = {
  page?: number;
  limit?: number;
};