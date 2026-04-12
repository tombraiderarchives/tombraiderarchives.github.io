---
layout: default
title: Home
---

{% comment %}Build JS data array of game screenshots for the random-shot widget.
  Iterates game pages that have image_folder, then finds matching screenshot thumbnails.{% endcomment %}
<script>
window._archiveShots = [
  {% assign _first = true %}
  {% for _p in site.pages %}{% if _p.image_folder and _p.layout == "game" %}{% assign _pfx = "/images/" | append: _p.image_folder | append: "/screenshots/thumbs/" %}{% for _sf in site.static_files %}{% if _sf.path contains _pfx %}{% unless _first %},{% endunless %}{% assign _first = false %}
  {"thumb":{{ _sf.path | jsonify }},"full":{{ _sf.path | replace: "/thumbs/", "/" | jsonify }},"title":{{ _p.title | jsonify }},"url":{{ _p.url | jsonify }}}{% endif %}{% endfor %}{% endif %}{% endfor %}

];
</script>

<div class="home-hero">
  <p class="home-hero-eyebrow"><i class="ph ph-shooting-star" aria-hidden="true"></i> The Complete Franchise Archive</p>
  <h1>Tomb Raider <em>Archives</em></h1>
  <p class="home-hero-tagline">Games, movies, series, lore &mdash; every entry in the Tomb Raider franchise, documented in full.</p>
  <nav class="home-hero-links" aria-label="Quick navigation">
    <a class="home-hero-link" href="/games/"><i class="ph ph-game-controller" aria-hidden="true"></i> Games</a>
    <a class="home-hero-link" href="/media/"><i class="ph ph-film-slate" aria-hidden="true"></i> Media</a>
    <a class="home-hero-link" href="/lore/characters/"><i class="ph ph-book-open" aria-hidden="true"></i> Lore</a>
    <a class="home-hero-link" href="/news/"><i class="ph ph-newspaper" aria-hidden="true"></i> News</a>
  </nav>
</div>

<div class="home-grid">

  <div class="home-col">
    <h2 class="section-title">Screenshot of the Day</h2>
    <div id="randomShot" class="random-shot" aria-live="polite">
      <div class="random-shot-placeholder">
        <i class="ph ph-image" aria-hidden="true"></i>
        <span>Loading&hellip;</span>
      </div>
    </div>
  </div>

  <div class="home-col">
    <h2 class="section-title">Latest from @TombRaider</h2>
    <div class="social-feed-wrap">
      <a class="twitter-timeline"
         data-dnt="true"
         data-height="420"
         id="twitterTimeline"
         href="https://twitter.com/tombraider">Tweets by TombRaider</a>
      <script>
        (function(){
          var el = document.getElementById('twitterTimeline');
          if (el) el.setAttribute('data-theme', localStorage.getItem('theme') === 'light' ? 'light' : 'dark');
        })();
      </script>
      <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
    </div>
  </div>

</div>

<section class="news-section">
  <h2 class="section-title">Latest News</h2>
  <div class="news-list">
    {% for post in site.posts limit:3 %}
    <article class="news-item" data-href="{{ post.url }}">
      <p class="news-item-meta">{{ post.date | date: "%B %d, %Y" }}</p>
      <h3 class="news-item-title"><a href="{{ post.url }}">{{ post.title }}</a></h3>
      {% if post.excerpt_text %}
      <p class="news-item-excerpt">{{ post.excerpt_text }}</p>
      {% endif %}
      <span class="news-read-more">Read more <span aria-hidden="true">&rarr;</span></span>
    </article>
    {% endfor %}
  </div>
  <p class="news-view-all"><a href="/news/" class="news-read-more">View all news <span aria-hidden="true">&rarr;</span></a></p>
</section>
