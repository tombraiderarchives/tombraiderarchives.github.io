/* ── Mobile nav ── */
const sidenav    = document.getElementById('sidenav');
const overlay    = document.getElementById('overlay');
const menuToggle = document.getElementById('menuToggle');
const closeBtn   = document.getElementById('sidenavClose');

function openNav() {
  sidenav.classList.add('open');
  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeNav() {
  sidenav.classList.remove('open');
  overlay.classList.remove('show');
  document.body.style.overflow = '';
}

if (menuToggle) menuToggle.addEventListener('click', openNav);
if (closeBtn)   closeBtn.addEventListener('click', closeNav);
if (overlay)    overlay.addEventListener('click', closeNav);

document.querySelectorAll('.nav-link--leaf').forEach(link =>
  link.addEventListener('click', () => { if (window.innerWidth <= 820) closeNav(); })
);


/* ── Collapsible nav groups ── */
document.querySelectorAll('.nav-group-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const item   = btn.closest('.nav-group-item');
    const isOpen = item.classList.contains('open');
    const ul     = btn.closest('ul');

    /* close siblings at the same depth */
    ul.querySelectorAll(':scope > .nav-group-item.open').forEach(s => {
      if (s !== item) s.classList.remove('open');
    });

    item.classList.toggle('open', !isOpen);
    btn.setAttribute('aria-expanded', String(!isOpen));
  });
});


/* ── Collapsible sections (game pages) ── */
document.querySelectorAll('.section-toggle').forEach(btn => {
  const section = btn.closest('.game-section');
  const body    = section.querySelector('.section-body');
  if (!body) return;

  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    body.hidden = open;
  });
});


/* ── Lightbox ── */
const lightbox = document.getElementById('lightbox');
if (lightbox) {
  const lbImg  = lightbox.querySelector('.lb-img');
  const lbPrev = lightbox.querySelector('.lb-prev');
  const lbNext = lightbox.querySelector('.lb-next');
  const lbClose= lightbox.querySelector('.lb-close');

  let allThumbs = [];
  let current   = 0;

  function showLightbox(thumbs, index) {
    allThumbs = thumbs;
    current   = index;
    lbImg.src = thumbs[index].getAttribute('href');
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function hideLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
    lbImg.src = '';
  }
  function step(dir) {
    current = (current + dir + allThumbs.length) % allThumbs.length;
    lbImg.src = allThumbs[current].getAttribute('href');
  }

  document.querySelectorAll('.gallery-grid').forEach(grid => {
    const thumbs = Array.from(grid.querySelectorAll('.gallery-thumb'));
    thumbs.forEach((thumb, i) => {
      thumb.addEventListener('click', e => {
        e.preventDefault();
        showLightbox(thumbs, i);
      });
    });
  });

  lbClose.addEventListener('click', hideLightbox);
  lbPrev.addEventListener('click',  () => step(-1));
  lbNext.addEventListener('click',  () => step(+1));

  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) hideLightbox();
  });

  document.addEventListener('keydown', e => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape')     hideLightbox();
    if (e.key === 'ArrowLeft')  step(-1);
    if (e.key === 'ArrowRight') step(+1);
  });
}
