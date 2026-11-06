import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Draggable } from 'gsap/Draggable';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { buildScrollScenes } from './src/scroll-scenes';
import { bindCinematicPortrait } from './src/cinematic-hero';
import { buildJourney } from './src/journey';

gsap.registerPlugin(ScrollTrigger, Draggable);
gsap.ticker.lagSmoothing(0);

const root = document.documentElement;
ScrollTrigger.clearScrollMemory('manual');
const header = document.querySelector('#site-header');
const main = document.querySelector('main');
const menu = document.querySelector('#navigation-dialog');
const menuButton = document.querySelector('.menu-toggle');
const navLinks = [...document.querySelectorAll('.navigation a')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const wideScreen = matchMedia('(min-width: 1000px)');
const intro = document.querySelector('#intro-overlay');
let introActive = false;
let introEntering = false;
let cleanIntro = () => {};
let introVisual;
let motionEnabled = !reducedMotion.matches;
let animationContext;
let lenis;
let menuClosing = false;
let cleanPointerMotion = () => {};
let cleanScenes = () => {};
let viewerOpen = false;


document.querySelectorAll('.hero-title,[data-lines]').forEach(heading => {
  const label = heading.cloneNode(true);
  label.querySelectorAll('br').forEach(br => br.replaceWith(' '));
  const text = heading.matches('.hero-title') ? [...label.children].map(child => child.textContent).join(' ') : label.textContent;
  heading.setAttribute('aria-label', text.replace(/\s+/g, ' ').trim());
  const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    const fragment = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach(word => {
      if (!word.trim()) { fragment.append(document.createTextNode(word)); return; }
      const wrapper = document.createElement('span');
      wrapper.className = 'title-word';
      wrapper.setAttribute('aria-hidden', 'true');
      for (const character of word) {
        const glyph = document.createElement('span');
        glyph.className = 'title-glyph';
        if (heading.matches('.hero-title')) {
          const face = document.createElement('span');
          face.className = 'glyph-face';
          face.textContent = character;
          glyph.append(face);
        } else glyph.textContent = character;
        wrapper.append(glyph);
      }
      fragment.append(wrapper);
    });
    node.replaceWith(fragment);
  });
});

document.querySelectorAll('.rolling-link,.navigation a').forEach(link => {
  link.classList.add('rolling-link');
  if (!link.hasAttribute('aria-label')) link.setAttribute('aria-label', link.textContent.replace(/[↗↘]/g, '').trim());
  let label = link.firstElementChild;
  if (!label) {
    label = document.createElement('span');
    label.textContent = link.textContent;
    link.replaceChildren(label);
  }
  if (!label) return;
  const original = document.createElement('span');
  original.className = 'roll-original';
  [...label.textContent].forEach((character, index) => {
    const glyph = document.createElement('span');
    glyph.className = 'roll-character';
    glyph.style.setProperty('--char', index);
    glyph.textContent = character;
    original.append(glyph);
  });
  const echo = original.cloneNode(true);
  echo.className = 'link-echo';
  echo.setAttribute('aria-hidden', 'true');
  label.classList.add('roll-label');
  label.replaceChildren(original, echo);
});

function heroEntrance() {
  if (!motionEnabled || scrollY > 100 || location.hash && location.hash !== '#hero') return;
  gsap.fromTo('.hero-title .glyph-face', { yPercent: 115, rotation: 5 }, { yPercent: 0, rotation: 0, duration: 1.15, stagger: .025, ease: 'power4.out', clearProps: 'transform' });
}

function finishIntro() {
  if (!introActive || introEntering) return;
  introEntering = true;
  cleanIntro();
  let unlocked = false;
  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    introActive = false;
    document.querySelector('#intro-runway')?.remove();
    introVisual?.dispose();
    intro.remove();
    document.body.classList.remove('intro-active');
    // Keep the handoff locked briefly so a swipe crossing the flash cannot move the hero.
    const releaseScroll = () => {
      document.body.classList.remove('intro-transition');
      window.scrollTo({ top: 0, behavior: 'instant' });
      lenis?.scrollTo(0, { immediate: true, force: true });
    };
    if (motionEnabled) setTimeout(releaseScroll, 180);
    else releaseScroll();
    main.inert = false;
    header.inert = false;
    document.querySelector('.skip-link').inert = false;
    window.scrollTo({ top: 0, behavior: 'instant' });
    main.tabIndex = -1;
    main.focus({ preventScroll: true });
    applyMotion();
    heroEntrance();
    ScrollTrigger.refresh();
    updateNavigation();
  };
  if (!motionEnabled) return unlock();
  document.body.classList.add('intro-transition');
  const flash = document.querySelector('.intro-flash');
  gsap.timeline()
    .to(flash, { opacity: 1, duration: .18, ease: 'power2.in' })
    .call(() => {
      // Remove the intro's scroll distance once, while the flash covers the handoff.
      document.querySelector('#intro-runway')?.remove();
      window.scrollTo({ top: 0, behavior: 'instant' });
      gsap.set(['#intro-canvas', '.intro-copy', '.intro-scroll-cue'], { opacity: 0 });
      gsap.set(intro, { background: 'transparent' });
      document.body.classList.remove('intro-active');
    })
    .to(flash, { opacity: 0, duration: .6, ease: 'power2.out', onComplete: unlock });
}

function beginIntro() {
  if (location.hash || !motionEnabled) {
    intro.remove();
    heroEntrance();
    return;
  }
  introActive = true;
  intro.hidden = false;
  main.inert = true;
  header.inert = true;
  document.querySelector('.skip-link').inert = true;
  document.body.classList.add('intro-active');
  animationContext?.revert();
  cleanScenes();
  cleanPointerMotion();
  lenis?.destroy();
  lenis = null;
  gsap.ticker.remove(ticker);
  const runway = document.createElement('div');
  runway.id = 'intro-runway';
  runway.setAttribute('aria-hidden', 'true');
  document.body.prepend(runway);
  window.scrollTo({ top: 0, behavior: 'instant' });
  intro.focus({ preventScroll: true });
  const title = document.querySelector('#intro-title');
  const copy = document.querySelector('.intro-copy');
  const cue = document.querySelector('.intro-scroll-cue');
  const state = { distance: 0 };
  let letter = 0;
  let deleting = false;
  let typeTimer;
  let hasScrolled = false;
  function typeWelcome() {
    if (!introActive || introEntering || hasScrolled) return;
    const word = 'Welcome';
    letter += deleting ? -1 : 1;
    title.textContent = word.slice(0, letter) || '\u00a0';
    let delay = deleting ? 75 : 120;
    if (letter === word.length) { deleting = true; delay = 1500; }
    else if (letter === 0) { deleting = false; delay = 800; }
    typeTimer = setTimeout(typeWelcome, delay);
  }
  title.textContent = '\u00a0';
  typeTimer = setTimeout(typeWelcome, 250);
  function renderScroll() {
    const textProgress = Math.min(1, state.distance / (innerHeight * .75));
    const warpProgress = Math.max(0, Math.min(1, (state.distance - innerHeight * .75) / 3000));
    if (textProgress > .05 && !hasScrolled) {
      hasScrolled = true;
      clearTimeout(typeTimer);
      title.textContent = 'Welcome';
    } else if (textProgress <= .05 && hasScrolled) {
      hasScrolled = false;
      letter = 7;
      deleting = true;
      typeTimer = setTimeout(typeWelcome, 1500);
    }
    copy.style.opacity = String(1 - textProgress * textProgress);
    copy.style.filter = `blur(${textProgress * textProgress * 20}px)`;
    cue.style.opacity = String(Math.max(0, 1 - textProgress * 2));
    introVisual?.setProgress(warpProgress);
    if (warpProgress > .85) finishIntro();
  }
  function onScroll() {
    if (!introActive || introEntering) return;
    gsap.to(state, { distance: scrollY, duration: .9, ease: 'power1.out', overwrite: true, onUpdate: renderScroll });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  cleanIntro = () => {
    clearTimeout(typeTimer);
    window.removeEventListener('scroll', onScroll);
    gsap.killTweensOf(state);
  };
  import('./src/visuals.js').then(module => {
    if (introActive && !introEntering) introVisual = module.createIntro(document.querySelector('#intro-canvas'));
  }).catch(() => {});
}

function openMenu() {
  if (menu.open || menuClosing || introActive) return;
  lenis?.stop();
  menu.showModal();
  menuButton.setAttribute('aria-expanded', 'true');
  menuButton.setAttribute('aria-label', 'Close navigation menu');
  if (motionEnabled) {
    gsap.fromTo(menu, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: .55, ease: 'power4.inOut', clearProps: 'clipPath' });
    gsap.fromTo(navLinks, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: .6, stagger: .035, delay: .12, ease: 'power4.out', clearProps: 'transform,opacity' });
    gsap.fromTo('.menu-shot', { y: 70, opacity: 0 }, { y: 0, opacity: 1, duration: .9, stagger: .1, delay: .15, ease: 'power4.out', clearProps: 'transform,opacity' });
  }
  navLinks[0].focus({ preventScroll: true });
}

function closeMenu(restoreFocus = true) {
  if (!menu.open || menuClosing) return Promise.resolve();
  menuClosing = true;
  return new Promise(resolve => {
    const close = () => {
      menu.close();
      gsap.set(menu, { clearProps: 'clipPath' });
      menuClosing = false;
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open navigation menu');
      lenis?.start();
      if (restoreFocus) menuButton.focus({ preventScroll: true });
      resolve();
    };
    if (motionEnabled) gsap.to(menu, { clipPath: 'inset(0% 0% 100% 0%)', duration: .35, ease: 'power3.inOut', onComplete: close });
    else close();
  });
}
menuButton.addEventListener('click', openMenu);
document.querySelector('.menu-close').addEventListener('click', () => closeMenu());
menu.addEventListener('cancel', event => { event.preventDefault(); closeMenu(); });
document.addEventListener('keydown', event => {
  if (!introActive) return;
  if (event.key === 'Tab') {
    event.preventDefault();
    intro.focus({ preventScroll: true });
  }
});

async function navigateTo(hash, updateHistory = true) {
  const target = document.getElementById(hash.slice(1));
  if (!target) return;
  if (menu.open) await closeMenu(false);
  const heldScene = target.id === 'hero' ? ScrollTrigger.getById('hero-scene') : null;
  const destination = heldScene ? heldScene.start : target;
  const offset = heldScene || target.id === 'hero' ? 0 : -header.offsetHeight;
  if (updateHistory && location.hash !== hash) history.pushState(null, '', hash);
  if (lenis && motionEnabled) {
    lenis.resize();
    lenis.scrollTo(destination, { offset, duration: .8, force: true });
  } else {
    window.scrollTo({ top: Math.max(0, heldScene ? heldScene.start : target.getBoundingClientRect().top + scrollY + offset), behavior: 'instant' });
  }
}

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', event => {
    if (!document.getElementById(link.hash.slice(1))) return;
    event.preventDefault();
    navigateTo(link.hash);
  });
});
window.addEventListener('popstate', () => navigateTo(location.hash || '#hero', false));

const chapters = [...document.querySelectorAll('.chapter')];
let scrollQueued = false;
function updateNavigation() {
  const edge = header.offsetHeight / 2;
  const chapter = chapters.find(section => {
    const bounds = section.getBoundingClientRect();
    return bounds.top <= edge && bounds.bottom > edge;
  }) || chapters[0];
  header.dataset.theme = chapter.dataset.theme;
  navLinks.forEach(link => {
    if (link.hash === `#${chapter.id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  scrollQueued = false;
}
window.addEventListener('scroll', () => {
  if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateNavigation); }
}, { passive: true });
window.addEventListener('resize', updateNavigation);

let suppressPreviewUntil = 0;
const preview = document.querySelector('#preview-dialog');
let previewOpener;
let loadingViewer = false;
function setViewerOpen(open) {
  viewerOpen = open;
  main.inert = open;
  header.inert = open;
  if (open) lenis?.stop();
  else {
    lenis?.start();
    previewOpener?.focus({ preventScroll: true });
  }
}

document.querySelectorAll('[data-preview]').forEach(button => {
  button.addEventListener('click', async () => {
    if (performance.now() < suppressPreviewUntil || loadingViewer || viewerOpen) return;
    loadingViewer = true;
    previewOpener = button;
    button.setAttribute('aria-busy', 'true');
    try {
      const { openImageViewer } = await import('./src/image-viewer');
      setViewerOpen(true);
      openImageViewer(button, () => setViewerOpen(false));
    } catch {
      setViewerOpen(true);
      document.querySelector('#preview-image').src = button.dataset.preview;
      document.querySelector('#preview-image').alt = button.dataset.previewAlt;
      document.querySelector('#preview-title').textContent = button.dataset.previewTitle;
      preview.showModal();
    } finally {
      loadingViewer = false;
      button.removeAttribute('aria-busy');
    }
  });
});
document.querySelector('#preview-close').addEventListener('click', () => preview.close());
preview.addEventListener('click', event => {
  const bounds = preview.getBoundingClientRect();
  if (event.target === preview && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) preview.close();
});
preview.addEventListener('close', () => setViewerOpen(false));

document.querySelectorAll('[data-project-image]').forEach(button => {
  button.addEventListener('click', () => {
    const media = button.closest('.project-media');
    const image = media.querySelector('img');
    const opener = media.querySelector('[data-preview]');
    image.src = button.dataset.projectImage;
    image.alt = button.dataset.projectAlt;
    opener.dataset.preview = image.getAttribute('src');
    opener.dataset.previewAlt = image.alt;
    media.querySelectorAll('[data-project-image]').forEach(option => option.setAttribute('aria-pressed', String(option === button)));
    if (motionEnabled) gsap.fromTo(image, { opacity: .5 }, { opacity: 1, duration: .35, clearProps: 'opacity', overwrite: true });
  });
});

document.querySelectorAll('.project-build').forEach(details => {
  details.addEventListener('toggle', () => ScrollTrigger.refresh());
});

document.querySelectorAll('[data-stack-filter]').forEach(button => {
  button.addEventListener('click', () => {
    const filter = button.dataset.stackFilter;
    document.querySelectorAll('[data-stack-filter]').forEach(option => option.setAttribute('aria-pressed', String(option === button)));
    document.querySelectorAll('[data-stack-group]').forEach(group => { group.hidden = filter !== 'all' && filter !== group.dataset.stackGroup; });
    document.querySelector('#stack-status').textContent = filter === 'all' ? 'Showing all technologies.' : `Showing ${button.textContent} technologies.`;
    if (motionEnabled) gsap.fromTo('[data-stack-group]:not([hidden])', { y: 12, opacity: .4 }, { y: 0, opacity: 1, duration: .4, clearProps: 'transform,opacity', overwrite: true });
    ScrollTrigger.refresh();
  });
});
const ticker = time => lenis?.raf(time * 1000);

function pointerMotion() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return () => {};
  const cleanup = [];
  const targets = new Set();
  const listen = (element, name, handler) => {
    element.addEventListener(name, handler);
    cleanup.push(() => element.removeEventListener(name, handler));
  };
  const follow = (element, property, duration = .45) => {
    targets.add(element);
    return gsap.quickTo(element, property, { duration, ease: 'power3.out' });
  };
  document.querySelectorAll('.resume-link,.menu-toggle,.menu-close,.back-top,.contact-button').forEach(element => {
    let bounds;
    const x = follow(element, 'x');
    const y = follow(element, 'y');
    listen(element, 'pointerenter', () => { bounds = element.getBoundingClientRect(); });
    listen(element, 'pointermove', event => {
      if (!bounds) return;
      if (element.disabled) return;
      x((event.clientX - bounds.left - bounds.width / 2) * .2);
      y((event.clientY - bounds.top - bounds.height / 2) * .2);
    });
    listen(element, 'pointerleave', () => { x(0); y(0); });
  });
  document.querySelectorAll('.image-button').forEach(button => {
    const rx = follow(button, 'rotationX', .7);
    const ry = follow(button, 'rotationY', .7);
    listen(button, 'pointermove', event => {
      const bounds = button.getBoundingClientRect();
      const px = event.clientX - bounds.left;
      const py = event.clientY - bounds.top;
      rx((.5 - py / bounds.height) * 4);
      ry((px / bounds.width - .5) * 4);
    });
    listen(button, 'pointerleave', () => { rx(0); ry(0); });
  });
  document.querySelectorAll('.photo-open').forEach(button => {
    const x = follow(button, 'rotationX', .5), y = follow(button, 'rotationY', .5);
    const lift = button.matches('.moment-open') ? null : follow(button, 'y', .5);
    listen(button, 'pointermove', event => {
      if (button.classList.contains('is-dragging')) return;
      const bounds = button.getBoundingClientRect();
      x((.5 - (event.clientY - bounds.top) / bounds.height) * 6);
      y(((event.clientX - bounds.left) / bounds.width - .5) * 6);
      lift?.(-8);
    });
    listen(button, 'pointerleave', () => { x(0); y(0); lift?.(0); });
  });
  const photoDrags = Draggable.create('.moment-open', {
    type: 'x,y', dragClickables: true, minimumMovement: 8, zIndexBoost: false,
    bounds: { minX: -36, maxX: 36, minY: -28, maxY: 28 },
    onDragStart() { this.target.classList.add('is-dragging'); },
    onDrag() { suppressPreviewUntil = performance.now() + 400; },
    onDragEnd() {
      this.target.classList.remove('is-dragging');
      suppressPreviewUntil = performance.now() + 400;
      gsap.to(this.target, { x: 0, y: 0, duration: .75, ease: 'elastic.out(1,.5)' });
    },
  });
  document.querySelectorAll('.logo-list li').forEach(item => {
    const logo = item.querySelector('img');
    const x = follow(logo, 'x', .3), y = follow(logo, 'y', .3);
    listen(item, 'pointermove', event => {
      const bounds = item.getBoundingClientRect();
      x(((event.clientX - bounds.left) / bounds.width - .5) * 12);
      y(((event.clientY - bounds.top) / bounds.height - .5) * 12);
    });
    listen(item, 'pointerleave', () => { x(0); y(0); });
  });
  const shots = [...menu.querySelectorAll('.menu-shot')];
  shots.forEach(element => targets.add(element));
  navLinks.forEach((link, index) => {
    listen(link, 'pointerenter', () => gsap.to(shots, { x: (index % 2 ? 1 : -1) * 14, y: i => i ? -8 : 8, duration: .65, ease: 'power3.out', overwrite: 'auto' }));
    listen(link, 'pointerleave', () => gsap.to(shots, { x: 0, y: 0, duration: .65, ease: 'power3.out', overwrite: 'auto' }));
  });
  return () => {
    photoDrags.forEach(drag => { drag.target.classList.remove('is-dragging'); drag.kill(); });
    cleanup.forEach(remove => remove());
    gsap.killTweensOf([...targets]);
    gsap.set([...targets], { clearProps: 'transform' });
  };
}

function scrollChoreography() {
  const travel = () => Math.min(30, Math.max(0, parseFloat(getComputedStyle(document.querySelector('.about')).paddingLeft) - 16));
  const scrub = (trigger, start = 'top bottom', end = 'bottom top') => ({ trigger, start, end, scrub: .65, invalidateOnRefresh: true });
  gsap.fromTo('.about-photo', { clipPath: 'inset(12% 12% 12% 12%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: scrub('.about-photo', 'top 95%', 'top 45%') });
  gsap.fromTo('.about-photo img', { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: scrub('.about-photo', 'top 95%', 'top 45%') });
  document.querySelectorAll('.stack-group').forEach((group, index) => {
    gsap.fromTo(group.querySelector('h3'), { x: () => (index % 2 ? 1 : -1) * travel() }, { x: 0, ease: 'none', scrollTrigger: scrub(group, 'top 95%', 'top 55%') });
    gsap.fromTo(group.querySelectorAll('.logo-list li'), { y: 44, rotation: i => i % 2 ? 9 : -9, opacity: .4 }, { y: 0, rotation: 0, opacity: 1, stagger: .06, ease: 'none', scrollTrigger: scrub(group, 'top 95%', 'top 45%') });
  });
  document.querySelectorAll('.certification,.award').forEach(row => {
    gsap.fromTo(row, { y: 18, opacity: .45 }, { y: 0, opacity: 1, ease: 'none', scrollTrigger: scrub(row, 'top 99%', 'top 88%') });
  });
  gsap.fromTo('.contact-copy', { y: 44 }, { y: 0, ease: 'none', scrollTrigger: scrub('.contact-top', 'top 90%', 'top 40%') });
  gsap.fromTo('.contact-email', { x: () => -travel() }, { x: 0, ease: 'none', scrollTrigger: scrub('.contact-email', 'top 98%', 'top 65%') });
  gsap.fromTo('.contact-links', { y: 25 }, { y: 0, ease: 'none', scrollTrigger: scrub('.contact-links', 'top 98%', 'top 70%') });
}

function applyMotion() {
  motionEnabled = !reducedMotion.matches;
  animationContext?.revert();
  cleanScenes();
  cleanPointerMotion();
  lenis?.destroy();
  lenis = null;
  gsap.ticker.remove(ticker);
  root.dataset.motion = motionEnabled ? 'on' : 'off';
  if (!motionEnabled) { if (introActive) finishIntro(); return; }
  if (introActive) return;
  if (!matchMedia('(pointer: coarse)').matches) {
    lenis = new Lenis({ lerp: .12, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(ticker);
    if (introActive || menu.open || viewerOpen) lenis.stop();
  }
  animationContext = gsap.context(() => {
    cleanScenes = buildScrollScenes();
    buildJourney();
    document.querySelectorAll('[data-lines]').forEach(element => {
      if (element.getBoundingClientRect().top < innerHeight * .9) return;
      gsap.from(element.querySelectorAll('.title-glyph'), { yPercent: 110, rotation: 3, stagger: .025, ease: 'none', scrollTrigger: { trigger: element, start: 'top 92%', end: 'top 48%', scrub: .6 } });
    });
    document.querySelectorAll('[data-reveal]:not(.certification):not(.award),.stack-group').forEach(element => {
      if (element.getBoundingClientRect().top < innerHeight * .9) return;
      const row = element.matches('.certification,.award,.training li');
      gsap.from(element, { y: row ? 36 : 24, opacity: .5, duration: row ? 1 : .8, ease: 'power4.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: element, start: 'top 94%', once: true } });
    });
    const words = document.querySelectorAll('.ink-word');
    gsap.fromTo(words, { opacity: .45 }, { opacity: 1, stagger: .05, ease: 'none', scrollTrigger: { trigger: '.about-statement', start: 'top 90%', end: 'bottom 45%', scrub: true } });
    document.querySelectorAll('.project-panel').forEach(panel => {
      gsap.from(panel, { y: 24, opacity: .6, duration: .8, ease: 'power3.out', clearProps: 'transform,opacity',
        scrollTrigger: { trigger: panel, start: 'top 94%', once: true },
      });
      gsap.fromTo(panel.querySelector('.image-button'), { clipPath: 'inset(5% 0% 5% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
        scrollTrigger: { trigger: panel.querySelector('.project-media'), start: 'top 94%', end: 'top 40%', scrub: .6 },
      });
    });
    scrollChoreography();
    gsap.fromTo('.footer-wordmark', { yPercent: 30 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top 80%', end: 'bottom bottom', scrub: true } });
  });
  cleanPointerMotion = pointerMotion();
}
const ink = document.querySelector('[data-ink]');
ink.replaceChildren(...ink.textContent.split(' ').flatMap((word, i) => {
  const span = document.createElement('span');
  span.className = 'ink-word';
  span.textContent = word;
  return i ? [document.createTextNode(' '), span] : [span];
}));
reducedMotion.addEventListener('change', applyMotion);
wideScreen.addEventListener('change', applyMotion);
document.querySelector('#year').textContent = new Date().getFullYear();
bindCinematicPortrait();
applyMotion();
updateNavigation();
beginIntro();
const pageLoaded = document.readyState === 'complete' ? Promise.resolve() : new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
Promise.all([document.fonts.ready, pageLoaded]).then(() => {
  ScrollTrigger.refresh();
  if (location.hash && !introActive) navigateTo(location.hash, false);
});

if (import.meta.env.DEV) {
  import('web-vitals').then(({ onCLS, onINP, onLCP }) => {
    const report = metric => console.debug(`[${metric.name}]`, metric.value, metric.rating);
    [onCLS, onINP, onLCP].forEach(observe => observe(report));
  });
}
