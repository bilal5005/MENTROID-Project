# Multi-Tenant SaaS Platform Context

## Core Rule: Strict Tenant Isolation

- Every database query for business data MUST filter strictly by `tenantId`.
- NEVER trust `tenantId` from client query params or request bodies.
- Extract `tenantId` strictly from the verified JWT/session token.

## Tech Stack

- Framework: Next.js 14+ (App Router)
- Language: TypeScript
- Database ORM: Prisma (SQLite for local dev / PostgreSQL for prod)
- Auth: Custom JWT with HttpOnly Cookies
