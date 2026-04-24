---
layout: default
title: Wallpapers
permalink: /downloads/wallpapers/
games:
  - folder: tr1
    name: Tomb Raider
  - folder: tr2
    name: Tomb Raider II
  - folder: tr3
    name: Tomb Raider III
  - folder: tr4
    name: The Last Revelation
  - folder: tr5
    name: Chronicles
  - folder: tr6
    name: Angel of Darkness
---

{% assign _all_thumbs = site.static_files | where_exp: "f", "f.path contains '/wallpapers/thumbs/'" | where_exp: "f", "f.path contains '/images/'" | where_exp: "f", "f.name != '.gitkeep'" %}

<div class="page-section">
  <div class="page-section-header">
    <h1 class="page-section-title">
      <i class="ph ph-image" aria-hidden="true"></i>
      Wallpapers
    </h1>
    <p class="page-section-desc">Free Tomb Raider wallpapers — click any image to preview it full size, then hit the save button to download.</p>
  </div>

  {% if _all_thumbs.size > 0 %}

  {% comment %}Build game nav only if more than one game has wallpapers{% endcomment %}
  {% assign _nav_games = "" | split: "" %}
  {% for game in page.games %}
    {% assign _gfrag = "/images/" | append: game.folder | append: "/wallpapers/thumbs/" %}
    {% assign _gt = _all_thumbs | where_exp: "f", "f.path contains _gfrag" %}
    {% if _gt.size > 0 %}{% assign _nav_games = _nav_games | push: game %}{% endif %}
  {% endfor %}

  {% if _nav_games.size > 1 %}
  <nav class="wallpaper-game-nav" aria-label="Jump to game">
    {% for game in _nav_games %}
    {% assign _sid = game.folder %}
    <a href="#wp-{{ _sid }}" class="wallpaper-game-link">{{ game.name }}</a>
    {% endfor %}
  </nav>
  {% endif %}

  {% for game in page.games %}
    {% assign _gfrag = "/images/" | append: game.folder | append: "/wallpapers/thumbs/" %}
    {% assign _game_thumbs = _all_thumbs | where_exp: "f", "f.path contains _gfrag" | sort: "name" %}
    {% if _game_thumbs.size > 0 %}
    <h3 class="wallpaper-group-title" id="wp-{{ game.folder }}">{{ game.name }}</h3>
    <div class="wallpaper-grid">
      {% for thumb in _game_thumbs %}
      {% assign full = thumb.path | replace: "/thumbs/", "/" %}
      {% assign wall_name = thumb.basename | replace: '-', ' ' | replace: '_', ' ' %}
      <div class="wallpaper-card">
        <button class="wallpaper-thumb-wrap" data-full="{{ site.baseurl }}{{ full }}"
                aria-label="Preview {{ wall_name }}">
          <img class="wallpaper-thumb"
               src="{{ site.baseurl }}{{ thumb.path }}"
               onerror="this.onerror=null;this.src='{{ site.baseurl }}{{ full }}'"
               alt="{{ wall_name }}" loading="lazy" decoding="async">
          <span class="wallpaper-zoom" aria-hidden="true"><i class="ph ph-arrows-out"></i></span>
        </button>
        <div class="wallpaper-info">
          <span class="wallpaper-name">{{ wall_name }}</span>
          <a class="wallpaper-dl" href="{{ site.baseurl }}{{ full }}" download="{{ thumb.name }}">
            <i class="ph ph-download-simple" aria-hidden="true"></i> Save
          </a>
        </div>
      </div>
      {% endfor %}
    </div>
    {% endif %}
  {% endfor %}

  {% else %}
  <div class="wallpaper-empty">
    <i class="ph ph-image-broken" aria-hidden="true"></i>
    <p>No wallpapers yet — check back soon.</p>
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
