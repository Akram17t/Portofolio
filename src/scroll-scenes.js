import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { buildPhotoScene } from './photo-scene';

export function buildScrollScenes({ wideScreen, updateTimeline }) {
  let cleanPhotos = () => {};
  const hero = document.querySelector('#hero');
  const heroStage = hero.querySelector('.hero-stage');
  const heroTimeline = gsap.timeline({
    scrollTrigger: {
      id: 'hero-scene', trigger: hero, start: 'top top',
      end: () => `+=${Math.max(innerHeight * 1.6, 950)}`,
      pin: heroStage, scrub: .65, anticipatePin: 1, invalidateOnRefresh: true,
    },
  });
  heroTimeline.to({}, { duration: .2 })
    .to('.name-top .title-glyph', { yPercent: -120, opacity: 0, stagger: { amount: .3 }, duration: .65, ease: 'power2.inOut' }, .2)
    .to('.name-bottom .title-glyph', { yPercent: 120, opacity: 0, stagger: { amount: .25, from: 'end' }, duration: .65, ease: 'power2.inOut' }, .35)
    .to('.hero-portrait', { yPercent: -5, scale: 1.08, duration: 1.05, ease: 'power2.inOut' }, .35)
    .to({}, { duration: .45 });

  const journey = document.querySelector('#experience');
  const viewport = journey.querySelector('.timeline-viewport');
  const track = journey.querySelector('.timeline-track');
  let drag;
  if (wideScreen) {
    journey.classList.add('timeline-pinned');
    viewport.scrollLeft = 0;
    const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
    gsap.to(track, {
      x: () => -distance(), ease: 'none',
      scrollTrigger: {
        id: 'journey-scene', trigger: journey, start: 'top top',
        end: () => `+=${Math.max(innerHeight * 1.25, distance())}`,
        pin: journey.querySelector('.timeline-stage'), scrub: .65,
        anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: self => updateTimeline(self.progress),
      },
    });
    cleanPhotos = buildPhotoScene(wideScreen);
    const down = event => {
      if (event.button !== 0 || event.target.closest('a,button')) return;
      const scene = ScrollTrigger.getById('journey-scene');
      drag = { x: event.clientX, progress: scene.progress };
      viewport.setPointerCapture(event.pointerId);
      viewport.classList.add('is-dragging');
    };
    const move = event => {
      if (!drag) return;
      const scene = ScrollTrigger.getById('journey-scene');
      const progress = gsap.utils.clamp(0, 1, drag.progress + (drag.x - event.clientX) / distance());
      const target = scene.start + progress * (scene.end - scene.start);
      window.dispatchEvent(new CustomEvent('timeline-drag', { detail: target }));
    };
    const up = () => { drag = null; viewport.classList.remove('is-dragging'); };
    viewport.addEventListener('pointerdown', down);
    viewport.addEventListener('pointermove', move);
    viewport.addEventListener('pointerup', up);
    viewport.addEventListener('pointercancel', up);
    return () => {
      cleanPhotos();
      up(); journey.classList.remove('timeline-pinned');
      viewport.removeEventListener('pointerdown', down);
      viewport.removeEventListener('pointermove', move);
      viewport.removeEventListener('pointerup', up);
      viewport.removeEventListener('pointercancel', up);
      updateTimeline(0);
    };
  }
  return cleanPhotos;
}
