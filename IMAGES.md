# Image Asset Register & Alt Text Policy

Per the project quality gates, **no Stitch-hosted or `lh3.googleusercontent.com` URLs are permitted in the build**. All external Google-hosted temporary assets from the HTML design exports have been removed.

## 1. Image Sourcing & Licensing

- **Provider:** Bundled, original SVG food and dining illustrations in `public/images/`. They do not require network access and remain stable when an image host is unavailable.
- **Icons & Graphics:** Vector SVGs using Lucide React / Material Symbols icons.
- **Alt Text Standard:** Every image provides descriptive, context-specific `alt` text explaining the subject (dish name, taverna setting, or artisanal craft). Purely decorative elements use `alt=""` or `aria-hidden="true"`.

## 2. Image Register (Mock Fixtures)

| Entity / ID | Subject / Context | Image Reference | Accessible Alt Text |
|---|---|---|---|
| `patriko` | Warm dining table | `/images/patriko.svg` | "A warmly lit dining table by the stone hearth at To Patriko Taverna" |
| `dionysus` | Stone cellar wine table | `/images/dionysus.svg` | "Restaurant table prepared for dinner with wine glasses" |
| `kafeneio` | Coffee and meze table | `/images/kafeneio.svg` | "Sharing plates and fresh pita on a rustic wooden table" |
| `troodos` | Seasonal village stew | `/images/troodos.svg` | "Warm earthen bowl of seasonal village stew" |
