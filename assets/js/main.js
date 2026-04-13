'use strict';

/* ── Theme toggle ───────────────────────────────────────────────────────── */
/* Handles multiple .theme-toggle buttons (sidebar + mobile sticky header).
   Adds html.theme-switching briefly so CSS can smoothly transition all
   themed colours at once, then removes it to restore normal behaviour. */
(function () {
  var html    = document.documentElement;
  var toggles = document.querySelectorAll('.theme-toggle');
  if (!toggles.length) return;

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    toggles.forEach(function (btn) {
      var icon = btn.querySelector('i');
      if (icon) icon.className = theme === 'dark' ? 'ph ph-sun' : 'ph ph-moon';
      btn.setAttribute('aria-label',
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }

  // Sync all icons to whatever theme was applied by the FOUC script
  applyTheme(html.getAttribute('data-theme') || 'dark');

  toggles.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var newTheme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.classList.add('theme-switching');
      applyTheme(newTheme);
      setTimeout(function () { html.classList.remove('theme-switching'); }, 400);
    });
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
  var sidebar   = document.getElementById('sidebar');
  var overlay   = document.getElementById('overlay');
  var navToggle = document.getElementById('navToggle');
  if (!sidebar || !overlay || !navToggle) return;

  function openSidebar() {
    sidebar.classList.add('is-open');
    overlay.classList.add('is-visible');
    document.body.style.overflow = 'hidden';
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Close navigation');
    var first = sidebar.querySelector('a, button');
    if (first) first.focus();
  }

  function closeSidebar() {
    sidebar.classList.remove('is-open');
    overlay.classList.remove('is-visible');
    document.body.style.overflow = '';
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open navigation');
    navToggle.focus();
  }

  navToggle.addEventListener('click', function () {
    if (sidebar.classList.contains('is-open')) closeSidebar();
    else openSidebar();
  });

  overlay.addEventListener('click', closeSidebar);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && sidebar.classList.contains('is-open')) {
      closeSidebar();
    }
  });
}());

/* ── Nav group collapsibles — accordion ─────────────────────────────────── */
/* Only one panel can be open per level: opening a sibling collapses others. */
(function () {
  function collapse(btn, panel) {
    btn.setAttribute('aria-expanded', 'false');
    panel.classList.remove('is-open');
  }

  document.querySelectorAll('.nav-group-toggle').forEach(function (btn) {
    var panelId = btn.getAttribute('aria-controls');
    var panel   = panelId ? document.getElementById(panelId) : null;
    if (!panel) return;

    // Restore open state set server-side (current-page highlight)
    if (btn.getAttribute('aria-expanded') === 'true') {
      panel.classList.add('is-open');
    }

    btn.addEventListener('click', function () {
      var opening = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(opening));
      panel.classList.toggle('is-open', opening);

      // Accordion: close sibling panels at the same list level
      if (opening) {
        var li         = btn.closest('li');
        var parentList = li && li.parentElement;
        if (!parentList) return;
        [].forEach.call(parentList.children, function (sibLi) {
          if (sibLi === li) return;
          var sibBtn = sibLi.querySelector(':scope > .nav-group-toggle');
          if (!sibBtn) return;
          var sibId    = sibBtn.getAttribute('aria-controls');
          var sibPanel = sibId ? document.getElementById(sibId) : null;
          if (sibPanel && sibPanel.classList.contains('is-open')) {
            collapse(sibBtn, sibPanel);
          }
        });
      }
    });
  });
}());

/* ── Numeric gallery sort ───────────────────────────────────────────────── */
/* Reorders gallery-thumb items numerically (1, 2 … 9, 10, 11 …) before the
   lightbox wires up its index array, so filenames like 1.jpg / 10.jpg /
   100.jpg sort correctly instead of lexicographically. */
(function () {
  function numFromHref(href) {
    var seg = (href || '').split('/').pop().replace(/\.[^.]+$/, '');
    var m   = seg.match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  }
  document.querySelectorAll('.gallery-grid').forEach(function (grid) {
    var items = [].slice.call(grid.querySelectorAll('.gallery-thumb'));
    if (!items.length) return;
    items.sort(function (a, b) {
      return numFromHref(a.getAttribute('data-full')) -
             numFromHref(b.getAttribute('data-full'));
    });
    items.forEach(function (item) { grid.appendChild(item); });
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

  // Expose so the random-image widget on the homepage can reuse this lightbox
  window._lbOpen = open;

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

/* ── Mobile navigation (.main-navigation) dropdowns ─────────────────────── */
/* Handles submenu and sub-links open/close with accordion behaviour.
   Expects .submenu-inner / .sub-links-inner wrappers inside each panel
   so the grid-template-rows animation works correctly. */
(function () {
  var mainNav = document.querySelector('.main-navigation');
  if (!mainNav) return;

  function openPanel(panel) {
    panel.classList.add('is-open');
  }
  function closePanel(panel) {
    panel.classList.remove('is-open');
    // Also close any nested sub-links inside this panel
    panel.querySelectorAll('.sub-links.is-open').forEach(function (sub) {
      sub.classList.remove('is-open');
    });
  }

  // Top-level menu items — toggle .submenu
  mainNav.querySelectorAll('.menu-item').forEach(function (item) {
    var submenu = item.querySelector(':scope > .submenu');
    if (!submenu) return;
    var trigger = item.querySelector(':scope > a');
    if (!trigger) return;

    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      var opening = !submenu.classList.contains('is-open');
      // Accordion: close sibling submenus first
      [].forEach.call(item.parentElement.children, function (sib) {
        if (sib === item) return;
        var sibSub = sib.querySelector(':scope > .submenu');
        if (sibSub && sibSub.classList.contains('is-open')) closePanel(sibSub);
      });
      if (opening) openPanel(submenu); else closePanel(submenu);
    });
  });

  // Submenu items — toggle .sub-links (only for items that have them)
  mainNav.querySelectorAll('.submenu-item').forEach(function (item) {
    var subLinks = item.querySelector(':scope > .sub-links');
    if (!subLinks) return;
    var trigger = item.querySelector(':scope > a');
    if (!trigger) return;

    trigger.addEventListener('click', function (e) {
      // If the link goes somewhere real, let it navigate; only intercept # hrefs
      if (trigger.getAttribute('href') && trigger.getAttribute('href') !== '#') return;
      e.preventDefault();
      var opening = !subLinks.classList.contains('is-open');
      // Accordion: close sibling sub-links
      [].forEach.call(item.parentElement.children, function (sib) {
        if (sib === item) return;
        var sibLinks = sib.querySelector(':scope > .sub-links');
        if (sibLinks && sibLinks.classList.contains('is-open')) {
          sibLinks.classList.remove('is-open');
        }
      });
      subLinks.classList.toggle('is-open', opening);
    });
  });

  // Close-menu button — collapses everything
  var closeBtn = mainNav.querySelector('.close-menu');
  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      mainNav.querySelectorAll('.submenu.is-open, .sub-links.is-open').forEach(function (p) {
        p.classList.remove('is-open');
      });
    });
  }
}());

/* ── Random image (homepage) ────────────────────────────────────────────── */
/* Reads window._archiveShots built by Jekyll/Liquid in index.md, picks a
   random entry, renders a thumbnail card. Clicking the image opens the shared
   site lightbox (window._lbOpen, exposed by the Lightbox IIFE above). */
(function () {
  var container = document.getElementById('randomShot');
  var shots     = window._archiveShots;
  if (!container || !shots || !shots.length) return;

  var entry = shots[Math.floor(Math.random() * shots.length)];

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  container.innerHTML =
    '<button class="random-shot-img-wrap" aria-label="Open image from ' + esc(entry.title) + ' in lightbox">' +
      '<img class="random-shot-img" src="' + esc(entry.thumb) + '" alt="Image from ' + esc(entry.title) + '" loading="lazy" decoding="async">' +
      '<span class="random-shot-zoom" aria-hidden="true">' +
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>' +
          '<line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>' +
        '</svg>' +
      '</span>' +
    '</button>' +
    '<div class="random-shot-meta">' +
      '<a class="random-shot-game" href="' + esc(entry.url) + '">' +
        '<i class="ph ph-game-controller" aria-hidden="true"></i>' +
        esc(entry.title) +
      '</a>' +
    '</div>';

  container.querySelector('.random-shot-img-wrap').addEventListener('click', function () {
    if (window._lbOpen) window._lbOpen([entry.full], 0);
  });
}());

/* ── Lazy loading — apply to any image not already marked ───────────────── */
(function () {
  document.querySelectorAll('img:not([loading])').forEach(function (img) {
    img.setAttribute('loading', 'lazy');
  });
  document.querySelectorAll('img:not([decoding])').forEach(function (img) {
    img.setAttribute('decoding', 'async');
  });
}());
