import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function buildJourney() {
  const stops = [...document.querySelectorAll('.timeline-stop')];
  const year = document.querySelector('.journey-year');
  const activate = stop => {
    stops.forEach(item => item.classList.toggle('is-current', item === stop));
    if (year.textContent !== stop.dataset.year) {
      year.textContent = stop.dataset.year;
      gsap.fromTo(year, { y: 12, opacity: .35 }, { y: 0, opacity: 1, duration: .4, clearProps: 'transform,opacity', overwrite: true });
    }
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
