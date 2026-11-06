export function bindCinematicPortrait() {
  const stage = document.querySelector('.hero-stage');
  const portrait = stage.querySelector('.hero-portrait');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let fluid, loading, pointer;
  const selected = () => portrait.matches(':focus-visible') || portrait.getAttribute('aria-pressed') === 'true';
  const sync = () => {
    stage.classList.toggle('portrait-selected', selected());
    fluid?.setEnabled(fine.matches && !reduced.matches && !selected());
  };
  stage.addEventListener('pointermove', event => {
    if (!fine.matches || reduced.matches || event.pointerType === 'touch' || selected()) return;
    pointer = { clientX: event.clientX, clientY: event.clientY };
    if (fluid) return fluid.move(pointer);
    if (loading) return;
    loading = import('./fluid-reveal').then(async ({ createFluidReveal }) => {
      fluid = await createFluidReveal(stage, portrait);
      if (!fluid) stage.classList.add('portrait-static');
      sync();
      if (pointer) fluid?.move(pointer);
    }).catch(() => stage.classList.add('portrait-static'));
  });
  const leave = () => { pointer = null; fluid?.leave(); };
  stage.addEventListener('pointerleave', leave);
  window.addEventListener('blur', leave);
  portrait.addEventListener('focus', sync);
  portrait.addEventListener('blur', sync);
  portrait.addEventListener('click', () => {
    portrait.setAttribute('aria-pressed', String(portrait.getAttribute('aria-pressed') !== 'true'));
    sync();
  });
  reduced.addEventListener('change', sync);
  fine.addEventListener('change', sync);
}
