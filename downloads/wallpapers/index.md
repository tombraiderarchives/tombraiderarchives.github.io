---
layout: default
title: Wallpapers
permalink: /downloads/wallpapers/
---

{% assign _all_desktop = site.static_files | where_exp: "f", "f.path contains '/downloads/wallpapers/desktop/'" | where_exp: "f", "f.name != '.gitkeep'" %}
{% assign _all_mobile  = site.static_files | where_exp: "f", "f.path contains '/downloads/wallpapers/mobile/'"  | where_exp: "f", "f.name != '.gitkeep'" %}

{% assign _desktop_thumbs = _all_desktop | where_exp: "f", "f.path contains '/thumbs/'" %}
{% assign _mobile_thumbs  = _all_mobile  | where_exp: "f", "f.path contains '/thumbs/'" %}
{% assign _desktop_count  = _all_desktop.size | minus: _desktop_thumbs.size %}
{% assign _mobile_count   = _all_mobile.size  | minus: _mobile_thumbs.size %}

{% comment %}
  Group wallpapers by the path segment at index 4, which is the game subfolder name
  for files in subfolders (e.g. "Tomb Raider 2"), or the filename itself for files
  sitting directly in desktop/ or mobile/. The "thumbs" group is skipped.
{% endcomment %}
{% assign _desktop_groups = _all_desktop | group_by_exp: "f", "f.path | split: '/' | slice: 4, 1 | first" %}
{% assign _mobile_groups  = _all_mobile  | group_by_exp: "f", "f.path | split: '/' | slice: 4, 1 | first" %}

<div class="page-section">
  <div class="page-section-header">
    <h1 class="page-section-title">
      <i class="ph ph-image" aria-hidden="true"></i>
      Wallpapers
    </h1>
    <p class="page-section-desc">Free Tomb Raider wallpapers — click any image to preview it full size, then hit the save button to download.</p>
  </div>

  <div class="wallpaper-tabs" role="tablist" aria-label="Wallpaper categories">
    <button class="wallpaper-tab is-active" role="tab" aria-selected="true"
            aria-controls="tab-desktop" id="btn-desktop" data-tab="desktop">
      <i class="ph ph-monitor" aria-hidden="true"></i> Desktop
      {% if _desktop_count > 0 %}<span class="wallpaper-count">{{ _desktop_count }}</span>{% endif %}
    </button>
    <button class="wallpaper-tab" role="tab" aria-selected="false"
            aria-controls="tab-mobile" id="btn-mobile" data-tab="mobile">
      <i class="ph ph-device-mobile" aria-hidden="true"></i> Mobile
      {% if _mobile_count > 0 %}<span class="wallpaper-count">{{ _mobile_count }}</span>{% endif %}
    </button>
  </div>

  <!-- Desktop tab -->
  <div id="tab-desktop" role="tabpanel" aria-labelledby="btn-desktop" class="wallpaper-panel is-active">
    {% if _desktop_count > 0 %}
      {% for group in _desktop_groups %}
      {% unless group.name == 'thumbs' %}
      {% assign _has_orig = false %}
      {% for _w in group.items %}{% unless _w.path contains '/thumbs/' %}{% assign _has_orig = true %}{% endunless %}{% endfor %}
      {% if _has_orig %}
        {% unless group.name contains '.' %}
        <h3 class="wallpaper-group-title">{{ group.name | replace: '-', ' ' | replace: '_', ' ' }}</h3>
        {% endunless %}
        <div class="wallpaper-grid">
          {% for wall in group.items %}
          {% unless wall.path contains '/thumbs/' %}
          {% assign _thumb_path = wall.path | replace: wall.name, 'thumbs/' | append: wall.basename | append: '.jpg' %}
          {% assign wall_name = wall.basename | replace: '-', ' ' | replace: '_', ' ' %}
          <div class="wallpaper-card">
            <button class="wallpaper-thumb-wrap" data-full="{{ site.baseurl }}{{ wall.path }}"
                    aria-label="Preview {{ wall_name }}">
              <img class="wallpaper-thumb"
                   src="{{ site.baseurl }}{{ _thumb_path }}"
                   onerror="this.onerror=null;this.src='{{ site.baseurl }}{{ wall.path }}'"
                   alt="{{ wall_name }}" loading="lazy" decoding="async">
              <span class="wallpaper-zoom" aria-hidden="true"><i class="ph ph-arrows-out"></i></span>
            </button>
            <div class="wallpaper-info">
              <span class="wallpaper-name">{{ wall_name }}</span>
              <a class="wallpaper-dl" href="{{ site.baseurl }}{{ wall.path }}" download="{{ wall.name }}">
                <i class="ph ph-download-simple" aria-hidden="true"></i> Save
              </a>
            </div>
          </div>
          {% endunless %}
          {% endfor %}
        </div>
      {% endif %}
      {% endunless %}
      {% endfor %}
    {% else %}
    <div class="wallpaper-empty">
      <i class="ph ph-image-broken" aria-hidden="true"></i>
      <p>No desktop wallpapers yet — check back soon.</p>
    </div>
    {% endif %}
  </div>

  <!-- Mobile tab -->
  <div id="tab-mobile" role="tabpanel" aria-labelledby="btn-mobile" class="wallpaper-panel" hidden>
    {% if _mobile_count > 0 %}
      {% for group in _mobile_groups %}
      {% unless group.name == 'thumbs' %}
      {% assign _has_orig = false %}
      {% for _w in group.items %}{% unless _w.path contains '/thumbs/' %}{% assign _has_orig = true %}{% endunless %}{% endfor %}
      {% if _has_orig %}
        {% unless group.name contains '.' %}
        <h3 class="wallpaper-group-title">{{ group.name | replace: '-', ' ' | replace: '_', ' ' }}</h3>
        {% endunless %}
        <div class="wallpaper-grid wallpaper-grid--mobile">
          {% for wall in group.items %}
          {% unless wall.path contains '/thumbs/' %}
          {% assign _thumb_path = wall.path | replace: wall.name, 'thumbs/' | append: wall.basename | append: '.jpg' %}
          {% assign wall_name = wall.basename | replace: '-', ' ' | replace: '_', ' ' %}
          <div class="wallpaper-card">
            <button class="wallpaper-thumb-wrap wallpaper-thumb-wrap--mobile"
                    data-full="{{ site.baseurl }}{{ wall.path }}"
                    aria-label="Preview {{ wall_name }}">
              <img class="wallpaper-thumb"
                   src="{{ site.baseurl }}{{ _thumb_path }}"
                   onerror="this.onerror=null;this.src='{{ site.baseurl }}{{ wall.path }}'"
                   alt="{{ wall_name }}" loading="lazy" decoding="async">
              <span class="wallpaper-zoom" aria-hidden="true"><i class="ph ph-arrows-out"></i></span>
            </button>
            <div class="wallpaper-info">
              <span class="wallpaper-name">{{ wall_name }}</span>
              <a class="wallpaper-dl" href="{{ site.baseurl }}{{ wall.path }}" download="{{ wall.name }}">
                <i class="ph ph-download-simple" aria-hidden="true"></i> Save
              </a>
            </div>
          </div>
          {% endunless %}
          {% endfor %}
        </div>
      {% endif %}
      {% endunless %}
      {% endfor %}
    {% else %}
    <div class="wallpaper-empty">
      <i class="ph ph-image-broken" aria-hidden="true"></i>
      <p>No mobile wallpapers yet — check back soon.</p>
    </div>
    {% endif %}
  </div>

</div>

<script>
(function () {
  document.querySelectorAll('.wallpaper-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var target = tab.dataset.tab;
      document.querySelectorAll('.wallpaper-tab').forEach(function (t) {
        var on = t.dataset.tab === target;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
      });
      document.querySelectorAll('.wallpaper-panel').forEach(function (p) {
        var show = p.id === 'tab-' + target;
        p.classList.toggle('is-active', show);
        if (show) p.removeAttribute('hidden'); else p.setAttribute('hidden', '');
      });
    });
  });

  document.querySelectorAll('.wallpaper-thumb-wrap[data-full]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (window._lbOpen) window._lbOpen([btn.dataset.full], 0);
    });
  });
}());
</script>
