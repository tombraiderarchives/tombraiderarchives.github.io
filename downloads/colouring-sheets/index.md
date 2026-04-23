---
layout: default
title: Colouring Sheets
permalink: /downloads/colouring-sheets/
---

{% assign _sheets = site.static_files | where_exp: "f", "f.path contains '/downloads/colouring-sheets/'" | where_exp: "f", "f.name != '.gitkeep'" | where_exp: "f", "f.path contains '/thumbs/'" | sort: "name" %}
{% assign _all = site.static_files | where_exp: "f", "f.path contains '/downloads/colouring-sheets/'" | where_exp: "f", "f.name != '.gitkeep'" %}
{% assign _count = 0 %}
{% for f in _all %}{% unless f.path contains '/thumbs/' %}{% assign _count = _count | plus: 1 %}{% endunless %}{% endfor %}

<div class="page-section">
  <div class="page-section-header">
    <h1 class="page-section-title">
      <i class="ph ph-pencil-line" aria-hidden="true"></i>
      Colouring Sheets
    </h1>
    <p class="page-section-desc">Free Tomb Raider colouring sheets — click any image to preview it full size, then hit the save button to download and print.</p>
  </div>

  {% if _count > 0 %}
  <div class="wallpaper-grid">
    {% for f in _all %}
    {% unless f.path contains '/thumbs/' %}
    {% assign _thumb_path = f.path | replace: f.name, 'thumbs/' | append: f.basename | append: '.jpg' %}
    {% assign sheet_name = f.basename | replace: '-', ' ' | replace: '_', ' ' %}
    <div class="wallpaper-card">
      <button class="wallpaper-thumb-wrap" data-full="{{ site.baseurl }}{{ f.path }}"
              aria-label="Preview {{ sheet_name }}">
        <img class="wallpaper-thumb"
             src="{{ site.baseurl }}{{ _thumb_path }}"
             onerror="this.onerror=null;this.src='{{ site.baseurl }}{{ f.path }}'"
             alt="{{ sheet_name }}" loading="lazy" decoding="async">
        <span class="wallpaper-zoom" aria-hidden="true"><i class="ph ph-arrows-out"></i></span>
      </button>
      <div class="wallpaper-info">
        <span class="wallpaper-name">{{ sheet_name }}</span>
        <a class="wallpaper-dl" href="{{ site.baseurl }}{{ f.path }}" download="{{ f.name }}">
          <i class="ph ph-download-simple" aria-hidden="true"></i> Save
        </a>
      </div>
    </div>
    {% endunless %}
    {% endfor %}
  </div>
  {% else %}
  <div class="wallpaper-empty">
    <i class="ph ph-pencil-slash" aria-hidden="true"></i>
    <p>No colouring sheets yet — check back soon.</p>
  </div>
  {% endif %}
</div>

<script>
(function () {
  document.querySelectorAll('.wallpaper-thumb-wrap[data-full]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (window._lbOpen) window._lbOpen([btn.dataset.full], 0);
    });
  });
}());
</script>
