import { gsap } from 'gsap';

export function buildPhotoScene() {
  document.querySelectorAll('.moment-card').forEach((card, index) => {
    gsap.from(card, { y: 36, rotation: index % 2 ? 4 : -4, opacity: .5, duration: .85, ease: 'power3.out', clearProps: 'transform,opacity',
      scrollTrigger: { trigger: card, start: 'top 95%', once: true },
    });
  });
}
