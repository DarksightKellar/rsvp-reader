import { mount } from './player.js';

const SELECTOR = 'script[type="text/plain"][data-rsvp], script[type="text/plain"]#rsvp-source';

export function mountAll(doc = document) {
  return [...doc.querySelectorAll(SELECTOR)]
    .filter(src => !src.dataset.rsvpMounted)
    .map(src => {
      src.dataset.rsvpMounted = '1';
      const host = doc.createElement('div');
      src.after(host);
      return mount(host, src.textContent);
    });
}

if (typeof document !== 'undefined') {
  window.RSVPReader = { mount, mountAll };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountAll());
  else mountAll();
}
