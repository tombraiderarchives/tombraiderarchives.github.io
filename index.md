---
layout: default
title: Home
---

{% comment %}Build JS data array of game screenshots for the random-image widget.{% endcomment %}
<script>
window._archiveShots = [
  {% assign _first = true %}
  {% for _p in site.pages %}{% if _p.image_folder and _p.layout == "game" %}{% assign _pfx = "/images/" | append: _p.image_folder | append: "/screenshots/thumbs/" %}{% for _sf in site.static_files %}{% if _sf.path contains _pfx %}{% unless _first %},{% endunless %}{% assign _first = false %}
  {"thumb":{{ _sf.path | jsonify }},"full":{{ _sf.path | replace: "/thumbs/", "/" | jsonify }},"title":{{ _p.title | jsonify }},"url":{{ _p.url | jsonify }}}{% endif %}{% endfor %}{% endif %}{% endfor %}

];
</script>

<div class="home-hero">
  <h1>Tomb Raider Archives</h1>
  <p>A comprehensive archive of the Tomb Raider franchise &mdash; games, movies, and series.</p>
</div>

<section class="news-section">
  <h2 class="section-title">Latest News</h2>
  <div class="news-list news-list--full">
    {% for post in site.posts limit:5 %}
    <article class="news-item{% unless post.header_image %} news-item--no-img{% endunless %}" data-href="{{ post.url }}">
      {% if post.header_image %}
      <div class="news-item-img-wrap" style="--blur-bg: url('{{ post.header_image | escape }}')">
        <img src="{{ post.header_image }}" alt="" class="news-item-img" loading="lazy" decoding="async">
      </div>
      {% else %}
      <div class="news-item-placeholder" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      </div>
      {% endif %}
      <div class="news-item-body">
        <div class="news-item-top">
          <span class="news-item-meta">{{ post.date | date: "%b %d, %Y" }}</span>
          {% if post.source_name %}<span class="news-source">{{ post.source_name }}</span>{% endif %}
          {% if post.category %}<span class="category-badge">{{ post.category }}</span>{% endif %}
        </div>
        <h3 class="news-item-title"><a href="{{ post.url }}">{{ post.title }}</a></h3>
        {% if post.excerpt_text %}
        <p class="news-item-excerpt">{{ post.excerpt_text }}</p>
        {% endif %}
        <span class="news-read-more">Read more <span aria-hidden="true">&rarr;</span></span>
      </div>
    </article>
    {% endfor %}
  </div>
  <p class="news-view-all"><a href="/news/" class="news-read-more">View all news <span aria-hidden="true">&rarr;</span></a></p>
</section>

<div class="home-media-row">

  <section class="random-image-section">
    <h2 class="section-title">Random Image</h2>
    <div id="randomShot" class="random-shot" aria-live="polite">
      <div class="random-shot-placeholder">
        <i class="ph ph-image" aria-hidden="true"></i>
        <span>Loading&hellip;</span>
      </div>
    </div>
  </section>

  <section class="yt-section">
    <h2 class="section-title">Latest Videos</h2>
    {% if site.data.youtube_videos and site.data.youtube_videos.size > 0 %}
    <div class="yt-list">
      {% for v in site.data.youtube_videos limit:4 %}
      {% assign yt_url = "https://www.youtube.com/watch?v=" | append: v.id %}
      <article class="yt-card">
        <a href="{{ yt_url }}" target="_blank" rel="noopener noreferrer" class="yt-thumb-wrap">
          {% if v.thumb %}
          <img class="yt-thumb" src="{{ v.thumb }}" alt="" loading="lazy" decoding="async">
          {% else %}
          <div class="yt-thumb-ph"></div>
          {% endif %}
          <span class="yt-play-btn" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M8 5v14l11-7z"/></svg>
          </span>
        </a>
        <div class="yt-card-body">
          <p class="yt-card-title"><a href="{{ yt_url }}" target="_blank" rel="noopener noreferrer">{{ v.title }}</a></p>
          {% if v.published %}<p class="yt-card-meta">{{ v.published | date: "%b %d, %Y" }}</p>{% endif %}
        </div>
      </article>
      {% endfor %}
    </div>
    {% else %}
    <div class="yt-placeholder">
      <i class="ph ph-youtube-logo" aria-hidden="true"></i>
      <p>Latest videos will appear here after the first bot run.</p>
    </div>
    {% endif %}
    <p class="yt-channel-link">
      <a href="https://www.youtube.com/@tombraider" target="_blank" rel="noopener noreferrer">
        View channel on YouTube <span aria-hidden="true">&rarr;</span>
      </a>
    </p>
  </section>

</div>

<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer">
  <button class="lb-btn lb-close" id="lbClose" aria-label="Close image viewer">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <line x1="1" y1="1" x2="15" y2="15" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
      <line x1="15" y1="1" x2="1"  y2="15" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
    </svg>
  </button>
  <button class="lb-btn lb-prev" id="lbPrev" aria-label="Previous image">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </button>
  <div class="lb-img-wrap">
    <img id="lbImg" src="" alt="" decoding="async">
  </div>
  <button class="lb-btn lb-next" id="lbNext" aria-label="Next image">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </button>
  <p class="lb-counter" id="lbCounter" aria-live="polite"></p>
</div>
