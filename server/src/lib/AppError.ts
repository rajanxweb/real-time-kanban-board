export type ErrorDetail = {
  field: string;
  message: string;
};

export class AppError extends Error {
  readonly statusCode: number;
  readonly code?: string;
  readonly details?: ErrorDetail[];

  constructor(
    message: string,
    statusCode: number,
    code?: string,
    details?: ErrorDetail[],
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
