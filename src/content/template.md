---
title: "Building High-Performance Reactive Portfolios with Svelte 5 Runes"
date: "2026-09-05"
description: "Exploring Svelte 5's fine-grained reactivity using $state, $derived, and custom actions to build interactive, zero-overhead developer portfolios."
cover: "/ProjectPictures/BeenHereBefore.png"
tags: ["Svelte 5", "Web Development", "TypeScript", "TailwindCSS"]
author: "Lloyd Nicolas"
---

Migrating to Svelte 5 with **Runes** completely transforms how state synchronization works in modern web applications. The transition from legacy `let` declarations and `$:` reactive statements to `$state`, `$derived`, and `$effect` brings universal clarity to state lifecycle.

## Why Runes Matter

In older Svelte versions, reactivity was tightly bound to `.svelte` component files. With Svelte 5 runes, reactivity is decoupled and can exist inside plain `.svelte.ts` modules.

```typescript
// Shared global state across audio, game mode, and navigation
export const gameDevMode = $state({
    active: false,
    fedCount: 0,
    easterEggUnlocked: false
});

export function feedDuck() {
    gameDevMode.fedCount += 1;
    if (gameDevMode.fedCount >= 5) {
        gameDevMode.active = true;
    }
    return gameDevMode.fedCount;
}
```

## Performance & Static Generation

Using `@sveltejs/adapter-static`, all routes are pre-rendered into pure, static HTML and minimal client-side hydration chunks. This results in:
- **Instant First Contentful Paint (FCP)** under 0.2s
- **Zero server costs** hosted on GitHub Pages or static CDN
- **Full SEO & OpenGraph compliance** out of the box

Combining this with custom scroll-reveal actions yields a portfolio that feels as responsive and playful as a native desktop application.
