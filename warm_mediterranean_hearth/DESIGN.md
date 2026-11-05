---
name: Warm Mediterranean Hearth
colors:
  surface: '#fef9f0'
  surface-dim: '#ded9d1'
  surface-bright: '#fef9f0'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f3ea'
  surface-container: '#f2ede4'
  surface-container-high: '#ede8df'
  surface-container-highest: '#e7e2d9'
  on-surface: '#1d1c16'
  on-surface-variant: '#56423d'
  inverse-surface: '#32302a'
  inverse-on-surface: '#f5f0e7'
  outline: '#8a726c'
  outline-variant: '#ddc0ba'
  surface-tint: '#a04028'
  primary: '#9d3d26'
  on-primary: '#ffffff'
  primary-container: '#bd553b'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb4a2'
  secondary: '#4d6547'
  on-secondary: '#ffffff'
  secondary-container: '#cce7c3'
  on-secondary-container: '#51694b'
  tertiary: '#805200'
  on-tertiary: '#ffffff'
  tertiary-container: '#a06901'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad2'
  primary-fixed-dim: '#ffb4a2'
  on-primary-fixed: '#3c0700'
  on-primary-fixed-variant: '#802913'
  secondary-fixed: '#cfeac5'
  secondary-fixed-dim: '#b3ceaa'
  on-secondary-fixed: '#0b2009'
  on-secondary-fixed-variant: '#364c31'
  tertiary-fixed: '#ffddb4'
  tertiary-fixed-dim: '#feb956'
  on-tertiary-fixed: '#291800'
  on-tertiary-fixed-variant: '#633f00'
  background: '#fef9f0'
  on-background: '#1d1c16'
  surface-variant: '#e7e2d9'
typography:
  headline-xl:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Outfit
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Outfit
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes an atmospheric, quietly confident digital space for off-season Mediterranean gastronomy. Evoking a limestone taverna in Limassol or Paphos on a damp November dusk, the aesthetic centers on grounded materials: weathered masonry, cold rain outside, hearth-fired clay, and unfiltered olive oil. It intentionally sidesteps whitewashed Aegean tropes and summer tourism kitsch, favoring an understated, textured winter warmth.

The design movement mixes **Tactile Minimalism** with **Organic Modernism**: generous whitespace and structured editorial typography balance tactile warm-hued surfaces, low-contrast boundaries, and warm, diffused lighting. Micro-interactions feel weighted and deliberate, communicating culinary craft, quiet conviviality, and unhurried hospitality.

## Colors

The palette draws strictly from physical Cypriot earth, winter flora, and hearth fires. High-frequency digital pure black (`#000000`) and optical pure white (`#FFFFFF`) are strictly avoided across all surfaces to maintain visual warmth and low glare.

### Hierarchy & Role Allocation
- **Primary (Terracotta / Warm Clay)**: `#C2593F` serves as the primary action tone, with `#A4432B` for interactive hover/active states and `#7D311E` for deep emphasis on light backgrounds.
- **Secondary (Muted Olive / Soft Sage)**: `#5A7254` grounds supportive actions, environmental cues, and verified venue markers; `#3F523B` handles high-contrast text tags; `#E8EEE6` functions as a pale tinted container.
- **Tertiary / Accent (Golden Amber / Honey)**: `#E09F3E` and `#D08726` power wallet credit counters, off-peak flash incentives, and warm glowing highlights, backed by `#FFF4E5` for luminous surface fills.
- **Neutrals (Limestone & Smoked Charcoal)**: Canvas base defaults to sandstone `#FAF7F2`. Structural borders and structural cards employ `#EDE8DF` and `#D5CEBE`. Typography relies on smoked charcoal `#22201E` for primary copy and `#3C3935` for secondary elements.
- **Atmospheric & Functional Indicators**: Fireplace presence uses `#D96B27`, workspace/quiet hours use `#4A6B82`, and active booking confirmation utilizes muted forest `#386641`.

## Typography

The type system blends the contemporary, open geometry of Outfit for display headlines with the neutral, hyper-legible ergonomics of Inter for dense booking states, dynamic schedules, and operational details. 

### Editorial Guidelines
- Set headline line-height tightly to maintain an intentional, poster-like presence on venue profile headers.
- Never use full capitalized strings exceeding three words; reserve uppercase treatment strictly for `label-sm` atmospheric chips (e.g., "FIREPLACE ACTIVE").
- Maintain high contrast ratios by pairing `#22201E` exclusively over `#FAF7F2` and `#EDE8DF`. Never render body-level type in warm terracotta.

## Layout & Spacing

The layout is built on a responsive 12-column grid on desktop screens (max structural width 1280px, centered) stepping down to a 6-column grid on tablet (768px–1024px) and a single-column fluid layout with 16px horizontal safe margins on mobile.

Spatial relationships prioritize breathing room around imagery and atmospheric indicators:
- Components employ an internal rhythm driven by `space-md` (16px) and `space-lg` (24px) to avoid crowded lists.
- Vertical section margins rely on `space-xl` (40px) up to 80px on desktop to convey relaxed, unhurried navigation.
- Sticky navigation headers lock to a 72px desktop height (60px mobile) with contextual sandstone translucency.

## Elevation & Depth

Visual depth avoids cool, synthetic dropshadows. Instead, elevation uses **warm ambient tinting** paired with micro-borders derived from natural limestone.

- **Level 0 (Base Canvas)**: Solid `#FAF7F2`, no shadow, unbordered.
- **Level 1 (Cards, Venue Cards, Input Fields)**: Surface `#FFFFFF` or `#EDE8DF` with a hairline border (`1px solid #E2DCD0`) and a warm ambient glow: `0 4px 20px -2px rgba(125, 49, 30, 0.04), 0 2px 6px -1px rgba(34, 32, 30, 0.03)`.
- **Level 2 (Dropdowns, Dynamic Panels, Sticky Modals)**: Lifted surface with deeper terracotta ambient dispersal: `0 12px 32px -4px rgba(125, 49, 30, 0.08), 0 4px 12px -2px rgba(34, 32, 30, 0.04)`.
- **Level 3 (Toasts, Time-Sensitive Overlays)**: Surface accompanied by a warm directional glow: `0 20px 40px -8px rgba(60, 57, 53, 0.12)`.
- **Glass Elements (Sticky Headers & Bar Overlays)**: Background `#FAF7F2` at 88% opacity with `backdrop-filter: blur(12px)` and a subtle bottom border (`1px solid rgba(213, 206, 190, 0.6)`).

## Shapes

The design system uses a rounded geometry level of 2, corresponding to corner radii between 14px and 20px for key components. This reflects hand-thrown terracotta ceramics, weathered sea-stone, and rustic woodwork.

- Standard cards, interactive input blocks, and venue containers: `16px` (`rounded-lg`).
- Feature cards, booking sheets, and modal frames: `20px` (`rounded-xl`).
- Micro-elements (atmospheric tags, badges, buttons): `10px` to `12px` (`rounded-md`).
- Circular indicators (credit meter gauges, live status dots): Full pill/oval geometry.

## Components

### Buttons
- **Primary Action**: Terracotta `#C2593F` fill, white `#FAF7F2` text, `14px` border radius, padding `12px 24px`. Hover shifts to `#A4432B` with a soft terracotta ambient aura.
- **Secondary Action**: Olive outline or tinted stone (`#EDE8DF` fill, `#3C3935` text, no heavy border).
- **Subtle / Ghost**: Transparent fill, `#C2593F` text, underlining on hover with `2px` offset.

### Atmospheric Status Badges & Chips
- **Fireplace Lit**: Background `#D96B27` at 12% opacity, text `#A8470E`, accompanied by a subtle hearth icon.
- **Quiet Table**: Background `#4A6B82` at 12% opacity, text `#2E4D61`.
- **Flash Deal / Off-Peak Perk**: Background `#FFF4E5`, border `1px solid #E09F3E`, text `#965C0A`.
- **Rainy Day Comfort**: Background `#E8EEE6`, text `#3F523B`.
- Chips use `rounded-md` (8px–10px) with `4px 10px` inner padding and `label-sm` typography.

### Wallet Credit Meter
- Displays user off-season credits with a segmented linear bar or ring gauge in Honey `#E09F3E` against a warm stone track (`#EDE8DF`). Numeric readouts pair bold Outfit numbers with sm-label currency marks.

### Venue Cards
- Container enclosed in `16px` radius with `1px solid #EDE8DF`.
- Imagery uses a 16:10 aspect ratio with gentle inner-vignetting.
- Atmospheric tags float top-left with frosted stone backing; credit bonus or off-peak pricing pins to bottom-right in `#7D311E`.

### Form Fields & Checkboxes
- **Inputs**: Sandstone background `#FFFFFF` framed in `1.5px solid #D5CEBE`, transitioning to `#C2593F` on focus with an ambient halo.
- **Checkboxes & Radios**: Custom curved squares (`4px` radius) and circles with `#5A7254` checked fills and stone track unselected states.

### Sticky Header
- Anchored with blurred sandstone translucent foundation, containing branch location picker, wallet meter preview, and crisp humanist menu items.