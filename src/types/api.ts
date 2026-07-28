export interface ApiResponse<T = Record<string, unknown>> {
  data?: T
  error?: string
  message?: string
}

export interface ApiError {
  message: string
  status: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page?: number
  limit?: number
}
