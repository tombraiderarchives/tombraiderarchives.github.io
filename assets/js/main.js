'use strict';

/* ── Sidebar (mobile) ───────────────────────────────────────────────────── */
const sidebar   = document.getElementById('sidebar');
const overlay   = document.getElementById('overlay');
const navToggle = document.getElementById('navToggle');
const navClose  = document.getElementById('navClose');

function openSidebar() {
  sidebar.classList.add('is-open');
  overlay.classList.add('visible');
  navToggle.setAttribute('aria-expanded', 'true');
  navClose.focus();
}

function closeSidebar() {
  sidebar.classList.remove('is-open');
  overlay.classList.remove('visible');
  navToggle.setAttribute('aria-expanded', 'false');
}

navToggle?.addEventListener('click', openSidebar);
navClose?.addEventListener('click', closeSidebar);
overlay?.addEventListener('click', closeSidebar);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && sidebar.classList.contains('is-open')) closeSidebar();
});

/* ── Nav group collapsibles ─────────────────────────────────────────────── */
document.querySelectorAll('[data-group]').forEach(group => {
  const btn = group.querySelector(':scope > .nav-group-toggle');
  const sub = btn?.nextElementSibling;
  if (!btn || !sub) return;

  // Initialise from aria-expanded (set server-side for active paths)
  const isOpen = btn.getAttribute('aria-expanded') === 'true';
  if (isOpen) sub.classList.add('is-open');

  btn.addEventListener('click', () => {
    const opening = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(opening));
    sub.classList.toggle('is-open', opening);
  });
});

/* ── Lightbox ───────────────────────────────────────────────────────────── */
const lightbox  = document.getElementById('lightbox');
if (lightbox) {
  const lbImg     = document.getElementById('lbImg');
  const lbClose   = document.getElementById('lbClose');
  const lbPrev    = document.getElementById('lbPrev');
  const lbNext    = document.getElementById('lbNext');
  const lbCounter = document.getElementById('lbCounter');

  let currentGallery = [];
  let currentIndex   = 0;
  let lastFocused    = null;

  function openLightbox(thumbs, index) {
    currentGallery = thumbs;
    currentIndex   = index;
    showImage(index);
    lightbox.hidden = false;
    // Trigger transition
    requestAnimationFrame(() => lightbox.style.opacity = '1');
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }

  function closeLightbox() {
    lightbox.style.opacity = '0';
    setTimeout(() => {
      lightbox.hidden = true;
      document.body.style.overflow = '';
      lastFocused?.focus();
    }, 200);
  }

  function showImage(index) {
    lbImg.style.opacity = '0';
    lbImg.src = currentGallery[index];
    lbImg.alt = '';
    lbImg.onload = () => { lbImg.style.opacity = '1'; };
    lbCounter.textContent = `${index + 1} / ${currentGallery.length}`;
    lbPrev.disabled = index === 0;
    lbNext.disabled = index === currentGallery.length - 1;
  }

  function prev() { if (currentIndex > 0) showImage(--currentIndex); }
  function next() { if (currentIndex < currentGallery.length - 1) showImage(++currentIndex); }

  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', prev);
  lbNext.addEventListener('click', next);

  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

  document.addEventListener('keydown', e => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape')      { e.preventDefault(); closeLightbox(); }
    if (e.key === 'ArrowLeft')   { e.preventDefault(); prev(); }
    if (e.key === 'ArrowRight')  { e.preventDefault(); next(); }
  });

  // Attach click handlers to every gallery grid
  document.querySelectorAll('.gallery-grid').forEach(grid => {
    const thumbs = [...grid.querySelectorAll('.gallery-thumb')].map(a => a.dataset.full);
    grid.querySelectorAll('.gallery-thumb').forEach((a, i) => {
      a.addEventListener('click', e => {
        e.preventDefault();
        lastFocused = a;
        openLightbox(thumbs, i);
      });
    });
  });
}
