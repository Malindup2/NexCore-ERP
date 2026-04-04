/** Central API base (gateway). Trailing slashes are stripped. */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166"
  return raw.replace(/\/+$/, "")
}
