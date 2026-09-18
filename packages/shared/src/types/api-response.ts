export type ApiSuccess<T> = {
  success: true;
  data: T;
  error: null;
  meta?: Record<string, unknown>;
};

export type ApiErrorPayload = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiError = {
  success: false;
  data: null;
  error: ApiErrorPayload;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
