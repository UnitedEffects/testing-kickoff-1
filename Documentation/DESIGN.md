# Design System Documentation

This document outlines the styling system configuration and patterns for the project.

**IMPORTANT**: Tailwind CSS v4 is a reference implementation. Projects can use any styling solution (CSS Modules, styled-components, Emotion, vanilla CSS, etc.). If using a different approach, adapt these patterns accordingly.

---

## 1. Tailwind v4 Setup

### Base Configuration

```css
/* src/app/globals.css */
@import 'tailwindcss';
@plugin '@tailwindcss/typography';

/* Configure Tailwind v4 theme */
@theme {
  /* Custom colors */
  --color-primary: #154abd;
  --color-secondary: #62dbdd;
  --color-accent: #ff1b8d;
  --color-success: #10b981;
  --color-error: #ef4444;
}
```

**PostCSS configuration:**
```javascript
// postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

**No tailwind.config.js needed** - Tailwind v4 uses `@theme` block in CSS.

---

## 2. PostCSS Configuration

```javascript
// postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

---

## 3. @theme Block for Custom Colors

```css
@theme {
  --color-primary: #154abd;
  --color-secondary: #62dbdd;
  --color-accent: #ff1b8d;
  --color-dark: #000000;
  --color-light: #f8f9fa;
}
```

### Usage in Components

```tsx
<div className="bg-primary text-white">Primary color</div>
<div className="bg-secondary text-dark">Secondary color</div>
```

---

## 4. Reusable Button Classes

```css
/* src/app/globals.css */
.btn-primary {
  @apply inline-block bg-primary text-white border-2 border-primary px-6 py-2 font-semibold hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 rounded-xl;
}

.btn-secondary {
  @apply inline-block bg-transparent text-primary border-2 border-primary px-6 py-2 font-semibold hover:bg-primary hover:text-white hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 rounded-xl;
}

.btn-tertiary {
  @apply inline-flex items-center px-6 py-2 text-primary font-semibold hover:text-primary/80 transition-all duration-200;
}
```

### Usage

```tsx
<button className="btn-primary">Primary Button</button>
<button className="btn-secondary">Secondary Button</button>
<button className="btn-tertiary">Tertiary Button</button>
```

---

## 5. Custom Animations

```css
/* src/app/globals.css */

/* Spin animation */
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}

/* Scroll animation */
@keyframes scroll-left {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.animate-scroll-left {
  animation: scroll-left 30s linear infinite;
  will-change: transform;
}

/* Fade in */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-in;
}
```

---

## 6. NO CSS Modules Policy

**DO NOT create CSS modules:**

```typescript
// WRONG
import styles from './Button.module.css'
```

**Use Tailwind classes instead:**

```typescript
// CORRECT
<button className="px-4 py-2 bg-primary text-white rounded-lg">
  Click me
</button>
```

---

## 7. Icon Standards

### Primary Icons (@heroicons/react)

```typescript
import { ChevronRightIcon, UserIcon, HomeIcon } from '@heroicons/react/24/outline'

export function MyComponent() {
  return (
    <div>
      <HomeIcon className="w-6 h-6 text-primary" />
      <UserIcon className="w-5 h-5" />
    </div>
  )
}
```

### Social Icons (react-icons)

```typescript
import { FaTwitter, FaGithub, FaLinkedin } from 'react-icons/fa6'

export function SocialLinks() {
  return (
    <div className="flex gap-4">
      <FaTwitter className="w-6 h-6" />
      <FaGithub className="w-6 h-6" />
      <FaLinkedin className="w-6 h-6" />
    </div>
  )
}
```

### Never Use Emoji Icons

```typescript
// WRONG
<span>📧</span>
<span>🏠</span>

// CORRECT
<EnvelopeIcon className="w-6 h-6" />
<HomeIcon className="w-6 h-6" />
```

---

## Color Palette Reference

| Color Variable | Hex Value | Usage |
|---------------|-----------|-------|
| `--color-primary` | `#154abd` | Primary brand color, buttons, links |
| `--color-secondary` | `#62dbdd` | Secondary brand color, accents |
| `--color-accent` | `#ff1b8d` | Accent color, highlights |
| `--color-success` | `#10b981` | Success states, confirmations |
| `--color-error` | `#ef4444` | Error states, warnings |
| `--color-dark` | `#000000` | Dark text, backgrounds |
| `--color-light` | `#f8f9fa` | Light backgrounds, surfaces |

---

## Best Practices

1. **Use Tailwind utility classes** for all styling needs
2. **Define custom colors** in the `@theme` block
3. **Create reusable button classes** for consistent UI
4. **Use custom animations** sparingly and purposefully
5. **Never use CSS Modules** - stick to Tailwind utilities
6. **Use proper icon libraries** - never use emoji as icons
7. **Keep styling close to components** - inline Tailwind classes preferred
8. **Maintain consistency** across the application
