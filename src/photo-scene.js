import { gsap } from 'gsap';

export function buildPhotoScene(wideScreen) {
  if (!wideScreen) return () => {};
  const section = document.querySelector('#moments');
  const wall = section.querySelector('.moment-wall');
  const cards = [...wall.querySelectorAll('.moment-card')];
  section.classList.add('moments-pinned');
  gsap.timeline({
    scrollTrigger: {
      id: 'moments-scene', trigger: section, start: 'top top',
      end: () => `+=${Math.max(900, innerHeight * 1.35)}`,
      pin: section.querySelector('.moments-stage'), scrub: .55,
      anticipatePin: 1, invalidateOnRefresh: true,
    },
  })
    .fromTo(cards, {
      x: (_, card) => wall.clientWidth / 2 - card.offsetLeft - card.offsetWidth / 2,
      y: (_, card) => wall.clientHeight / 2 - card.offsetTop - card.offsetHeight / 2,
      rotation: index => (index % 2 ? 1 : -1) * (4 + index), scale: .92,
    }, {
      x: 0, y: 0, rotation: (_, card) => parseFloat(getComputedStyle(card).getPropertyValue('--tilt')),
      scale: 1, stagger: { amount: .28, from: 'edges' }, duration: 1.1, ease: 'power2.inOut',
    }, .12)
    .fromTo('.moment-caption', { opacity: 0 }, { opacity: 1, duration: .18 }, 1.28)
    .to({}, { duration: .3 });
  return () => section.classList.remove('moments-pinned');
}
