import { animateElement, motionPreference } from './motion';

export function initOrbit() {
  const section = document.querySelector<HTMLElement>('[data-orbit]');
  if (!section) return;
  const scene = section.querySelector<HTMLElement>('[data-orbit-scene]');
  const mobileIntro = section.querySelector<HTMLElement>('.orbit-mobile-intro');
  const stage = section.querySelector<HTMLElement>('[data-orbit-stage]');
  const depthGrid = section.querySelector<HTMLElement>('[data-orbit-depth-grid]');
  const depthLight = section.querySelector<HTMLElement>('[data-orbit-depth-light]');
  const rotor = section.querySelector<HTMLElement>('[data-orbit-rotor]');
  const nodes = [...section.querySelectorAll<HTMLButtonElement>('[data-orbit-node]')];
  const focus = section.querySelector<HTMLElement>('[data-orbit-focus]');
  const title = section.querySelector<HTMLElement>('[data-orbit-title]');
  const description = section.querySelector<HTMLElement>('[data-orbit-description]');
  const indexLabel = section.querySelector<HTMLElement>('[data-orbit-index]');
  const panel = section.querySelector<HTMLElement>('[data-orbit-panel]');
  const link = section.querySelector<HTMLAnchorElement>('[data-orbit-link]');
  const cue = section.querySelector<HTMLElement>('[data-orbit-cue]');
  if (!scene || !rotor || !nodes.length || !focus || !title || !description || !indexLabel || !panel || !link) return;

  let selected = 0;
  let pending = 0;
  let position = 0;
  let target = 0;
  let manual = false;
  let inViewport = false;
  let story = false;
  let scrollStart = 0;
  let travel = 1;
  let motionTravel = 1;
  let lastStoryProgress = 0;
  let lastScroll = window.scrollY;
  let frame = 0;
  let lastTime = 0;
  let measureFrame = 0;
  let configureFrame = 0;
  let panelAnimation: Animation | undefined;
  let transitionVersion = 0;
  const canObserve = 'IntersectionObserver' in window && 'ResizeObserver' in window;
  const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

  function commitSelection(index: number) {
    selected = index;
    const node = nodes[index]!;
    title!.textContent = node.dataset.title ?? '';
    description!.textContent = node.dataset.description ?? '';
    indexLabel!.textContent = String(index + 1).padStart(2, '0');
    link!.href = `#usluga-${node.dataset.service ?? ''}`;
    nodes.forEach((item, itemIndex) => {
      item.classList.toggle('is-selected', itemIndex === index);
      item.setAttribute('aria-pressed', String(itemIndex === index));
    });
  }

  function select(index: number, immediate = false) {
    if (index === pending && !immediate) return;
    pending = index;
    const version = ++transitionVersion;
    const current = panelAnimation?.playState === 'running' ? getComputedStyle(panel!) : undefined;
    const from = { opacity: current?.opacity ?? '1', transform: current?.transform ?? 'none' };
    panelAnimation?.cancel();
    panelAnimation = undefined;
    if (immediate || motionPreference.matches) { commitSelection(index); return; }
    if (index === selected) {
      panelAnimation = animateElement(panel!, [from, { opacity: 1, transform: 'none' }], { duration: 340 });
      return;
    }
    // Exit before swapping text; a rapid reversal continues from the currently rendered state.
    const exit = animateElement(panel!, [from, { opacity: 0, transform: 'translate3d(0, -5px, 0)' }], { duration: 210, fill: 'both' });
    panelAnimation = exit;
    const enter = () => {
      if (version !== transitionVersion) return;
      commitSelection(index);
      exit?.cancel();
      panelAnimation = animateElement(panel!, [
        { opacity: 0, transform: 'translate3d(0, 8px, 0)' },
        { opacity: 1, transform: 'none' },
      ], { duration: 520 });
    };
    if (exit) exit.onfinish = enter;
    else enter();
  }

  function scrollPosition() {
    // End dwells give the first/last descriptions time to be read.
    lastStoryProgress = clamp((window.scrollY - scrollStart) / travel);
    const progress = clamp((window.scrollY - scrollStart) / motionTravel);
    return clamp((progress - .08) / .84) * 3;
  }
  function paint() {
    const angle = position * 90;
    rotor!.style.transform = `rotate(${angle}deg)`;
    focus!.style.transform = `rotate(${angle}deg)`;
    // Shallow counter-motion creates depth while the reading column remains still.
    if (depthGrid) depthGrid.style.transform = motionPreference.matches ? '' : `translate3d(0, ${-42 + position * 28}px, 0)`;
    if (depthLight) depthLight.style.transform = motionPreference.matches ? '' : `translate3d(${24 - position * 16}px, 0, 0)`;
    if (stage) stage.style.transform = motionPreference.matches ? '' : `translate3d(0, ${(10 - position * 20 / 3) * (section!.dataset.compact === 'true' ? .35 : 1)}px, 0)`;
    section!.dataset.chapterPosition = position.toFixed(4);
    if (!manual) {
      const next = Math.round(position);
      // A dead band avoids flicker while hovering over a chapter boundary.
      if (next !== pending && Math.abs(position - (pending + Math.sign(next - pending) * .5)) > .025) select(next);
    }
  }
  function render(time: number) {
    frame = 0;
    if (configureFrame || document.hidden || motionPreference.matches || !inViewport) { lastTime = 0; return; }
    if (!manual) target = scrollPosition();
    const dt = lastTime ? Math.min(64, time - lastTime) : 16;
    lastTime = time;
    position += (target - position) * (1 - Math.exp(-dt / 155));
    if (Math.abs(target - position) < .0005) position = target;
    paint();
    if (position !== target) frame = requestAnimationFrame(render);
    else lastTime = 0;
  }
  function schedule() {
    if (!frame && inViewport && !document.hidden && !motionPreference.matches) frame = requestAnimationFrame(render);
  }
  function updatePlayback() {
    section!.dataset.running = String(story && inViewport && !document.hidden && !motionPreference.matches);
    if (cue) cue.textContent = story ? 'SKROLUJTE KROZ POSTUPKE' : 'IZABERITE POSTUPAK';
    schedule();
  }
  function measureGeometry() {
    measureFrame = 0;
    const headerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 0;
    const introHeight = section!.dataset.compact === 'true' ? mobileIntro?.getBoundingClientRect().height ?? 0 : 0;
    scrollStart = section!.getBoundingClientRect().top + window.scrollY + introHeight - headerHeight;
    if (story && !manual) schedule();
  }
  function requestMeasure() {
    if (!measureFrame) measureFrame = requestAnimationFrame(measureGeometry);
  }
  function fitMobilePanel() {
    // Reserve the largest actual title/description, including browser font sizing.
    // Hidden probes have no IDs, controls or animation data attributes.
    const width = panel!.getBoundingClientRect().width;
    const probes = nodes.map((node) => {
      const probe = document.createElement('div');
      probe.className = 'orbit-selection';
      probe.setAttribute('aria-hidden', 'true');
      probe.inert = true;
      Object.assign(probe.style, { position: 'absolute', visibility: 'hidden', width: `${width}px`, top: '0', left: '0', pointerEvents: 'none' });
      const heading = document.createElement('h3');
      const text = document.createElement('p');
      heading.textContent = node.dataset.title ?? '';
      text.textContent = node.dataset.description ?? '';
      probe.append(heading, text);
      return probe;
    });
    section!.append(...probes);
    const titleHeight = Math.max(...probes.map((probe) => probe.querySelector('h3')!.getBoundingClientRect().height));
    const textHeight = Math.max(...probes.map((probe) => probe.querySelector('p')!.getBoundingClientRect().height));
    probes.forEach((probe) => probe.remove());
    panel!.style.setProperty('--orbit-title-height', `${titleHeight}px`);
    panel!.style.setProperty('--orbit-description-height', `${textHeight}px`);
  }
  function mobileContentSize() {
    const sceneStyle = getComputedStyle(scene!);
    const layoutStyle = getComputedStyle(section!.querySelector<HTMLElement>('.orbit-layout')!);
    const stageStyle = getComputedStyle(stage!);
    const bottom = section!.querySelector<HTMLElement>('.orbit-bottom')!;
    const fixed = panel!.getBoundingClientRect().height + bottom.getBoundingClientRect().height
      + parseFloat(sceneStyle.paddingTop) + parseFloat(sceneStyle.paddingBottom)
      + parseFloat(layoutStyle.paddingTop) + parseFloat(layoutStyle.paddingBottom)
      + parseFloat(stageStyle.marginTop) + parseFloat(stageStyle.marginBottom);
    return { fixed, total: fixed + stage!.getBoundingClientRect().height };
  }
  function configure() {
    configureFrame = 0;
    const previousStory = story;
    // A viewport resize can change the hero height and native scroll anchoring first.
    // Preserve the progress actually rendered before that resize, not the shifted scrollY.
    const previousProgress = previousStory ? lastStoryProgress : clamp((window.scrollY - scrollStart) / travel);
    const preservePosition = previousStory && inViewport && previousProgress > 0 && previousProgress < 1;
    section!.dataset.story = 'false';
    scene!.style.removeProperty('height');
    const compact = window.matchMedia('(max-width: 800px)').matches && canObserve && !motionPreference.matches;
    section!.dataset.compact = String(compact);
    section!.dataset.density = 'normal';
    stage?.style.removeProperty('--orbit-stage-size');
    const headerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 0;
    const viewport = window.visualViewport;
    const visibleHeight = viewport && viewport.scale === 1 && viewport.height > 0 ? Math.min(window.innerHeight, viewport.height) : window.innerHeight;
    const available = visibleHeight - headerHeight - 8;
    // The mobile scene uses the small viewport height, stable while browser chrome collapses.
    const bounds = scene!.getBoundingClientRect();
    const sceneSize = compact ? Math.min(bounds.height, available) : Math.min(available, 840);
    let naturalHeight = bounds.height;
    if (compact && stage) {
      scene!.style.height = `${sceneSize}px`;
      fitMobilePanel();
      let content = mobileContentSize();
      if (sceneSize - content.fixed < 176) {
        section!.dataset.density = 'tight';
        content = mobileContentSize();
      }
      const preferredWidth = Math.min(section!.querySelector<HTMLElement>('.orbit-inner')!.getBoundingClientRect().width + 24, 390);
      const stageSize = Math.max(160, Math.min(preferredWidth, sceneSize - content.fixed - 8));
      stage.style.setProperty('--orbit-stage-size', `${stageSize}px`);
      naturalHeight = mobileContentSize().total;
    }
    section!.dataset.fitRequired = naturalHeight.toFixed(1);
    section!.dataset.fitAvailable = sceneSize.toFixed(1);
    story = canObserve && !motionPreference.matches && sceneSize <= available + 1 && sceneSize + 1 >= naturalHeight && (compact || window.innerHeight >= 700);
    motionTravel = compact ? Math.max(1500, sceneSize * 2.8) : Math.max(1800, window.innerHeight * 2.2);
    // Keep the existing rotation pace; reserve extra scroll only for reading the final procedure.
    const finalHold = Math.max(480, Math.min(680, sceneSize * .8));
    travel = motionTravel + finalHold;
    section!.style.setProperty('--orbit-motion-travel', `${motionTravel}px`);
    section!.style.setProperty('--orbit-final-hold', `${finalHold}px`);
    section!.style.setProperty('--orbit-travel', `${travel}px`);
    section!.style.setProperty('--orbit-scene-size', `${sceneSize}px`);
    if (story) scene!.style.height = `${sceneSize}px`;
    else {
      section!.dataset.compact = 'false';
      section!.dataset.density = 'normal';
      scene!.style.removeProperty('height');
      panel!.style.removeProperty('--orbit-title-height');
      panel!.style.removeProperty('--orbit-description-height');
    }
    section!.dataset.fit = story ? 'fits' : motionPreference.matches ? 'reduced-motion' : 'content-too-tall';
    section!.style.setProperty('--orbit-intro-size', `${story && compact ? mobileIntro?.getBoundingClientRect().height ?? 0 : 0}px`);
    section!.dataset.story = String(story);
    section!.dataset.scrollDriver = story ? 'shared' : 'manual';
    measureGeometry();
    if (preservePosition) {
      // When the layout falls back, retain the scene in view instead of landing in the next section.
      window.scrollTo({ top: story ? scrollStart + previousProgress * travel : scrollStart, behavior: 'instant' });
      lastScroll = window.scrollY;
    }
    if (!story) {
      if (previousStory && !manual) {
        target = position;
        select(Math.round(position), true);
      }
      manual = true;
      if (motionPreference.matches || !canObserve) {
        target = pending; position = pending; paint(); select(pending, true);
      }
    } else if (!previousStory && !manual) {
      target = scrollPosition(); position = target; paint();
    }
    updatePlayback();
  }

  nodes.forEach((node, index) => {
    node.disabled = false;
    node.addEventListener('click', () => {
      manual = true;
      target = index;
      select(index);
      if (motionPreference.matches || !canObserve) { position = target; paint(); }
      else schedule();
    });
  });
  function releaseManual() {
    if (!story) return;
    manual = false;
    schedule();
  }
  // Native focus/anchor scrolling must not undo a button the user just activated.
  // Return ownership to scrolling on deliberate wheel, touch, keyboard or scrollbar input.
  window.addEventListener('wheel', (event) => { if (event.deltaY) releaseManual(); }, { passive: true });
  let touchX = 0;
  let touchY = 0;
  window.addEventListener('touchstart', (event) => {
    touchX = event.touches[0]?.clientX ?? 0;
    touchY = event.touches[0]?.clientY ?? 0;
  }, { passive: true });
  window.addEventListener('touchmove', (event) => {
    const touch = event.touches[0];
    if (touch && Math.abs(touch.clientY - touchY) > Math.max(2, Math.abs(touch.clientX - touchX))) releaseManual();
  }, { passive: true });
  document.addEventListener('keydown', (event) => {
    if (!['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) return;
    const element = event.target instanceof Element ? event.target : null;
    if (element?.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (event.key === ' ' && element?.closest('button')) return;
    releaseManual();
  });
  window.addEventListener('pointerdown', (event) => {
    if (event.clientX >= document.documentElement.clientWidth) releaseManual();
  }, { passive: true });
  window.addEventListener('scroll', () => {
    const scroll = window.scrollY;
    if (story && !manual && Math.abs(scroll - lastScroll) > 1) schedule();
    lastScroll = scroll;
  }, { passive: true });
  function requestConfigure() {
    if (!configureFrame) configureFrame = requestAnimationFrame(configure);
  }
  window.addEventListener('resize', requestConfigure, { passive: true });
  window.visualViewport?.addEventListener('resize', () => {
    if (window.visualViewport?.scale === 1 && !document.querySelector('input:focus, textarea:focus, select:focus')) requestConfigure();
  }, { passive: true });
  document.addEventListener('visibilitychange', () => { lastTime = 0; updatePlayback(); });
  motionPreference.addEventListener('change', configure);
  window.addEventListener('pagehide', () => { section.dataset.running = 'false'; if (frame) cancelAnimationFrame(frame); frame = 0; lastTime = 0; });
  window.addEventListener('pageshow', requestMeasure);
  if (canObserve) {
    new IntersectionObserver(([entry]) => {
      inViewport = entry?.isIntersecting ?? false;
      updatePlayback();
    }).observe(section);
    new ResizeObserver(requestMeasure).observe(document.body);
  } else inViewport = true;
  configure();
  if (document.fonts.status === 'loading') void document.fonts.ready.then(configure);
}
