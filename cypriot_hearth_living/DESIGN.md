---
name: Cypriot Hearth & Living
colors:
  surface: '#fff8f5'
  surface-dim: '#e9d7c8'
  surface-bright: '#fff8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1e8'
  surface-container: '#feeadc'
  surface-container-high: '#f8e5d6'
  surface-container-highest: '#f2dfd1'
  on-surface: '#231a11'
  on-surface-variant: '#54433f'
  inverse-surface: '#392e25'
  inverse-on-surface: '#ffeee1'
  outline: '#87726e'
  outline-variant: '#dac1bc'
  surface-tint: '#964737'
  primary: '#7c3325'
  on-primary: '#ffffff'
  primary-container: '#9a4a3a'
  on-primary-container: '#ffd4cb'
  inverse-primary: '#ffb4a5'
  secondary: '#56624c'
  on-secondary: '#ffffff'
  secondary-container: '#d7e4c8'
  on-secondary-container: '#5a6650'
  tertiary: '#58471c'
  on-tertiary: '#ffffff'
  tertiary-container: '#725f31'
  on-tertiary-container: '#f4daa1'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad3'
  primary-fixed-dim: '#ffb4a5'
  on-primary-fixed: '#3e0501'
  on-primary-fixed-variant: '#783022'
  secondary-fixed: '#dae7cb'
  secondary-fixed-dim: '#becbaf'
  on-secondary-fixed: '#141e0d'
  on-secondary-fixed-variant: '#3f4a35'
  tertiary-fixed: '#fae0a6'
  tertiary-fixed-dim: '#ddc48d'
  on-tertiary-fixed: '#251a00'
  on-tertiary-fixed-variant: '#564519'
  background: '#fff8f5'
  on-background: '#231a11'
  surface-variant: '#f2dfd1'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 21px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.25rem
  space-xl: 1.5rem
---

## Brand & Style

The brand personality is rooted in Mediterranean hospitality, communal dining, and the living heritage of Cyprus. The interface evokes the warmth of sunbaked limestone, wood-fired clay ovens (*fournoi*), copper kitchenware, and lingering village meze tables (*kali hora*—a pleasant hour, good timing, and welcoming space). It feels artisanal yet effortlessly contemporary, eschewing tourist cliches in favor of authentic cultural immersion.

Targeted at locals, diaspora returnees, and discerning travelers seeking genuine culinary and cultural programming, the aesthetic blends warm tactile minimalism with organic softness. Visual elements favor creamy plaster tones, fired clay, and pressed olive leaves. Contrast is intentional and gentle: sharp technological neon is completely absent, replaced by ambient warmth, tactile pill elements, and generous, breathable margins.

### Photography & Art Direction
Imagery must reflect authentic Cypriot environments: candlelit taverna courtyards, hand-pinched sourdough, crackling kleftiko wrapped in parchment, terracotta vessels, wild thyme, and sunlit carob trees. 
- **Grade & Lighting:** Golden-hour natural light and amber hearthside evening tones. Never cool-balanced, blue-cast, or clinically over-sharpened.
- **Scrims:** Overlay only soft, warm linear scrims (`linear-gradient(180deg, rgba(43,33,24,0) 40%, rgba(43,33,24,0.72) 100%)`) over imagery to anchor white/cream typographic labels. Never use decorative synthetic gradients.

## Colors

The system operates exclusively in light mode to honor natural Mediterranean daylight and sun-warmed whitewashed plaster. Dark mode is intentionally unsupported.

### Palette Architecture
- **Primary / Brand (`#9A4A3A` - Terracotta):** Fired clay earth. Applied to primary calls-to-action, selected interactive states, icon highlights, and high-emphasis transaction containers.
- **Secondary Accent (`#4F5B45` - Deep Olive):** Silvered olive grove foliage. Used for secondary outlines, open-status indicators, success metrics, and grounded badge counters.
- **Tertiary / Warm Highlight (`#F3D9A0` - Soft Amber):** Raw carob honey and woven straw. Reserved for top-bar user credit balances, exclusive perks, and high-value cultural access flags.
- **Neutral Canvas (`#FBF5EE` - Warm Cream):** The foundational backdrop across all viewports. Absolute white (`#FFFFFF`) is prohibited as an edge-to-edge canvas background.
- **Surface & Cards (`#FFFFFF` at 70% opacity / `#F5EDE2` Solid Cream):** Translucent white layered over warm cream creates soft luminescence without artificial glass shine. Inset modules, segmented track bars, and unselected chips use `#F5EDE2`.
- **Text Primary (`#2B2118` - Near-Black Espresso Brown):** High-legibility warm neutral replacing harsh default black.
- **Text Secondary (`#7A6A5A` - Muted Umber):** Subdued contrast for metadata, secondary descriptions, and contextual labels.
- **Live / Status Soft Crimson (`#F6D5CF`):** Delicate blush background for urgent or live states ("Live Now", "Ending Soon"), always paired with `#9A4A3A` text.

## Typography

The typography uses **Plus Jakarta Sans** across all roles to ensure geometric balance, gentle warmth, and crisp legibility on small mobile displays. Serif faces are deliberately excluded to preserve an uncluttered, modern lifestyle-editorial aesthetic.

- **Display (28px Bold):** Reserved for hero screens, primary event banners, and top-level landing headers. Uses tight negative letter-spacing (`-0.02em`) to ground the headline.
- **Section Titles / Headline Medium (18px Semibold):** Establishes rhythm across categorized feeds, such as "Tonight's Paniyiri", "Clay Oven Specials", or "Village Cellars".
- **Body Regular (14px Regular, 1.5 line-height):** Tuned for narrative vendor profiles, historical context, and menu descriptions.
- **Interactive Action / Buttons (15px Semibold):** Sits within buttons and actionable chips to maintain punchy visual weight.
- **Captions & Metadata (12px Medium / 11px Semibold):** Configured for location tags, timestamps, capacity counters, and status badges.

## Layout & Spacing

Layout conforms to an ergonomic mobile-first fluid grid structured around a standard 20px (`1.25rem`) screen margin safe area. 

### Rhythm & Flow
- **Screen Margins:** Fixed at 20px on mobile to cradle viewport edges comfortably without content cramping.
- **Section Stacking:** Consistent 24px (`1.5rem`) vertical gap between logical content sections.
- **Card Inner Spacing:** 16px (`1rem`) default padding inside surfaces, ensuring photography and content maintain proportionate visual balance.
- **Component Tight Gaps:** 8px (`0.5rem`) between adjacent tags, metadata items, and horizontal chip scroll tracks.
- **Responsive Adaptations:** On wider viewports (tablets and above), the main content column is capped at 480px–640px to preserve an intimate mobile card paradigm, centered within an expansive `#FBF5EE` frame.

## Elevation & Depth

Depth in this system avoids harsh computational cast shadows and neon glows, relying instead on warm diffused shadows derived from the primary text tone.

- **Primary Surface Elevation:** Cards utilize an ambient organic drop shadow: `0 4px 16px rgba(43, 33, 24, 0.06)`. The brown tint (`rgba(43,33,24,...)`) prevents the dirty gray cast typical of standard neutral drops.
- **Floating Modals & Bottom Sheets:** Employ `0 12px 32px rgba(43, 33, 24, 0.12)` alongside an ambient background dim of `rgba(43, 33, 24, 0.40)`.
- **Card Stroke Technique:** Surfaces reject hard 1px dark borders. Instead, cards rest on delicate tonality (`rgba(255, 255, 255, 0.70)` or `#F5EDE2`), achieving depth through tonal separation from the `#FBF5EE` background.

## Shapes

The design system incorporates a dual-geometry hierarchy: structured rounded rectangles for containers and complete pill capsules for interactive components.

- **Container Surfaces (Cards, Bottom Sheets):** Fixed 20px radius. This provides structural softness without ballooning card edges.
- **Media & Photos:** 16px corner radius to sit inside card boundaries with harmonized concentric margins.
- **Interactive Units (Buttons, Filter Chips, Credit Badges):** Fully rounded pill geometry (`roundedness: 3` / `9999px`). The pill shape reinforces physical touchability, mimicking smooth Mediterranean beach stones.

## Components

### Top Bar & Navigation Lockup
- **Persistent Header:** Top bar rests on `#FBF5EE` with no lower separator rule. Left: wordmark lockup in `#2B2118` (or 24px chevron icon on child screens). Right: a pill cluster featuring the Credit Chip and a 36px circular avatar with a 2px `#F5EDE2` border.
- **Credit Balance Chip:** Compact pill with `#F3D9A0` background, `#2B2118` text, containing a subtle coin/urn glyph, the euro balance (e.g., `€42.50`), and 8px horizontal padding.
- **Location Selector Pill:** Positioned under the brand lockup or integrated into the search tier. Set against `#F5EDE2` with a 6px olive dot (`#4F5B45`), displaying active region and current service status (e.g., "Limassol Old Town • Open").

### Buttons
- **Primary Action Button:** Full-width or inline pill; background `#9A4A3A`, typography 15px Semibold in `#FBF5EE`. Height: 48px. Active press state reduces brightness slightly (`#873F31`).
- **Secondary Action Button:** Outlined pill; 1.5px solid `#4F5B45`, transparent fill, typography 15px Semibold in `#4F5B45`.
- **Tertiary / Ghost Button:** Transparent background, typography in `#9A4A3A` with a rightward directional chevron icon.

### Filter & Category Chips
- **Geometry:** 36px height pill shape with 14px horizontal padding.
- **Selected State:** Solid `#9A4A3A` background, text `#FBF5EE`.
- **Unselected State:** Solid `#F5EDE2` background, text `#2B2118`. Borderless.

### Badges & Micro-States
- **Live / Urgent Badge:** Pill container with `#F6D5CF` background, text `#9A4A3A` at 11px Semibold, featuring an animated 6px terracotta pulse dot.
- **Operational Badge:** Pill container with `#E3E9DE` background, text `#4F5B45` for "Open", "Verified Producer", or "Table Available".

### Cards & Content Modules
- **Dining / Event Card:** 20px radius card with `rgba(255, 255, 255, 0.70)` background and `0 4px 16px rgba(43,33,24,0.06)` shadow. Top section hosts a 16px radius image with an inset warm scrim. Bottom section hosts the 18px semibold title, cuisine metadata, and price tier.
- **Credit & Dining Pass Card:** A high-tier container saturated in terracotta (`#9A4A3A`), displaying a cream (`#FBF5EE`) typography cluster with large balance figures, cardholder identity, micro-watermark motifs of traditional weaving, and a full-width integrated cream pill for "Tap to Pay".

### Form Inputs & Selectors
- **Fields:** 48px height, 12px corner radius or pill variant, filled with `#F5EDE2`, no stroke. Placeholder colored with `#7A6A5A`. Focus state introduces a 1.5px outline in `#9A4A3A`.
- **Checkboxes & Radios:** Rounded circular form factors colored in `#9A4A3A` when active, with `#FBF5EE` check graphics.