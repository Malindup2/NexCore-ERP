import { clearAuthData, getToken } from "@/lib/auth"
import { getApiBaseUrl } from "@/lib/config"

/** @deprecated Prefer getApiBaseUrl() from @/lib/config or apiUrl() */
export const API_BASE_URL = getApiBaseUrl()

export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${getApiBaseUrl()}${normalized}`
}

function isPublicAuthRequestUrl(url: string): boolean {
  try {
    const path = new URL(url, "http://local.invalid").pathname
    return (
      path.includes("/api/auth/login") ||
      path.includes("/api/auth/register") ||
      path.includes("/api/auth/forgot-password") ||
      path.includes("/api/auth/reset-password")
    )
  } catch {
    return /\/api\/auth\/(login|register|forgot-password|reset-password)/i.test(url)
  }
}

/**
 * Low-level fetch: attaches Bearer token when present, redirects to login on 401
 * (except for public auth endpoints where 401 is a normal validation outcome).
 */
export async function apiFetch(pathOrUrl: string, init: RequestInit = {}): Promise<Response> {
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : apiUrl(pathOrUrl)
  const token = getToken()

  const headers = new Headers(init.headers)
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`)
  }
  if (
    !headers.has("Content-Type") &&
    init.body &&
    typeof init.body === "string" &&
    (init.method === "POST" || init.method === "PUT" || init.method === "PATCH")
  ) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(url, { ...init, headers })

  if (
    response.status === 401 &&
    typeof window !== "undefined" &&
    !isPublicAuthRequestUrl(url)
  ) {
    clearAuthData()
    window.location.href = "/auth/login"
    return response
  }

  return response
}

/** JSON GET/POST etc.; throws ApiError on non-OK (after 401 handling). */
export async function apiJson<T>(pathOrUrl: string, init: RequestInit = {}): Promise<T> {
  const response = await apiFetch(pathOrUrl, init)
  if (!response.ok) {
    const text = await response.text()
    throw new ApiError(response.status, text || response.statusText)
  }
  const ct = response.headers.get("content-type")
  if (ct?.includes("application/json")) {
    return (await response.json()) as T
  }
  return (await response.text()) as T
}

/** Same as apiJson for OK responses; returns null on 403 or other non-OK (no redirect unless 401). */
export async function apiTryJson<T>(pathOrUrl: string, init: RequestInit = {}): Promise<T | null> {
  const response = await apiFetch(pathOrUrl, init)
  if (!response.ok) {
    return null
  }
  const ct = response.headers.get("content-type")
  if (ct?.includes("application/json")) {
    return (await response.json()) as T
  }
  return null
}

export const API_ENDPOINTS = {
  auth: {
    register: apiUrl("/api/auth/register"),
    login: apiUrl("/api/auth/login"),
    forgotPassword: apiUrl("/api/auth/forgot-password"),
    resetPassword: apiUrl("/api/auth/reset-password"),
  },
  hr: {
    employees: apiUrl("/api/hr/employees"),
  },
  inventory: {
    products: apiUrl("/api/inventory/products"),
  },
  sales: {
    customers: apiUrl("/api/sales/customers"),
    orders: apiUrl("/api/sales/orders"),
  },
  procurement: {
    suppliers: apiUrl("/api/procurement/suppliers"),
    orders: apiUrl("/api/procurement/orders"),
  },
  accounting: {
    accounts: apiUrl("/api/accounting/Accounts"),
    journalEntries: apiUrl("/api/accounting/JournalEntries"),
    reports: {
      trialBalance: apiUrl("/api/accounting/Reports/trial-balance"),
      balanceSheet: apiUrl("/api/accounting/Reports/balance-sheet"),
      incomeStatement: apiUrl("/api/accounting/Reports/income-statement"),
      cashFlow: apiUrl("/api/accounting/Reports/cash-flow"),
    },
  },
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  let pathOrUrl = url
  if (url.startsWith("http")) {
    const base = getApiBaseUrl()
    pathOrUrl = url.startsWith(base) ? url.slice(base.length) || "/" : url
  } else if (!url.startsWith("/")) {
    pathOrUrl = `/${url}`
  }
  return apiJson<T>(pathOrUrl, options)
}

export const authApi = {
  register: async (data: { username: string; email: string; password: string }) => {
    return apiRequest<string>(API_ENDPOINTS.auth.register, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  login: async (data: { email: string; password: string }) => {
    return apiRequest<{ token: string }>(API_ENDPOINTS.auth.login, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },
}
