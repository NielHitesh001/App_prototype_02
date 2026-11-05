# Design System & Accessibility Specification

## 1. Palette Architecture (Terracotta & Cream)

The application visual system is built on the warm Mediterranean tactile palette derived from Cypriot limestone, terracotta pottery, and olive groves:

| Token | Hex Value | Role & Usage |
|---|---|---|
| `--color-canvas` | `#FBF5EE` | Primary application canvas background (warm sandstone cream) |
| `--color-surface` | `#FFFFFF` | Card containers, dialog backgrounds, and white chip backgrounds |
| `--color-surface-dim` | `#F2DFD1` | Recessed containers, table cell stripes, unselected chips |
| `--color-primary` | `#9A4A3A` | Brand accent, primary buttons, active state indicators |
| `--color-primary-dark`| `#7C3325` | Pressed/active button states, deep terracotta contrast |
| `--color-text-primary`| `#2B2118` | Primary body text and headings (near-black espresso) |
| `--color-text-muted`  | `#7A6A5A` | Secondary metadata, dates, and subtitle copy |
| `--color-olive`       | `#4F5B45` | Secondary accent, badges, environmental and open indicators |
| `--color-amber`       | `#F3D9A0` | Highlight badge container, wallet credit tag accents |

---

## 2. Text Contrast Compliance (WCAG 2.1 AA & AAA)

All core text and foreground pairs have been verified mathematically against WCAG 2.1 luminance standards:

| Foreground | Background | Contrast Ratio | WCAG Compliance | Notes |
|---|---|---|---|---|
| `#2B2118` (Text Primary) | `#FBF5EE` (Canvas) | **14.55 : 1** | **Passes AAA** (Threshold 7.0:1) | Optimal reading contrast for body copy and headings |
| `#2B2118` (Text Primary) | `#FFFFFF` (Surface Card) | **15.75 : 1** | **Passes AAA** (Threshold 7.0:1) | High legibility inside cards and dialogs |
| `#7A6A5A` (Text Muted) | `#FBF5EE` (Canvas) | **4.81 : 1** | **Passes AA** (Threshold 4.5:1) | Compliant for secondary labels and timestamps |
| `#FFFFFF` (White Text) | `#9A4A3A` (Primary CTA) | **6.15 : 1** | **Passes AA** (Threshold 4.5:1, AAA Large) | Full opacity white text on terracotta buttons |
| `#FFFFFF` (White Text) | `#7C3325` (Primary Dark)| **8.91 : 1** | **Passes AAA** (Threshold 7.0:1) | Used in wallet balance hero banner |
| `#9A4A3A` (Primary) | `#FBF5EE` (Canvas) | **5.68 : 1** | **Passes AA** (Threshold 4.5:1) | Compliant for interactive text links and active chips |
| `#4F5B45` (Olive) | `#FBF5EE` (Canvas) | **6.65 : 1** | **Passes AA** (Threshold 4.5:1, AAA Large) | Olive status tags and verified indicators |

> **Important Rule:** Opacity-reduced text such as `text-white/70` is strictly avoided at small font sizes (<18px) to prevent contrast degradation below 4.5:1.

---

## 3. Typography Hierarchy

- **Font Family:** `Plus Jakarta Sans`, sans-serif (Display headlines: `Outfit`, sans-serif).
- **Scale:**
  - `Display / Hero`: 28px–32px, bold, -0.02em tracking.
  - `Headline Large`: 22px–24px, semibold, line-height 28px.
  - `Headline Medium`: 18px–20px, semibold, line-height 24px.
  - `Body Regular`: 15px, regular, line-height 22px.
  - `Body Small / Caption`: 13px, regular, line-height 18px.
  - `Label / Pill Action`: 12px–14px, semibold.

---

## 4. Accessibility & Touch Targets

- **Tap Targets:** Interactive controls (buttons, links, chips, steppers, navigation items) have a minimum tap target of **44 × 44 px**.
- **Focus Rings:** Visible high-contrast focus rings (`outline: 2px solid #9A4A3A; outline-offset: 2px`) on all keyboard-navigable elements.
- **Motion:** Full support for `prefers-reduced-motion: reduce` disabling animations, pulses, and transitions.
- **Screen Reader Support:** Single semantic `h1` per page; `role="dialog"` with `aria-modal="true"` and focus return; `role="tablist"` with `aria-selected` on pass tabs; dynamic `aria-pressed` states on filter chips.
