# Design System — SiteCheck

> Rule file for Antigravity agents. Path: `.agents/rules/design-system.md`
> Apply these tokens and rules to every UI component, screen, and layout generated.

---

## 1. Typography

### Font Family
**Plus Jakarta Sans** — used at all levels without exception.
No other font is permitted in this product.

```css
font-family: 'Plus Jakarta Sans', sans-serif;
```

### Type Scale (Material Design 3)

| Token        | Size  | Weight | Usage                              |
| ------------ | ----- | ------ | ---------------------------------- |
| display-lg   | 32px  | 700    | App name, major headings           |
| display-md   | 26px  | 700    | Page titles                        |
| display-sm   | 22px  | 700    | Hero section headings              |
| headline-lg  | 22px  | 600    | Section headings                   |
| headline-md  | 18px  | 600    | Card headings, modal titles        |
| headline-sm  | 16px  | 600    | Sub-section labels                 |
| title-lg     | 16px  | 600    | Card titles                        |
| title-md     | 14px  | 600    | Small card titles                  |
| title-sm     | 13px  | 600    | Minor titles                       |
| body-lg      | 16px  | 400    | Primary body copy                  |
| body-md      | 14px  | 400    | Default body, form labels, tables  |
| body-sm      | 13px  | 400    | Secondary copy, captions           |
| label-lg     | 14px  | 500    | Large labels, stats               |
| label-md     | 13px  | 500    | Labels, metadata                   |
| label-sm     | 12px  | 500    | Tags, badges, metadata             |
| micro        | 11px  | 500    | Timestamps, footnotes              |

---

## 2. Colour Tokens

### Primary — Clinical Teal

| Token          | Hex       | Usage                           |
| -------------- | --------- | ------------------------------- |
| primary-50     | #E6F7F2   | Page backgrounds, light fills   |
| primary-100    | #A8E0CE   | Hover fills                     |
| primary-300    | #5CBFA3   | Borders, dividers               |
| primary-500    | #1A9E78   | Primary buttons, key actions    |
| primary-700    | #0D7257   | Pressed / active state          |
| primary-900    | #074D3A   | Text on light backgrounds       |

### Secondary — Forest Green

| Token          | Hex       | Usage                           |
| -------------- | --------- | ------------------------------- |
| secondary-50   | #EBF5E0   | Success backgrounds             |
| secondary-100  | #B8DFA0   | Success hover fills             |
| secondary-300  | #72B84A   | Success borders                 |
| secondary-500  | #3D8C18   | Success states, confirmations   |
| secondary-700  | #266210   | Success pressed state           |
| secondary-900  | #153E08   | Success text on light           |

### Tertiary — Warm Amber

| Token          | Hex       | Usage                                    |
| -------------- | --------- | ---------------------------------------- |
| tertiary-50    | #FEF7E6   | Warning backgrounds                      |
| tertiary-100   | #FDDFA0   | Warning hover fills                      |
| tertiary-300   | #F8B830   | Warning borders                          |
| tertiary-500   | #D48A00   | Warnings, low-stock, empty fields        |
| tertiary-700   | #9A6200   | Warning pressed state                    |
| tertiary-900   | #5C3A00   | Warning text on light                    |

### Neutral — Slate Gray

| Token          | Hex       | Usage                           |
| -------------- | --------- | ------------------------------- |
| neutral-50     | #F4F6F8   | Page background                 |
| neutral-100    | #DDE3EA   | Dividers, input borders         |
| neutral-300    | #A8B6C4   | Placeholder text                |
| neutral-500    | #6A7F92   | Secondary text                  |
| neutral-700    | #3A4A58   | Body text                       |
| neutral-900    | #1A2530   | Headings                        |

### Neutral Variant — Warm Sand

| Token          | Hex       | Usage                                |
| -------------- | --------- | ------------------------------------ |
| sand-50        | #FAF8F4   | Card surfaces, form backgrounds      |
| sand-100       | #EDE8DC   | Empty states, panel fills            |
| sand-300       | #CFC4A8   | Subtle borders                       |
| sand-500       | #A89070   | Muted labels                         |
| sand-700       | #6E5C40   | Captions                             |
| sand-900       | #3A2E14   | Dark text on warm surfaces           |

### Semantic (Fixed)

| Token          | Hex       | Usage                               |
| -------------- | --------- | ----------------------------------- |
| error          | #E8392A   | Critical stock, blocked, failed     |
| error-bg       | #FDECEA   | Error background fills              |
| success        | #3D8C18   | Record saved, sync complete         |
| success-bg     | #EBF5E0   | Success background fills            |
| warning        | #D48A00   | Low stock, incomplete, pending      |
| warning-bg     | #FEF7E6   | Warning background fills            |
| info           | #1A9E78   | Informational banners               |
| info-bg        | #E6F7F2   | Info background fills               |

---

## 3. Surfaces

- **Never use `#FFFFFF` as a default surface colour**
- Default card / form surface: `sand-50` (`#FAF8F4`)
- Page background: `neutral-50` (`#F4F6F8`)
- Elevated card (modal, dropdown): `#FFFFFF` is acceptable only for elevated overlays
- Input field background: `#FFFFFF` with `neutral-100` border

---

## 4. Drug Stock Colour Mapping

This is a critical UI rule. Always use these exact colours for stock status:

| Status    | Background  | Text colour  | Border      | Label    |
| --------- | ----------- | ------------ | ----------- | -------- |
| Adequate  | #EBF5E0     | #153E08      | #72B84A     | "In Stock" |
| Low       | #FEF7E6     | #5C3A00      | #F8B830     | "Low Stock" |
| Critical  | #FDECEA     | #7A1010      | #E8392A     | "Critical" |

Thresholds:
- **Adequate**: `quantity_in_stock > low_stock_threshold`
- **Low**: `quantity_in_stock <= low_stock_threshold && quantity_in_stock > 0`
- **Critical**: `quantity_in_stock === 0`

---

## 5. Spacing Scale

```
spacing-1  = 4px
spacing-2  = 8px
spacing-3  = 12px
spacing-4  = 16px
spacing-5  = 20px
spacing-6  = 24px
spacing-8  = 32px
spacing-10 = 40px
spacing-12 = 48px
spacing-16 = 64px
```

---

## 6. Border Radius

```
radius-sm  = 4px   — inputs, small tags
radius-md  = 8px   — buttons, cards
radius-lg  = 12px  — modals, panels
radius-xl  = 16px  — large cards
radius-full = 9999px — badges, pills
```

---

## 7. Shadows

```
shadow-sm  : 0 1px 2px rgba(0,0,0,0.05)             — subtle lift
shadow-md  : 0 4px 8px rgba(0,0,0,0.08)             — cards
shadow-lg  : 0 8px 24px rgba(0,0,0,0.10)            — modals, dropdowns
shadow-focus: 0 0 0 3px rgba(26,158,120,0.25)        — focus ring (primary-500)
```

---

## 8. Component Rules

### Buttons

| Variant   | Background   | Text      | Border      | Hover        |
| --------- | ------------ | --------- | ----------- | ------------ |
| Primary   | primary-500  | #FFFFFF   | none        | primary-700  |
| Secondary | sand-50      | primary-700 | primary-300 | primary-100  |
| Danger    | error        | #FFFFFF   | none        | #B82A1D      |
| Ghost     | transparent  | neutral-700 | neutral-100 | sand-100   |

- Minimum touch target: `44px height`
- Button copy: active verbs only — "Save record", "Send report", "Add drug"
- Loading state: show spinner, disable button, do not change text to "Loading..."

### Form Inputs

- Background: `#FFFFFF`
- Border: `neutral-100` default, `primary-500` on focus, `error` on validation fail
- Border radius: `radius-sm` (4px)
- Padding: `12px 16px`
- Label: `body-md` weight 500, `neutral-700`, above the input
- Placeholder: `neutral-300`
- Required indicator: amber dot (•) next to label, not red asterisk
- Error message: `body-sm`, `error` colour, below the input with amber highlight on field

### Alerts / Banners

```
info    → info-bg background, primary-900 text, primary-300 left border
success → success-bg background, secondary-900 text, secondary-300 left border
warning → warning-bg background, tertiary-900 text, tertiary-300 left border
error   → error-bg background, #7A1010 text, error left border (4px)
```

- Offline banner: fixed top, info style, `"You are offline. Your records are saved and will sync once you reconnect."`
- Sync complete banner: auto-dismiss after 4 seconds, success style

### Tables

- Header row: `primary-900` background, `#FFFFFF` text, `body-md` weight 600
- Alternating rows: `#FFFFFF` / `sand-50`
- Row hover: `primary-50`
- Border: `neutral-100` between rows
- No vertical borders between columns

### Cards

- Background: `sand-50`
- Border: `0.5px solid neutral-100`
- Border radius: `radius-lg`
- Padding: `spacing-6` (24px)
- Shadow: `shadow-md`

---

## 9. Iconography

- Use a single, consistent icon library (developer chooses — Lucide recommended)
- Icon size: `16px` inline, `20px` standalone, `24px` feature icons
- Icon colour: inherits from parent text colour unless explicitly overridden
- Do not use emojis as icons in the UI

---

## 10. Motion & Transitions

- Default transition: `150ms ease-out` for colour and opacity changes
- Page transitions: `200ms ease-in-out`
- Modal enter: fade + scale from 95% to 100%, `200ms`
- No decorative animations — this is a clinical tool, not a marketing site

---

## 11. Responsive Breakpoints

```
sm  = 640px   — small tablet
md  = 768px   — tablet
lg  = 1024px  — laptop (primary target)
xl  = 1280px  — desktop
```

- Primary target device: **desktop / laptop** (medics use desktop in clinic)
- Mobile is secondary — ensure usability but do not optimise exclusively for mobile in v1

---

## 12. Accessibility

- All interactive elements must have visible focus rings (`shadow-focus`)
- All form inputs must have associated `<label>` elements
- All images must have `alt` text
- Colour alone must never be the only indicator of state (always pair with text or icon)
- Minimum contrast ratio: 4.5:1 for body text (WCAG AA)

---

*design-system.md — SiteCheck v1.0*
