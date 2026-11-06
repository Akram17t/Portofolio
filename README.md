# Nashiruddin Akram — Portfolio

Personal portfolio at https://nakram.space, built with Vite, JavaScript, GSAP, Lenis and Three.js.

## Development

```sh
npm ci
npm run dev
```

The active entry files are the root `index.html`, `main.js` and `style.css`. The interactive hero, photo album, timeline and entrance modules are in `src/`. Website images, local fonts, logos and the downloadable CV are in `public/`.

## Publish to GitHub Pages

```sh
npm run deploy
```

This builds `dist/` and publishes it to the `gh-pages` branch through a temporary clone. GitHub Pages serves that branch. Git authentication and access to this repository are required. No extra deployment dependency or token file is needed.

To update the source, commit and push changes to `main`, then run `npm run deploy` to publish the new build. `public/CNAME` retains the custom domain, and `public/.nojekyll` serves the built files without Jekyll processing.

## Assets

Photographs and portfolio content belong to their respective owners. The portrait cutout was extracted from an owner-supplied image. Local font licences and image/logo references are included in `public/fonts/` and `public/asset-credits.txt`. No image or source code from the visual reference sites is included.
