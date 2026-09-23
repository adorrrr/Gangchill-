/**
 * Gangchill Production API Client
 * Seamlessly interfaces with PHP + MySQL Backend
 */

const API_BASE = '/api';
const TOKEN_KEY = 'gangchill_token';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: any;
}

export const apiClient = {
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // ignore
    }
  },

  removeToken(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  },

  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      ...((options.headers as Record<string, string>) || {})
    };

    // Auto attach Authorization header if token is present
    const token = this.getToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Default to JSON body if not FormData
    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        cache: 'no-store',
        headers
      });

      let json: any;
      try {
        json = await response.json();
      } catch {
        json = {
          success: false,
          error: `সার্ভার থেকে অপ্রত্যাশিত প্রতিক্রিয়া পাওয়া গেছে (স্ট্যাটাস: ${response.status})`
        };
      }

      if (!response.ok && json.success === undefined) {
        json.success = false;
        json.error = json.error || `HTTP ${response.status} ত্রুটি`;
      }

      return json as ApiResponse<T>;
    } catch (err: any) {
      console.error(`API Error [${endpoint}]:`, err);
      return {
        success: false,
        error: err.message || 'নেটওয়ার্ক সংযোগ বিচ্ছিন্ন বা সার্ভার সাড়া দিচ্ছে না।'
      };
    }
  },

  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          searchParams.append(k, String(v));
        }
      });
    }
    // Prevent intermediate proxy / browser cache on GET requests
    searchParams.append('_t', Date.now().toString());

    const query = searchParams.toString();
    if (query) {
      url += (url.includes('?') ? '&' : '?') + query;
    }
    return this.request<T>(url, { method: 'GET' });
  },

  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(urlOrPath(endpoint), {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  },

  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(urlOrPath(endpoint), {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  },

  async patch<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(urlOrPath(endpoint), {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
  },

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(urlOrPath(endpoint), { method: 'DELETE' });
  },

  async upload(file: File): Promise<ApiResponse<{ url: string; filename: string; originalName: string; size: number }>> {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.getToken();
    const endpoint = token ? `${API_BASE}/media/upload` : `${API_BASE}/submissions/upload`;
    const headers: Record<string, string> = {
      Accept: 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: formData
      });
      return await response.json();
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'ফাইল আপলোড ব্যর্থ হয়েছে।'
      };
    }
  }
};

function urlOrPath(path: string): string {
  return path;
}
