import { gsap } from 'gsap';
import { buildPhotoScene } from './photo-scene';

export function buildScrollScenes() {
  const hero = document.querySelector('#hero');
  const media = gsap.matchMedia();
  media.add('(min-height: 700px)', () => {
  gsap.timeline({ scrollTrigger: {
    id: 'hero-scene', trigger: hero, start: 'top top', refreshPriority: 10,
    end: () => `+=${Math.max(innerHeight * 1.2, 700)}`,
    pin: hero.querySelector('.hero-stage'), scrub: .6, anticipatePin: 1, invalidateOnRefresh: true,
  } }).to({}, { duration: .2 })
    .to('.name-top .title-glyph', { yPercent: -120, opacity: 0, stagger: { amount: .3 }, duration: .65, ease: 'power2.inOut' }, .2)
    .to('.name-bottom .title-glyph', { yPercent: 120, opacity: 0, stagger: { amount: .25, from: 'end' }, duration: .65, ease: 'power2.inOut' }, .35)
    .to('.hero-portrait', { yPercent: -5, scale: 1.06, duration: 1.05, ease: 'power2.inOut' }, .35)
    .to({}, { duration: .25 });
  });
  buildPhotoScene();
  return () => media.revert();
}
