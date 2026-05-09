# Workflow: New API Route

> Path: `.agents/workflows/new-api-route.md`

## Steps

1. Read `.agents/skills/api-route-scaffolder/SKILL.md` for route structure
2. Read `.agents/rules/code-style.md` for coding standards
3. Read `.agents/rules/security.md` for auth, RBAC, and encryption rules
4. Create route file in `src/api/v1/{resource}/route.ts`
5. Always prefix with `/api/v1/`
6. Call `requireAuth()` before any logic
7. Call `requireRole()` for protected operations
8. Write AuditLog entry on every mutation
9. Use standard response envelope (`{ success, data, error?, code? }`)
10. Scope all queries by `company_name`
11. Validate inputs at the API boundary (Zod)
12. Catch and sanitise errors before returning

---

*workflows/new-api-route.md — SiteCheck v1.0*
