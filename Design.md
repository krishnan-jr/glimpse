# Glimpse Design System & UI/UX Guidelines

> Category: Productivity, Education & Routine Management  
> Core Philosophy: Warm, craft-inspired visual discovery. Warm white canvas with olive/sand-toned neutrals, Plum Black typography, singular Pinterest Red accent, generous 16px–20px border radius, flat content-focused depth, and crisp vector iconography.

---

## 1. Visual Theme & Atmosphere

The design operates on a soft, slightly warm white background (`#ffffff` / `#fafaf8`) with **Pinterest Red** (`#e60023`) as the bold, confident brand accent. Neutral tones avoid sterile cool grays in favor of olive and sand tones (`#e5e5e0`, `#e0e0d9`, `#91918c`, `#62625b`), creating a welcoming, tactile, and handcrafted atmosphere.

### Core Principles
1. **Warm White Canvas**: Warm undertones across all surfaces (`#fafaf8`, `#f6f6f3`).
2. **Singular Red Accent (`#e60023`)**: Used purposefully for primary CTAs, active highlights, and key brand moments. Never overuse secondary accent colors.
3. **Plum Black (`#211922`) Typography**: Warmer and richer than harsh pure black (`#000000`) for primary readability.
4. **Olive & Sand Secondary Surfaces**: Buttons, filter chips, and segmented controls use warm sand gray (`#e5e5e0`) and warm light (`#e0e0d9`).
5. **Generous Border Radii**:
   - `16px` (`var(--radius-md)`) for standard buttons, input controls, checklist items, and small cards.
   - `20px` (`var(--radius-lg)`) for container cards, filter panels, and program sections.
   - `28px–32px` (`var(--radius-xl)`) for major section panels and modals.
   - `50%` for circular action buttons, status indicator dots, and round arrow buttons.
   - *No capsule/pill shapes on rectangle action buttons* (strictly maintain 16px rounded corners).
6. **Flat Depth (Level 0 / Level 1)**: Avoid heavy drop shadows. Rely on crisp warm borders (`#e0e0d9` / `#c8c8c1`), clean surface contrast, and generous whitespace.
7. **Vector Iconography & Sparkle Standard**:
   - All sub-app headers, home screen application tiles, empty states, warning dialogs, format tiles, and sync badges must use clean SVG vector icons (1.8px–2px stroke widths).
   - `✨` (Sparkle) is reserved exclusively for the Home Dashboard header as the primary brand signature mark.

---

## 2. Color Palette & Roles

### 2.1 Light Theme (Default Canvas)

```css
:root {
  /* Brand Primary */
  --accent: #e60023;                 /* Pinterest Red */
  --accent-hover: #cc001f;
  --accent-active: #b3001b;
  --accent-on: #ffffff;

  /* Neutrals & Surfaces */
  --bg: #fafaf8;                     /* Warm Canvas */
  --surface: #ffffff;                /* Pure Surface */
  --surface-sand: #e5e5e0;           /* Warm Sand Gray */
  --surface-sand-hover: #dadad4;
  --surface-warm: #f6f6f3;
  --surface-warm-light: #e0e0d9;
  --surface-wash: hsla(60, 20%, 98%, 0.8);

  /* Typography */
  --fg: #211922;                     /* Plum Black */
  --fg-2: #33332e;
  --muted: #62625b;                  /* Olive Gray */
  --meta: #91918c;                   /* Warm Silver */
  --fg-inverse: #ffffff;             /* Inverse Text for Dark Highlights */

  /* Borders */
  --border: #e0e0d9;
  --border-soft: #ecece6;
  --border-strong: #91918c;
  --border-disabled: #c8c8c1;

  /* Interactive States */
  --focus-ring: 0 0 0 3px rgba(67, 94, 229, 0.2);
  --focus-blue: #435ee5;

  /* Semantic State Accents */
  --success: #103c25;                /* Forest Green */
  --success-light: #10b981;          /* Vibrant Emerald for Canvas / Dots */
  --success-surface: #edf7f0;
  --warning: #b25e00;                /* Warm Amber */
  --warning-surface: #fff8eb;
  --danger: #9e0a0a;                 /* Deep Ruby Red */
  --danger-light: #ef4444;           /* Vibrant Red for Canvas / Dots */
  --danger-surface: #fdf0f0;
}
```

### 2.2 Dark Theme (`[data-theme="dark"]`) & Accessibility

Dark mode is activated via `[data-theme="dark"]` on the root element (`<html>`). All active highlights and segmented controls dynamically switch text colors via `--fg-inverse` to maintain WCAG AAA contrast:

```css
[data-theme="dark"] {
  --bg: #111111;
  --surface: #1b1b1b;
  --surface-sand: #262626;
  --surface-sand-hover: #333333;
  --surface-warm: #222222;
  --surface-warm-light: #2c2c2c;

  --fg: #f5f5f5;
  --fg-2: #ffffff;
  --muted: #a3a3a3;
  --meta: #737373;
  --fg-inverse: #111111;             /* Dark text on bright active buttons */

  --border: #333333;
  --border-soft: #262626;
  --border-strong: #4d4d4d;
  --border-disabled: #3d3d3d;

  --success-surface: #0e2a1b;
  --success: #34d399;
  --success-light: #10b981;
  --danger-surface: #2d1214;
  --danger: #f87171;
  --danger-light: #ef4444;
}
```

---

## 3. Typography Hierarchy

Primary font stack:
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

| Role | Font Size | Weight | Line Height | Letter Spacing | Color | Use Case |
|------|-----------|--------|-------------|----------------|-------|----------|
| **Display Hero** | `48px–64px` | `700` | `1.1` | `-1.5px` | `var(--fg)` | Landing hero headlines |
| **Section Title** | `24px–28px` | `700` | `1.2` | `-0.8px` | `var(--fg)` | Screen titles, page headers |
| **Card Header** | `18px–20px` | `600` | `1.3` | `-0.4px` | `var(--fg)` | Panel and modal headers |
| **Body Primary** | `15px–16px` | `400` | `1.45` | `0` | `var(--fg)` | Main descriptions & content |
| **Caption Bold** | `13px–14px` | `600` | `1.4` | `0` | `var(--fg)` | Field labels, table headers |
| **Caption / Muted** | `12px–13px` | `400–500` | `1.4` | `0` | `var(--muted)` | Subtext, timestamps, hints |
| **Button Label** | `13px–14px` | `600` | `1.0` | `0` | Contextual | Button actions |

---

## 4. Navigation & Filter Panel Architecture

All sub-applications (Attendance, Classes, User Groups) share the unified **2-Row Filter Panel** (`.att-filter-panel`):

```html
<div class="att-filter-panel">
  <!-- Row 1: Segmented View Navigation Tabs -->
  <div class="filter-panel-row filter-row-top">
    <div class="filter-group-left">
      <div class="view-mode-segmented" role="tablist">
        <button type="button" class="segmented-btn active">Option 1</button>
        <button type="button" class="segmented-btn">Option 2</button>
      </div>
    </div>
  </div>

  <!-- Row 2: Contextual Controls (Date Nav / Weekday Pills) -->
  <div class="filter-panel-row filter-row-bottom">
    <!-- Centered / Horizontally scrollable items with scrollbars hidden -->
  </div>
</div>
```

### Scrollbar Hiding Standard
Horizontal pill rows (`.day-selector-pills`, `.view-mode-segmented`) must support swipe/touch without rendering visible scrollbars:
```css
.day-selector-pills {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}
.day-selector-pills::-webkit-scrollbar {
  display: none; /* WebKit */
}
```

---

## 5. Card Information Hierarchy & Structure

Program and Class cards (`.att-program-card`) adhere to a strict 3-tier vertical structure:

```
┌─────────────────────────────────────────────────────────────┐
│ Header: Title + Subtitle                  [ > Launch Button ]│
├─────────────────────────────────────────────────────────────┤
│ Meta Bar: [👥 Chip 1] • [Chip 2] • [Chip 3] (flex-wrap)     │
├─────────────────────────────────────────────────────────────┤
│ Footer: [Edit] [Delete]                   [Active Status /  │
│                                            Last Session Date]│
└─────────────────────────────────────────────────────────────┘
```

1. **Card Header (`.att-card-header`)**:
   - Contains clean title (`h3.att-card-title`) and descriptive subtitle.
   - Houses the full-red circular arrow button (`.btn-round-arrow`) for instant workspace launch.
2. **Card Metadata Bar (`.att-card-meta-bar`)**:
   - Positioned in the middle with `flex-wrap: wrap;` and clean dot dividers (`.att-meta-divider`).
   - Clean labels without redundant bracketed counts (e.g. `2 Groups`, `19 Subjects`, `56 Periods/Wk`).
3. **Card Footer (`.att-card-footer`)**:
   - `display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-soft);`
   - **Left**: Action buttons (`.btn-card-action`).
   - **Right**: `.att-meta-badge` (`Active`/`Inactive`) or `.att-card-footer-meta` (last updated/session date).

---

## 6. Workspace & Sub-App Patterns

### 6.1 Top Action Placement in Management Panes
In detail tabs (such as the User Groups tab in Class Workspace), assignment actions (e.g. Add Group dropdown + `+ Add Group` primary button) are positioned at the top directly below the header, preceding the list of assigned cards.

### 6.2 Multi-Group Linkage & Live Sync
- **Checklist Selector (`.cls-groups-checklist`)**: Interactive 16px radius checkbox items showing live group names.
- **Assigned Cards (`.cls-assigned-ug-card`)**: Surface background, 16px radius, with red-tinted sync avatar and `.btn-secondary.btn-sm` unlink button with chain-unlink vector SVG icon.

### 6.3 Modals & High-DPI Canvas Exports
- **Modal Geometry (`.modal-container`)**: `28px` border-radius (`var(--radius-xl)`), with `rgba(33, 25, 34, 0.45)` backdrop blur.
- **Export Option Tiles (`.btn-export-option`)**: Clean 16px rounded tiles with format-specific vector SVG icons.
- **Canvas Image Exports**: 2x DPR retina scaling (`dpr = 2`) with vibrant tokens (`--success-light`: `#10b981`, `--danger-light`: `#ef4444`).

---

## 7. Do's & Don'ts Checklist

- [x] **DO** use warm olive/sand undertones (`#e5e5e0`, `#e0e0d9`, `#91918c`) for secondary elements.
- [x] **DO** use Pinterest Red (`#e60023`) as the singular bold accent color.
- [x] **DO** use Plum Black (`#211922`) for readable, warm primary typography.
- [x] **DO** use `var(--fg-inverse)` on all active buttons to guarantee high contrast across light and dark modes.
- [x] **DO** use vector SVG icons across all sub-apps, tiles, dialogs, and format buttons.
- [x] **DO** reserve `✨` exclusively for the Home Dashboard header.
- [x] **DO** place card status pills (`Active`/`Inactive`) in the card footer to maintain consistent alignment with timestamps.
- [x] **DO** enforce standard `16px` border-radius on buttons, inputs, and checklist items.
- [ ] **DON'T** use system emojis in system warnings, sub-app headers, empty states, or format tiles.
- [ ] **DON'T** show redundant bracketed counts in metadata chips (keep copy crisp and minimal).
- [ ] **DON'T** use pill/capsule shapes on rectangle action buttons (keep radius strictly to 16px).
- [ ] **DON'T** nest cards within cards (avoid triple-nested container antipatterns).
- [ ] **DON'T** allow visible scrollbars on horizontal day and segmented pill containers.
