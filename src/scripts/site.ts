// All enhancements are local. This prototype never sends or stores an inquiry.
import { animateElement, initMotion, initScrollPresentation, motionPreference } from './motion';
import { initServices } from './services';
import { initOrbit } from './orbit';
import { initMarquees } from './marquee';

function initEnhancements() {
  try {
    initMotion();
    initScrollPresentation();
    initServices();
    initOrbit();
    initMarquees();
  } catch {
    document.querySelectorAll<HTMLElement>('[data-motion-state]').forEach((element) => delete element.dataset.motionState);
  }
}

// WebKit can run the module before external stylesheets finish loading.
// All layout-dependent enhancements must measure the styled document.
const pendingStyles = [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].filter((link) => !link.sheet);
if (pendingStyles.length) {
  void Promise.all(pendingStyles.map((link) => new Promise<void>((resolve) => {
    function ready() {
      link.removeEventListener('load', ready);
      link.removeEventListener('error', ready);
      resolve();
    }
    link.addEventListener('load', ready, { once: true });
    link.addEventListener('error', ready, { once: true });
  }))).then(initEnhancements);
} else initEnhancements();

const menuToggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
const mobileNav = document.querySelector<HTMLElement>('#mobile-nav');
let menuAnimation: Animation | undefined;

function setMenu(open: boolean, returnFocus = false) {
  if (!menuToggle || !mobileNav) return;
  const wasHidden = mobileNav.hidden;
  const current = getComputedStyle(mobileNav);
  const opacity = wasHidden ? '0' : current.opacity;
  const transform = wasHidden ? 'translate3d(0, -12px, 0)' : current.transform;
  menuAnimation?.cancel();
  menuAnimation = undefined;
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Zatvori meni' : 'Otvori meni');
  mobileNav.inert = !open;
  if (returnFocus) menuToggle.focus();
  if (motionPreference.matches || window.matchMedia('(min-width: 801px)').matches) { mobileNav.hidden = !open; return; }
  mobileNav.hidden = false;
  const animation = animateElement(mobileNav, [
    { opacity, transform },
    { opacity: open ? 1 : 0, transform: open ? 'none' : 'translate3d(0, -8px, 0)' },
  ], { duration: open ? 400 : 220, fill: 'both' });
  if (!animation) { mobileNav.hidden = !open; return; }
  menuAnimation = animation;
  animation.onfinish = () => {
    if (menuAnimation !== animation) return;
    mobileNav.hidden = !open;
    menuAnimation = undefined;
    animation.cancel();
  };
}

function closeMenu(returnFocus = false) {
  if (menuToggle?.getAttribute('aria-expanded') === 'true') setMenu(false, returnFocus);
}

menuToggle?.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  setMenu(open);
});

mobileNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => closeMenu());
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuToggle?.getAttribute('aria-expanded') === 'true') {
    closeMenu(true);
  }
});

document.addEventListener('click', (event) => {
  if (event.target instanceof Node && !document.querySelector('[data-header]')?.contains(event.target)) closeMenu();
});

window.matchMedia('(min-width: 801px)').addEventListener('change', (event) => {
  if (event.matches) closeMenu();
});

if ('IntersectionObserver' in window) {
  const navLinks = document.querySelectorAll<HTMLAnchorElement>('.desktop-nav a');
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-20% 0px -55% 0px' });
  document.querySelectorAll('main section[id]').forEach((section) => sectionObserver.observe(section));
}

const form = document.querySelector<HTMLFormElement>('[data-inquiry-form]');
const serviceSelect = document.querySelector<HTMLSelectElement>('#service');
const dialog = document.querySelector<HTMLDialogElement>('[data-inquiry-dialog]');
const preview = document.querySelector<HTMLDListElement>('[data-inquiry-preview]');
const copyButton = document.querySelector<HTMLButtonElement>('[data-copy-inquiry]');
const copyStatus = document.querySelector<HTMLElement>('[data-copy-status]');
const requiredTextFields = form?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('#name, #message');
requiredTextFields?.forEach((field) => {
  field.addEventListener('input', () => field.setCustomValidity(''));
});
let inquiryText = '';
let dialogAnimation: Animation | undefined;

function closeDialog() {
  if (!dialog?.open) return;
  const current = getComputedStyle(dialog);
  const from = { opacity: current.opacity, transform: current.transform };
  dialogAnimation?.cancel();
  const animation = animateElement(dialog, [from, { opacity: 0, transform: 'translate3d(0, 10px, 0)' }], { duration: 180, fill: 'both' });
  dialogAnimation = animation;
  if (!animation) { dialog.close(); return; }
  animation.onfinish = () => {
    if (dialogAnimation !== animation) return;
    dialog.close();
    animation.cancel();
    dialogAnimation = undefined;
  };
}

if (form && dialog && preview && typeof dialog.showModal === 'function') {
  const submitButton = form.querySelector<HTMLButtonElement>('[data-inquiry-submit]');
  if (submitButton) submitButton.disabled = false;
}

document.querySelectorAll<HTMLAnchorElement>('[data-inquiry-service]').forEach((link) => {
  link.addEventListener('click', () => {
    if (serviceSelect) serviceSelect.value = link.dataset.inquiryService ?? '';
  });
});

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  requiredTextFields?.forEach((field) => {
    field.setCustomValidity(field.value.trim() ? '' : 'Unesite tekst u ovo polje.');
  });
  if (!dialog || !preview || !form.reportValidity()) return;
  const data = new FormData(form);
  const serviceName = serviceSelect?.value
    ? serviceSelect.selectedOptions[0]?.textContent ?? 'Nije izabrano'
    : 'Nije izabrano';
  const fields = [
    ['Ime i prezime', String(data.get('name') ?? '').trim()],
    ['E-mail', String(data.get('email') ?? '').trim()],
    ['Firma', String(data.get('company') ?? '').trim() || 'Nije navedena'],
    ['Usluga', serviceName],
    ['Vaš zahtev', String(data.get('message') ?? '').trim()],
  ];
  preview.replaceChildren();
  fields.forEach(([label, value]) => {
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = label ?? '';
    description.textContent = value ?? '';
    preview.append(term, description);
  });
  inquiryText = fields.map(([label, value]) => `${label}: ${value}`).join('\n\n');
  if (copyStatus) copyStatus.textContent = '';
  dialog.showModal();
  dialogAnimation?.cancel();
  dialogAnimation = animateElement(dialog, [
    { opacity: 0, transform: 'translate3d(0, 14px, 0)' },
    { opacity: 1, transform: 'none' },
  ], { duration: 420 });
});

document.querySelectorAll<HTMLButtonElement>('[data-close-dialog]').forEach((button) => {
  button.addEventListener('click', closeDialog);
});

dialog?.addEventListener('cancel', (event) => { event.preventDefault(); closeDialog(); });

dialog?.addEventListener('click', (event) => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeDialog();
});

copyButton?.addEventListener('click', async () => {
  if (!copyStatus) return;
  try {
    await navigator.clipboard.writeText(inquiryText);
    copyStatus.textContent = 'Upit je kopiran. Podaci nisu poslati.';
  } catch {
    copyStatus.textContent = 'Kopiranje nije dostupno. Tekst možete označiti i kopirati ručno.';
  }
});
