# Gautam's Portfolio

Personal portfolio and blog — live at [lonepo.github.io](https://lonepo.github.io)

Built with plain HTML, CSS, and JavaScript. No frameworks, no build step, no nonsense.

## Stack

- **HTML/CSS/JS** — pure, no dependencies
- **GSAP + ScrollTrigger** — scroll animations (CDN)
- **Canvas API** — animated circuit board background
- **Google Fonts** — Outfit + JetBrains Mono

## Structure

```
/
├── index.html          ← Main portfolio page
├── blog/
│   ├── index.html      ← Blog listing
│   └── first-blog.html ← First post (add more here)
├── styles/
│   ├── global.css      ← CSS variables, theme, reset
│   ├── components.css  ← All component styles
│   └── blog.css        ← Blog-specific styles
├── scripts/
│   └── main.js         ← Animations, theme, nav, canvas
└── .github/workflows/
    └── deploy.yml      ← Auto-deploy to GitHub Pages
```

## Adding a Blog Post

1. Copy `blog/first-blog.html` → `blog/your-post-slug.html`
2. Update the title, date, meta, and content
3. Add a card for it in `blog/index.html`
4. Add a card in the `#blog` section of `index.html` (latest 3 only)
5. Commit and push — deploy is automatic

## Theme

Dark by default. Toggle in the top-right corner. Preference saved to `localStorage`.

## Deployment

Pushes to `main` auto-deploy via GitHub Actions → GitHub Pages.
