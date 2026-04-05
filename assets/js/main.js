const sidenav    = document.getElementById('sidenav');
const overlay    = document.getElementById('overlay');
const menuToggle = document.getElementById('menuToggle');
const closeBtn   = document.getElementById('sidenavClose');

function openNav() {
  sidenav.classList.add('open');
  overlay.classList.add('visible');
  document.body.style.overflow = 'hidden';
}

function closeNav() {
  sidenav.classList.remove('open');
  overlay.classList.remove('visible');
  document.body.style.overflow = '';
}

menuToggle.addEventListener('click', openNav);
closeBtn.addEventListener('click', closeNav);
overlay.addEventListener('click', closeNav);

/* Collapsible nav groups */
document.querySelectorAll('.nav-group').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.nav-item');
    const isOpen = item.classList.contains('open');

    /* Close siblings at the same level */
    const siblings = btn.closest('ul').querySelectorAll(':scope > .nav-item.has-children');
    siblings.forEach(s => {
      if (s !== item) s.classList.remove('open');
    });

    item.classList.toggle('open', !isOpen);
  });
});

/* Close nav on leaf link click (mobile) */
document.querySelectorAll('.nav-link--leaf').forEach(link => {
  link.addEventListener('click', () => {
    if (window.innerWidth <= 768) closeNav();
  });
});
