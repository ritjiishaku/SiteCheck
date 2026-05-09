# Workflow: New Component

> Path: `.agents/workflows/new-component.md`

## Steps

1. Read `.agents/rules/design-system.md` for design tokens
2. Read `.agents/skills/component-builder/SKILL.md` for component structure
3. Determine component category (ui, forms, tables, charts, layouts)
4. Create file in `src/components/{category}/ComponentName.tsx`
5. Use Tailwind utility classes — no inline styles
6. Export as named export
7. Include typed `Props` interface
8. Add `aria-label` or associated `<label>` for accessibility
9. Add `focus-visible:ring-2 focus-visible:ring-primary-500` for keyboard users
10. Test for offline persistence if the component is a form

---

*workflows/new-component.md — SiteCheck v1.0*
