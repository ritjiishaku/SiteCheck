function getKey(): string {
  if (typeof window === 'undefined') return ''
  const token = localStorage.getItem('token')
  return token ? token.slice(-32) : 'sitecheck-fallback-key!'
}

export function encryptClient(data: string): string {
  const key = getKey()
  const encoded = new TextEncoder().encode(data)
  const keyBytes = new TextEncoder().encode(key)
  const result = new Uint8Array(encoded.length)
  for (let i = 0; i < encoded.length; i++) {
    result[i] = encoded[i] ^ keyBytes[i % keyBytes.length]
  }
  return btoa(String.fromCharCode(...result))
}

export function decryptClient(data: string): string {
  try {
    const key = getKey()
    const decoded = Uint8Array.from(atob(data), (c) => c.charCodeAt(0))
    const keyBytes = new TextEncoder().encode(key)
    const result = new Uint8Array(decoded.length)
    for (let i = 0; i < decoded.length; i++) {
      result[i] = decoded[i] ^ keyBytes[i % keyBytes.length]
    }
    return new TextDecoder().decode(result)
  } catch {
    return data
  }
}
