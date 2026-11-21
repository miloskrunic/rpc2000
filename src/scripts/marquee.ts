import { motionPreference } from './motion';

export function initMarquees() {
  document.querySelectorAll<HTMLElement>('[data-marquee]').forEach((section) => {
    const track = section.querySelector<HTMLElement>('.marquee-track');
    const group = section.querySelector<HTMLElement>('.marquee-group:not([aria-hidden])');
    if (!track || !group || !track.animate || !('IntersectionObserver' in window) || !('ResizeObserver' in window)) return;

    const baseSpeed = 24;
    let animation: Animation | undefined;
    let visible = false;
    let duration = 1;
    let groupWidth = 0;
    let extraSpeed = 0;
    let distance = 0;
    let lastScroll = window.scrollY;
    let frame = 0;
    let lastTime = 0;
    const canRun = () => visible && !document.hidden && !motionPreference.matches;

    function clearMomentum() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      distance = extraSpeed = 0;
      lastScroll = window.scrollY;
      animation?.updatePlaybackRate(1);
    }
    function sync() {
      section.dataset.running = String(canRun() && !!animation);
      if (canRun()) animation?.play();
      else { clearMomentum(); animation?.pause(); }
    }
    function measure() {
      if (motionPreference.matches) return;
      const width = group!.getBoundingClientRect().width;
      if (!width || Math.abs(width - groupWidth) < .25 && animation) return;
      const phase = animation ? ((Number(animation.currentTime ?? 0) % duration) + duration) % duration / duration : 0;
      duration = width / baseSpeed * 1000;
      groupWidth = width;
      animation?.cancel();
      // One complete group enters from the left as its identical copy exits right.
      animation = track!.animate([
        { transform: `translate3d(-${width}px, 0, 0)` },
        { transform: 'translate3d(0, 0, 0)' },
      ], { duration, iterations: Infinity, easing: 'linear' });
      animation.currentTime = phase * duration;
      animation.playbackRate = (baseSpeed + extraSpeed) / baseSpeed;
      sync();
    }
    function tick(now: number) {
      frame = 0;
      if (!canRun()) { clearMomentum(); return; }
      const dt = Math.min(Math.max((now - lastTime) / 1000, 1 / 120), .05);
      lastTime = now;
      const target = Math.min(distance / dt * .12, 90);
      distance = 0;
      extraSpeed += (target - extraSpeed) * (1 - Math.exp(-dt * (target > extraSpeed ? 12 : 2.8)));
      animation?.updatePlaybackRate((baseSpeed + extraSpeed) / baseSpeed);
      if (extraSpeed < .05 && !target) { extraSpeed = 0; animation?.updatePlaybackRate(1); }
      else frame = requestAnimationFrame(tick);
    }
    window.addEventListener('scroll', () => {
      const delta = Math.abs(window.scrollY - lastScroll);
      lastScroll = window.scrollY;
      if (!canRun() || !delta) return;
      distance += delta;
      if (!frame) { lastTime = performance.now() - 1000 / 60; frame = requestAnimationFrame(tick); }
    }, { passive: true });
    function updateMotion() {
      clearMomentum();
      if (motionPreference.matches) { animation?.cancel(); animation = undefined; groupWidth = 0; }
      section.dataset.enhanced = String(!motionPreference.matches);
      sync();
      if (!motionPreference.matches) measure();
    }
    new IntersectionObserver(([entry]) => { visible = entry?.isIntersecting ?? false; sync(); }).observe(section);
    new ResizeObserver(measure).observe(group);
    document.addEventListener('visibilitychange', sync);
    motionPreference.addEventListener('change', updateMotion);
    window.addEventListener('pagehide', () => { clearMomentum(); animation?.pause(); section.dataset.running = 'false'; });
    window.addEventListener('pageshow', sync);
    void document.fonts.ready.then(measure);
    updateMotion();
  });
}
