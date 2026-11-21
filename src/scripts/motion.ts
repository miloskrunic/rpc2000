import { readLayoutViewport } from './viewport';

export const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
export const motionEase = 'cubic-bezier(0.22, 1, 0.36, 1)';
const activeAnimations = new Set<Animation>();

export function animateElement(element: Element, frames: Keyframe[], options: KeyframeAnimationOptions): Animation | undefined {
  if (motionPreference.matches || typeof element.animate !== 'function') return;
  const animation = element.animate(frames, { easing: motionEase, ...options });
  activeAnimations.add(animation);
  animation.addEventListener('finish', () => activeAnimations.delete(animation), { once: true });
  animation.addEventListener('cancel', () => activeAnimations.delete(animation), { once: true });
  return animation;
}

export function initMotion() {
  const pendingElements = new Set<HTMLElement>();
  let revealObserver: IntersectionObserver | undefined;

  function restoreContent() {
    pendingElements.forEach((element) => delete element.dataset.motionState);
    pendingElements.clear();
  }

  if (motionPreference.matches || typeof Element.prototype.animate !== 'function') {
    restoreContent();
    return;
  }

  if ('IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const element = entry.target as HTMLElement;
        if (!entry.isIntersecting) {
          // IO supplies geometry after layout. Only prepare content confirmed below the screen.
          if (entry.boundingClientRect.top >= window.innerHeight) {
            element.dataset.motionState = 'waiting';
            pendingElements.add(element);
          }
          return;
        }
        revealObserver?.unobserve(element);
        // Initial visible entries never disappear or replay, including restored scroll positions.
        if (!pendingElements.has(element)) return;
        pendingElements.delete(element);
        // The visible state is the base style. Animation only temporarily layers over it.
        delete element.dataset.motionState;
        if (entry.boundingClientRect.bottom <= 0) return;
        const media = element.dataset.reveal === 'media';
        animateElement(element, [
          { opacity: 0, transform: media ? 'none' : 'translate3d(0, 26px, 0)' },
          { opacity: 1, transform: 'none' },
        ], {
          duration: media ? 1000 : 780,
          delay: Math.min(Number(element.dataset.revealDelay) || 0, 160),
          fill: 'backwards',
        });
      });
    }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });

    document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((element) => revealObserver?.observe(element));
  }

  function intro() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (window.scrollY > 80 || location.hash || motionPreference.matches || navigation?.type === 'back_forward') return;
    document.querySelectorAll<HTMLElement>('[data-intro-line]').forEach((line, index) => {
      animateElement(line, [
        { transform: 'translate3d(0, 12px, 0)' },
        { transform: 'translate3d(0, 0, 0)' },
      ], { duration: 850, delay: index * 70, fill: 'backwards' });
    });
    const timing: Record<string, number> = { eyebrow: 0, description: 180, actions: 240, bottom: 300 };
    document.querySelectorAll<HTMLElement>('[data-intro]').forEach((element) => {
      animateElement(element, [
        { transform: 'translate3d(0, 8px, 0)' },
        { transform: 'none' },
      ], { duration: 720, delay: timing[element.dataset.intro ?? ''] ?? 0, fill: 'backwards' });
    });
    const image = document.querySelector('.hero-media-frame img');
    if (image) animateElement(image, [{ transform: 'scale(1.025)' }, { transform: 'scale(1)' }], { duration: 1400 });
  }
  intro();

  motionPreference.addEventListener('change', () => {
    if (!motionPreference.matches) return;
    activeAnimations.forEach((animation) => {
      try { animation.finish(); } catch { animation.cancel(); }
    });
    activeAnimations.clear();
    restoreContent();
    revealObserver?.disconnect();
  });

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) restoreContent();
  });

  // Focusing or jumping to a section must never land on an invisible reveal target.
  function showTarget(target: HTMLElement) {
    pendingElements.forEach((element) => {
      if (element.contains(target) || target.contains(element)) {
        delete element.dataset.motionState;
        pendingElements.delete(element);
        revealObserver?.unobserve(element);
      }
    });
  }
  document.addEventListener('focusin', (event) => {
    if (event.target instanceof HTMLElement) showTarget(event.target);
  });
  window.addEventListener('hashchange', () => {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) showTarget(target);
  });
}

export function initScrollPresentation() {
  const header = document.querySelector<HTMLElement>('[data-header]');
  const progress = document.querySelector<HTMLElement>('[data-reading-progress]');
  const media = document.querySelector<HTMLElement>('[data-hero-media]');
  const hero = document.querySelector<HTMLElement>('.hero');
  const desktop = window.matchMedia('(min-width: 901px) and (pointer: fine)');
  let frame = 0;
  let maxScroll = 1;
  let heroHeight = 1;
  let heroVisible = true;
  let heroViewport = { width: 0, height: 0 };

  function syncHeroHeight() {
    if (!hero) return;
    if (document.querySelector('input:focus, textarea:focus, select:focus')) return;
    const viewport = window.visualViewport;
    if (viewport && Math.abs(viewport.scale - 1) > .01) return;
    const layout = readLayoutViewport();
    const resized = Math.abs(layout.width - heroViewport.width) >= 1 || Math.abs(layout.height - heroViewport.height) >= 1;
    heroViewport = layout;
    if (layout.width > 800 || layout.height <= 480) {
      hero.style.removeProperty('height');
      return;
    }
    // Fill the visible first screen at entry. Browser toolbar changes must not
    // resize content above a visitor reading the rest of the page.
    if (!resized && window.scrollY > 1) return;
    const visible = viewport && viewport.height > 0 ? Math.min(window.innerHeight, viewport.height) : window.innerHeight;
    const headerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 0;
    hero.style.height = `${Math.max(1, visible - headerHeight)}px`;
  }

  function render() {
    frame = 0;
    const scroll = Math.max(0, window.scrollY);
    if (scroll <= 1) syncHeroHeight();
    header?.classList.toggle('is-scrolled', scroll > 24);
    if (progress) progress.style.transform = `scaleX(${Math.min(1, scroll / maxScroll)})`;
    if (media && heroVisible) {
      const transform = !motionPreference.matches && desktop.matches
        ? `translate3d(0, ${Math.min(1, scroll / heroHeight) * 38}px, 0)`
        : '';
      if (media.style.transform !== transform) media.style.transform = transform;
    }
    if (hero) hero.dataset.mediaActive = String(heroVisible && !motionPreference.matches && desktop.matches);
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(render); }
  function measure() {
    syncHeroHeight();
    maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    heroHeight = hero?.offsetHeight ?? 1;
    schedule();
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  window.visualViewport?.addEventListener('resize', measure, { passive: true });
  motionPreference.addEventListener('change', schedule);
  desktop.addEventListener('change', schedule);
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      heroVisible = entry?.isIntersecting ?? false;
      schedule();
    }).observe(hero);
  }
  if ('ResizeObserver' in window) {
    // Initial RO delivery already has a completed layout; avoid forcing one during module startup.
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    if (hero) observer.observe(hero);
  } else {
    requestAnimationFrame(measure);
  }
}
