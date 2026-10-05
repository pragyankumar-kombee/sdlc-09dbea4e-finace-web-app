// @module: SharedCommon.frontend/src/common/apiClient.ts
// @spec_section_id: implementation_blueprint
// @req_ids: N/A
// @agent: CodeGenerationAgent
// @run_id: run-p4-1790144399
// @version: 1

/**
 * Enterprise API Client for FinPulse Engine frontend (React SPA).
 * Handles HTTP requests, JWT token attachment, automatic token refresh via HTTP-only cookies,
 * centralized error handling, and request/response interceptors.
 */

export interface ApiClientConfig {
  baseUrl: string;
  timeoutMs?: number;
}

export interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiError extends Error {
  public status: number;
  public code: string;
  public details?: unknown;

  constructor(status: number, message: string, code: string = 'UNKNOWN_ERROR', details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ApiClient {
  private baseUrl: string;
  private timeoutMs: number;
  private isRefreshing: boolean = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor(config?: ApiClientConfig) {
    // In production, fallback to environment variable or standard API root
    this.baseUrl = config?.baseUrl || (typeof process !== 'undefined' && process.env?.REACT_APP_API_BASE_URL) || '/api/v1';
    this.timeoutMs = config?.timeoutMs || 30000;
  }

  private getAccessToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem('finpulse_access_token');
  }

  private setAccessToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('finpulse_access_token', token);
    }
  }

  private clearAccessToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('finpulse_access_token');
    }
  }

  private subscribeTokenRefresh(cb: (token: string) => void): void {
    this.refreshSubscribers.push(cb);
  }

  private onRefreshed(token: string): void {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  private async refreshToken(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Sends HTTP-only refresh cookie
    });

    if (!response.ok) {
      this.clearAccessToken();
      throw new ApiError(response.status, 'Session expired. Please log in again.', 'SESSION_EXPIRED');
    }

    const data = await response.json();
    const newToken = data.access_token;
    this.setAccessToken(newToken);
    return newToken;
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = new URL(`${this.baseUrl}${cleanEndpoint}`, window.location.origin);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    // If running in browser against a relative or absolute URL correctly, handle origin
    return url.toString().replace(window.location.origin, '');
  }

  public async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { skipAuth = false, params, headers = {}, ...customOptions } = options;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(headers as Record<string, string>),
    };

    if (!skipAuth) {
      const token = this.getAccessToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    const url = this.buildUrl(endpoint, params);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      let response = await fetch(url, {
        ...customOptions,
        headers: requestHeaders,
        credentials: 'include',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401 Unauthorized via Token Refresh Mechanism
      if (response.status === 401 && !skipAuth && !endpoint.includes('/auth/refresh')) {
        if (!this.isRefreshing) {
          this.isRefreshing = true;
          try {
            const newToken = await this.refreshToken();
            this.isRefreshing = false;
            this.onRefreshed(newToken);
          } catch (refreshError) {
            this.isRefreshing = false;
            this.refreshSubscribers = [];
            throw refreshError;
          }
        }

        // Retry original request with newly acquired token
        return new Promise((resolve, reject) => {
          this.subscribeTokenRefresh(async (newToken: string) => {
            requestHeaders['Authorization'] = `Bearer ${newToken}`;
            try {
              const retryResponse = await fetch(url, {
                ...customOptions,
                headers: requestHeaders,
                credentials: 'include',
              });

              if (!retryResponse.ok) {
                const errorBody = await retryResponse.json().catch(() => ({}));
                return reject(
                  new ApiError(
                    retryResponse.status,
                    errorBody.message || 'An error occurred during API request',
                    errorBody.code || 'API_ERROR',
                    errorBody.details
                  )
                );
              }

              const data = retryResponse.status !== 204 ? await retryResponse.json() : null;
              resolve(data as T);
            } catch (err) {
              reject(err);
            }
          });
        });
      }

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new ApiError(
          response.status,
          errorBody.message || `Request failed with status ${response.status}`,
          errorBody.code || 'API_ERROR',
          errorBody.details
        );
      }

      if (response.status === 204) {
        return null as T;
      }

      const data = await response.json();
      return data as T;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new ApiError(408, 'Request timeout exceeded', 'REQUEST_TIMEOUT');
      }
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, error.message || 'Network error occurred', 'NETWORK_ERROR', error);
    }
  }

  public async get<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public async post<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async put<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async patch<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async delete<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Singleton API Client instance configured for FinPulse Engine
export const apiClient = new ApiClient();