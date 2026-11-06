import { gsap } from 'gsap';

export function buildPhotoScene() {
  document.querySelectorAll('.moment-card').forEach(card => {
    gsap.from(card, { y: 32, opacity: .5, duration: .75, ease: 'power3.out', clearProps: 'transform,opacity',
      scrollTrigger: { trigger: card, start: 'top 95%', once: true },
    });
  });
}
