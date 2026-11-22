let probe: HTMLDivElement | undefined;
let largeProbe: HTMLDivElement | undefined;

function createProbe(unit: 'svh' | 'lvh') {
  const element = document.createElement('div');
  element.setAttribute('aria-hidden', 'true');
  element.inert = true;
  element.style.cssText = `position:fixed;left:0;top:0;width:0;height:100vh;height:100${unit};visibility:hidden;pointer-events:none;contain:strict;`;
  document.body.append(element);
  return element;
}

// Both limits stay stable while browser toolbars move. The visible scene can
// use dvh inside a track reserved for the larger limit without moving the page.
export function readLayoutViewport() {
  probe ??= createProbe('svh');
  largeProbe ??= createProbe('lvh');
  return { width: document.documentElement.clientWidth, height: probe.getBoundingClientRect().height, largeHeight: largeProbe.getBoundingClientRect().height };
}
