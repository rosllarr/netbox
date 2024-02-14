import { initButtons } from './buttons';
import { initSelects } from './select';
import { initObjectSelector } from './objectSelector';
import { initBootstrap } from './bs';

function initDepedencies(): void {
  for (const init of [initButtons, initSelects, initObjectSelector, initBootstrap]) {
    init();
  }
}

/**
 * Hook into HTMX's event system to reinitialize specific native event listeners when HTMX swaps
 * elements.
 */
export function initHtmx(): void {
  document.addEventListener('htmx:afterSettle', initDepedencies);
}
