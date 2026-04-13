import { fileURLToPath } from 'url'
import path from 'path'

// ESM equivalent of __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── x402 / Stellar: keep out of the webpack bundle ──
  // These packages use Node.js internals and must run in the
  // Next.js server runtime, NOT be bundled by webpack/Turbopack.
  serverExternalPackages: [
    '@x402/core',
    '@x402/fetch',
    '@x402/stellar',
    '@stellar/stellar-sdk',
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // ══════════════════════════════════════════════════
  // OWASP Top 10 Security Headers
  // ══════════════════════════════════════════════════
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // A3: Sensitive Data Exposure — Prevent MIME sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // A7: XSS — Enable browser XSS filter
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // A6: Security Misconfiguration — Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // A6: Enforce HTTPS (when deployed)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // A6: Control referrer information leakage
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // A6: Restrict browser features
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // A7: XSS — Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' http://localhost:4000 https://x402.org https://horizon-testnet.stellar.org https://friendbot.stellar.org https://va.vercel-scripts.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
      // API routes: stricter caching
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
    ]
  },
  // ── Silence the lockfile workspace-root warning ──
  turbopack: {
    root: __dirname,
  },
}

export default nextConfig
