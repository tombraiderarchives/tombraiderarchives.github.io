'use strict';

/* ── Theme toggle ───────────────────────────────────────────────────────── */
(function () {
  var html   = document.documentElement;
  var toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    var icon = toggle.querySelector('i');
    if (icon) {
      icon.className = theme === 'dark' ? 'ph ph-sun' : 'ph ph-moon';
    }
    toggle.setAttribute('aria-label',
      theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }

  // Sync icon to whatever theme was set by the FOUC script
  applyTheme(html.getAttribute('data-theme') || 'dark');

  toggle.addEventListener('click', function () {
    applyTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
}());

/* ── Clickable news cards ───────────────────────────────────────────────── */
(function () {
  document.querySelectorAll('.news-item[data-href]').forEach(function (card) {
    card.addEventListener('click', function (e) {
      // Don't intercept clicks on child links (let them navigate normally)
      if (e.target.closest('a')) return;
      window.location.href = card.getAttribute('data-href');
    });
  });
}());

/* ── Sidebar (mobile) ───────────────────────────────────────────────────── */
(function () {
  const sidebar   = document.getElementById('sidebar');
  const overlay   = document.getElementById('overlay');
  const navToggle = document.getElementById('navToggle');
  const navClose  = document.getElementById('navClose');
  if (!sidebar || !overlay || !navToggle) return;

  function openSidebar() {
    sidebar.classList.add('is-open');
    overlay.classList.add('is-visible');
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Close navigation');
    navClose.focus();
  }

  function closeSidebar() {
    sidebar.classList.remove('is-open');
    overlay.classList.remove('is-visible');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open navigation');
  }

  navToggle.addEventListener('click', function () {
    if (sidebar.classList.contains('is-open')) closeSidebar();
    else openSidebar();
  });

  navClose.addEventListener('click', closeSidebar);
  overlay.addEventListener('click', closeSidebar);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && sidebar.classList.contains('is-open')) {
      closeSidebar();
      navToggle.focus();
    }
  });
}());

/* ── Nav group collapsibles ─────────────────────────────────────────────── */
(function () {
  document.querySelectorAll('.nav-group-toggle').forEach(function (btn) {
    var panelId = btn.getAttribute('aria-controls');
    var panel   = panelId ? document.getElementById(panelId) : null;
    if (!panel) return;

    // Restore open state set server-side
    if (btn.getAttribute('aria-expanded') === 'true') {
      panel.classList.add('is-open');
    }

    btn.addEventListener('click', function () {
      var opening = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(opening));
      panel.classList.toggle('is-open', opening);
    });
  });
}());

/* ── Lightbox ───────────────────────────────────────────────────────────── */
(function () {
  var lightbox  = document.getElementById('lightbox');
  if (!lightbox) return;

  var lbImg     = document.getElementById('lbImg');
  var lbClose   = document.getElementById('lbClose');
  var lbPrev    = document.getElementById('lbPrev');
  var lbNext    = document.getElementById('lbNext');
  var lbCounter = document.getElementById('lbCounter');

  var gallery     = [];
  var current     = 0;
  var lastFocused = null;

  function show(index) {
    current = index;
    lbImg.style.opacity = '0';
    lbImg.alt = '';
    lbImg.src = gallery[index];
    lbImg.onload = function () { lbImg.style.opacity = '1'; };
    lbCounter.textContent = (index + 1) + ' / ' + gallery.length;
    lbPrev.disabled = index === 0;
    lbNext.disabled = index === gallery.length - 1;
  }

  function open(thumbs, index) {
    gallery     = thumbs;
    lastFocused = document.activeElement;
    show(index);
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }

  function close() {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
    lbImg.src = '';
    if (lastFocused) lastFocused.focus();
  }

  lbClose.addEventListener('click', close);
  lbPrev.addEventListener('click',  function () { if (current > 0) show(current - 1); });
  lbNext.addEventListener('click',  function () { if (current < gallery.length - 1) show(current + 1); });

  // Close on backdrop click
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) close();
  });

  // Keyboard navigation
  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape')     { e.preventDefault(); close(); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); if (current > 0) show(current - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); if (current < gallery.length - 1) show(current + 1); }
  });

  // Wire up every gallery grid on the page
  document.querySelectorAll('.gallery-grid').forEach(function (grid) {
    var thumbs = Array.prototype.map.call(
      grid.querySelectorAll('.gallery-thumb'),
      function (a) { return a.getAttribute('data-full'); }
    );

    grid.querySelectorAll('.gallery-thumb').forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        open(thumbs, i);
      });
    });
  });
}());
