---
layout: default
title: Wallpapers
permalink: /downloads/wallpapers/
---

<div class="page-section">
  <div class="page-section-header">
    <h1 class="page-section-title">
      <i class="ph ph-image" aria-hidden="true"></i>
      Wallpapers
    </h1>
    <p class="page-section-desc">Free Tomb Raider wallpapers for desktop and mobile. Click any wallpaper to preview it, then use the download button to save it.</p>
  </div>

  <div class="wallpaper-tabs" role="tablist" aria-label="Wallpaper categories">
    <button class="wallpaper-tab is-active" role="tab" aria-selected="true" aria-controls="tab-desktop" id="btn-desktop" data-tab="desktop">
      <i class="ph ph-monitor" aria-hidden="true"></i> Desktop
    </button>
    <button class="wallpaper-tab" role="tab" aria-selected="false" aria-controls="tab-mobile" id="btn-mobile" data-tab="mobile">
      <i class="ph ph-device-mobile" aria-hidden="true"></i> Mobile
    </button>
  </div>

  <div id="tab-desktop" role="tabpanel" aria-labelledby="btn-desktop" class="wallpaper-panel is-active">
    <div class="wallpaper-grid" id="wallpaper-grid-desktop">
      <div class="wallpaper-empty">
        <i class="ph ph-image-broken" aria-hidden="true"></i>
        <p>Desktop wallpapers coming soon.</p>
      </div>
    </div>
  </div>

  <div id="tab-mobile" role="tabpanel" aria-labelledby="btn-mobile" class="wallpaper-panel" hidden>
    <div class="wallpaper-grid" id="wallpaper-grid-mobile">
      <div class="wallpaper-empty">
        <i class="ph ph-image-broken" aria-hidden="true"></i>
        <p>Mobile wallpapers coming soon.</p>
      </div>
    </div>
  </div>
</div>

<script>
(function () {
  var tabs  = document.querySelectorAll('.wallpaper-tab');
  var panels = document.querySelectorAll('.wallpaper-panel');

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var target = tab.dataset.tab;
      tabs.forEach(function (t) {
        var active = t.dataset.tab === target;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', String(active));
      });
      panels.forEach(function (p) {
        var show = p.id === 'tab-' + target;
        p.classList.toggle('is-active', show);
        if (show) p.removeAttribute('hidden');
        else p.setAttribute('hidden', '');
      });
    });
  });
}());
</script>
