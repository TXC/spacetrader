// Tells when an element changes size, or the screen it is on changes its pixel density.
// Returns a function that stops the watching.
export function watchSize(element: Element, changed: () => void): () => void {
  const observer = new ResizeObserver(changed);
  observer.observe(element);
  let density: MediaQueryList;
  // A query matches one density only, so each change needs a new query.
  const watchDensity = () => {
    density = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    density.addEventListener('change', densityChanged);
  };
  const densityChanged = () => {
    density.removeEventListener('change', densityChanged);
    watchDensity();
    changed();
  };
  watchDensity();
  return () => {
    observer.disconnect();
    density.removeEventListener('change', densityChanged);
  };
}
