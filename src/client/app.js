import 'toast-queue/style.css';
import 'toast-queue/presets/stacked.css';

import '@github/clipboard-copy-element';
import { ToastQueue } from 'toast-queue';

if (typeof HTMLElement.prototype.ariaNotify !== 'function') {
  await import('@github/arianotify-polyfill');
}

const tq = new ToastQueue({
  position: 'bottom-end',
});

document.addEventListener('clipboard-copy', (event) => {
  tq.add(event.target.dataset.clipboardCopy);
});
