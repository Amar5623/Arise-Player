/**
 * Chrome only allows vibration and audio after a user gesture. Feedback requested before the
 * first gesture (e.g. a penalty notice on app open) runs on the first tap instead of being lost.
 */
type Pending = () => void;

const queue: Pending[] = [];
let armed = false;

function activated(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } })
    .userActivation;
  return ua ? ua.hasBeenActive : true;
}

export function afterGesture(run: Pending): void {
  if (activated()) {
    run();
    return;
  }
  queue.push(run);
  if (armed || typeof window === 'undefined') return;
  armed = true;
  window.addEventListener(
    'pointerdown',
    () => {
      armed = false;
      queue.splice(0).forEach((fn) => fn());
    },
    { once: true, capture: true },
  );
}
