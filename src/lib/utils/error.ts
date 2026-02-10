export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors?: any[]
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export const handleApiError = (error: any) => {
  if (error instanceof ApiError) {
    return {
      error: error.message,
      statusCode: error.statusCode,
      errors: error.errors,
    }
  }

  return {
    error: error.message || "Internal server error",
    statusCode: 500,
  }
}
