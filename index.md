---
layout: default
title: Home
---

<div class="home-hero">
  <h1>Tomb Raider Archives</h1>
  <p>A comprehensive archive of the Tomb Raider franchise &mdash; games, movies, and series.</p>
</div>

<section class="news-section">
  <h2 class="section-title">Latest News</h2>
  <div class="news-list news-list--featured">
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

<section class="yt-section" style="margin-top:2.5rem">
  <h2 class="section-title">Latest Official Video</h2>
  <div class="random-shot">
    <div class="yt-embed-wrap">
      <div id="yt-player"></div>
    </div>
    <div class="random-shot-meta">
      <a class="random-shot-game" href="https://www.youtube.com/@tombraider" target="_blank" rel="noopener noreferrer">
        <i class="ph ph-youtube-logo" aria-hidden="true"></i>
        Tomb Raider on YouTube
      </a>
      <a class="random-shot-view" href="https://www.youtube.com/@tombraider" target="_blank" rel="noopener noreferrer">
        View channel <span aria-hidden="true">&rarr;</span>
      </a>
    </div>
  </div>
</section>

<script>
/* ── YouTube IFrame Player — stop after each video (no playlist auto-advance) */
(function () {
  // 1. Define the callback BEFORE injecting the API script
  var ytPlayer;
  window.onYouTubeIframeAPIReady = function () {
    ytPlayer = new YT.Player('yt-player', {
      host: 'https://www.youtube-nocookie.com',
      playerVars: {
        listType:       'playlist',
        list:           'UUaAUQeeSpnQmeEhPl1Rru0A',
        rel:            0,
        autoplay:       0,
        modestbranding: 1,
        fs:             1
      },
      events: {
        onStateChange: function (event) {
          // When a video finishes, stop instead of advancing to next video
          if (event.data === YT.PlayerState.ENDED) {
            event.target.stopVideo();
          }
        }
      }
    });
  };

  // 2. Inject the API script — triggers the callback above once loaded
  var tag   = document.createElement('script');
  tag.src   = 'https://www.youtube.com/iframe_api';
  var first = document.getElementsByTagName('script')[0];
  first.parentNode.insertBefore(tag, first);
}());
</script>

