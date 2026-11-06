import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function buildJourney() {
  const stops = [...document.querySelectorAll('.timeline-stop')];
  const year = document.querySelector('.journey-year');
  const activate = stop => {
    stops.forEach(item => item.classList.toggle('is-current', item === stop));
    year.textContent = stop.dataset.year;
  };
  stops.forEach(stop => {
    ScrollTrigger.create({ trigger: stop, start: 'top 58%', end: 'bottom 58%',
      onEnter: () => activate(stop), onEnterBack: () => activate(stop),
    });
    gsap.from(stop, { y: 24, opacity: .65, duration: .7, clearProps: 'transform,opacity',
      scrollTrigger: { trigger: stop, start: 'top 94%', once: true },
    });
  });
}
