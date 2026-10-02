# Habit Streak Tracker

A local-first, privacy-friendly habit tracking web app. Track daily habits, build streaks, visualize weekly progress, and export your data as CSV — all stored locally in your browser.

## Features

- **Dashboard** — Active-habit count, 7-day completion charts per habit, weekly completion rate, and best-streak badges
- **Calendar check-in** — Flip through days and toggle each habit: complete (✓) → partial (½) → missed
- **Streak engine** — Automatic current-streak and best-streak calculation (partials keep the streak alive)
- **Statistics tab** — Per-habit totals: current streak, best streak, completed and partial counts
- **CSV export** — One-tap download of all habit entries (`habit_tracker_export.csv`)
- **Add / edit / delete habits** — Custom names with auto-assigned colors
- **100% local** — Data persists in `localStorage`; no account, no server, no tracking

## Tech Stack

- React 18 (single component, hooks)
- Tailwind CSS (via CDN in the deployed build)
- lucide-react icons
- Vanilla JS + Babel standalone for the static deployment
- localStorage for persistence

## Quick Start

The app is fully static. Serve the repo root with any static server:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then open `http://localhost:8000` (or `http://localhost:8000/index.html`).

## Project Structure

```
.
├── index.html            # Deployable single-file build (React + Babel + Tailwind CDN)
├── habit-tracker-app.tsx # Source component (React JSX, hooks + localStorage logic)
├── README.md
└── LICENSE
```

`index.html` is generated from `habit-tracker-app.tsx` by inlining the component into a Babel-standalone page; lucide icons are replaced with inline SVG stubs so no bundler is required.

## Data Model

Habits live under the `habits` key in `localStorage`:

```json
[{ "id": "1", "name": "Exercise", "entries": {"2026-10-01": true}, "streak": 3, "bestStreak": 9, "color": "#FF5733" }]
```

`entries` maps `YYYY-MM-DD` → `true` (completed) | `0.5` (partial). Missing key = missed.

## Deploy Notes

Fully static — deploy to GitHub Pages, Cloudflare Pages, Netlify, or any static host by serving the repo root. No environment variables, no build step required.

## Roadmap Ideas

- Dark mode toggle
- Weekly/monthly heatmap view
- JSON import (complementing CSV export)
- Reminder notifications (Web Notification API)

---

Built by Girish Lade — https://ladestack.in
