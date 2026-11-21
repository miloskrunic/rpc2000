let probe: HTMLDivElement | undefined;

// Small viewport units stay stable as mobile browser chrome expands/collapses.
// A genuine window/orientation resize changes this measurement.
export function readLayoutViewport() {
  if (!probe) {
    probe = document.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    probe.inert = true;
    probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:100vh;height:100svh;visibility:hidden;pointer-events:none;contain:strict;';
    document.body.append(probe);
  }
  return { width: document.documentElement.clientWidth, height: probe.getBoundingClientRect().height };
}
