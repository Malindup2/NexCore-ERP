// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5166';

export const API_ENDPOINTS = {
  auth: {
    register: `${API_BASE_URL}/api/auth/register`,
    login: `${API_BASE_URL}/api/auth/login`,
  },
  hr: {
    employees: `${API_BASE_URL}/api/hr/employees`,
  },
  inventory: {
    products: `${API_BASE_URL}/api/inventory/products`,
  },
  sales: {
    customers: `${API_BASE_URL}/api/sales/customers`,
    orders: `${API_BASE_URL}/api/sales/orders`,
  },
  procurement: {
    suppliers: `${API_BASE_URL}/api/procurement/suppliers`,
    orders: `${API_BASE_URL}/api/procurement/orders`,
  },
  accounting: {
    accounts: `${API_BASE_URL}/api/accounting/accounts`,
    transactions: `${API_BASE_URL}/api/accounting/transactions`,
  },
};

// API Error Handler
export class ApiError extends Error {
  constructor(public status: number, public message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic API Request Handler
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(response.status, errorText || 'Request failed');
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return await response.text() as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Network error occurred');
  }
}

// Auth API Functions
export const authApi = {
  register: async (data: {
    username: string;
    email: string;
    password: string;
  }) => {
    return apiRequest<string>(API_ENDPOINTS.auth.register, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  login: async (data: { email: string; password: string }) => {
    return apiRequest<{ token: string }>(API_ENDPOINTS.auth.login, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
