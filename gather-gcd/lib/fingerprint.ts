/**
 * Generate a simple browser fingerprint for user identification
 * This is not meant to be a secure fingerprint, just a way to identify
 * the same user across sessions without requiring login
 */
export async function generateFingerprint(): Promise<string> {
  if (typeof window === 'undefined') {
    return 'server-side'
  }

  const components: string[] = []

  // Screen info
  components.push(`${screen.width}x${screen.height}`)
  components.push(`${screen.colorDepth}`)

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone)

  // Language
  components.push(navigator.language)

  // Platform
  components.push(navigator.platform)

  // User agent (simplified)
  const ua = navigator.userAgent
  components.push(ua.substring(0, 50))

  // Canvas fingerprint (simplified)
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillText('GatherGCD', 2, 2)
      components.push(canvas.toDataURL().substring(0, 50))
    }
  } catch {
    components.push('no-canvas')
  }

  // Generate hash from components
  const data = components.join('|')
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)

  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return hashHex.substring(0, 32)
  } catch {
    // Fallback for environments without crypto.subtle
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(16).padStart(32, '0').substring(0, 32)
  }
}

/**
 * Get or create a fingerprint stored in localStorage
 */
export function getStoredFingerprint(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('gather_gcd_fingerprint')
}

export function setStoredFingerprint(fingerprint: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('gather_gcd_fingerprint', fingerprint)
}

export async function getOrCreateFingerprint(): Promise<string> {
  const stored = getStoredFingerprint()
  if (stored) return stored

  const fingerprint = await generateFingerprint()
  setStoredFingerprint(fingerprint)
  return fingerprint
}
