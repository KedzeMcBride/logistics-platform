export type ApiSuccess<T> = {
  success: true;
  data: T;
  error: null;
  meta?: Record<string, unknown>;
};

export type ApiError = {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
