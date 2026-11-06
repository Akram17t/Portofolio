# Nashiruddin Akram — Portfolio

Personal portfolio at https://nakram.space, built with Vite, JavaScript, GSAP, Lenis and Three.js.

## Development

```sh
npm ci
npm run dev
```

The active entry files are the root `index.html`, `main.js` and `style.css`. The hero, photo album, vertical journey and entrance modules are in `src/`; `layout.css` and `work-journey.css` hold the current layout. Website images, local fonts, logos and the downloadable CV are in `public/`.

Selected Work displays all seven projects as compact alternating rows: text on the left and screenshot on the right, then reversed for the next project. Phones stack the screenshot above its description. Every project has source links and expandable build details with documented contributions. Journey uses a sticky year and scroll-activated milestones, with normal vertical scrolling on every device. Reduced motion keeps all content readable without pinned scenes or animated reveals. The entrance scroll distance is half the previous version.

PhotoSwipe loads on the first image click and supplies zoom, pan, keyboard navigation and touch swiping. A native image dialog remains available if its chunk fails to load. Desktop Moments photos can be dragged within a small range and spring back; reduced motion and touch keep the normal photo buttons. Three.js loads only for the entrance or the desktop fluid effect.

Each project enters with a masked screenshot and staggered description. About, credentials, Toolkit, Memories and Contact have section-specific reveals; Journey keeps its active milestones and transitions between years. The email's rolling-letter interaction also appears on project titles, source links, text links and Toolkit filters/headings. Hover replacements share the original baseline, including the footer social links. All movement respects reduced motion.

Development builds report Core Web Vitals in the browser's debug console through `web-vitals`; no visitor data is transmitted. Production builds omit this instrumentation.

## Verify the UI

Build and run `npm run preview -- --host 127.0.0.1` in another terminal, then:

```sh
npx --yes --package @playwright/cli playwright-cli -s=portfolio-check open http://127.0.0.1:4173/#hero
npx --yes --package @playwright/cli playwright-cli -s=portfolio-check run-code --filename scripts/verify-ui.js
npx --yes --package @playwright/cli playwright-cli -s=portfolio-check run-code --filename scripts/verify-motion.js
```

The checks cover all seven visible projects, section order, journey activation, removed hero copy/stats, photo dragging and zoom, keyboard/focus restoration, touch swiping, reduced motion, responsive layout, GPU resizing, and the native viewer fallback.

## Publish to GitHub Pages

```sh
npm run deploy
```

This builds `dist/` and publishes it to the `gh-pages` branch through a temporary clone. GitHub Pages serves that branch. Git authentication and access to this repository are required. No extra deployment dependency or token file is needed.

To update the source, commit and push changes to `main`, then run `npm run deploy` to publish the new build. `public/CNAME` retains the custom domain, and `public/.nojekyll` serves the built files without Jekyll processing.

## Assets

Photographs and portfolio content belong to their respective owners. The portrait cutout was extracted from an owner-supplied image. Local font licences and image/logo references are included in `public/fonts/` and `public/asset-credits.txt`. No image or source code from the visual reference sites is included.
