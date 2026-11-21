import { animateElement, motionPreference } from './motion';

export function initServices() {
  const details = [...document.querySelectorAll<HTMLDetailsElement>('[data-service]')];
  if (typeof Element.prototype.animate !== 'function') return;
  const states = new Map<HTMLDetailsElement, { open: boolean; animation?: Animation }>();

  function setOpen(detail: HTMLDetailsElement, open: boolean) {
    const summary = detail.querySelector('summary');
    const state = states.get(detail);
    if (!summary || !state) return;
    const startHeight = detail.getBoundingClientRect().height;
    state.animation?.cancel();
    state.animation = undefined;
    state.open = open;
    summary.setAttribute('aria-expanded', String(open));
    if (motionPreference.matches) {
      detail.open = open;
      detail.style.height = '';
      delete detail.dataset.animating;
      return;
    }

    // Measure the actual end state; no hard-coded max-height or delayed content popping.
    detail.style.height = '';
    detail.open = open;
    const endHeight = detail.getBoundingClientRect().height;
    detail.open = true;
    detail.dataset.animating = '';
    detail.style.height = `${startHeight}px`;
    const animation = animateElement(detail, [{ height: `${startHeight}px` }, { height: `${endHeight}px` }], {
      duration: 460, fill: 'both',
    });
    if (!animation) {
      detail.open = open;
      detail.style.height = '';
      delete detail.dataset.animating;
      return;
    }
    state.animation = animation;
    animation.onfinish = () => {
      if (state.animation !== animation) return;
      detail.open = state.open;
      detail.style.height = '';
      delete detail.dataset.animating;
      state.animation = undefined;
      animation.cancel();
    };
  }

  details.forEach((detail) => {
    states.set(detail, { open: detail.open });
    const summary = detail.querySelector('summary');
    summary?.setAttribute('aria-expanded', String(detail.open));
    summary?.addEventListener('click', (event) => {
      event.preventDefault();
      const opening = !states.get(detail)?.open;
      if (opening) details.forEach((other) => {
        if (other !== detail && states.get(other)?.open) setOpen(other, false);
      });
      setOpen(detail, opening);
    });
  });

  document.querySelectorAll<HTMLAnchorElement>('[data-orbit-link]').forEach((link) => {
    link.addEventListener('click', () => {
      const target = details.find((detail) => detail.id === link.hash.slice(1));
      if (!target || states.get(target)?.open) return;
      details.forEach((detail) => { if (detail !== target && states.get(detail)?.open) setOpen(detail, false); });
      setOpen(target, true);
    });
  });
}
