---
layout: default
title: Home
---

{% comment %}Build JS data array of game screenshots for the random-shot widget.{% endcomment %}
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

<section class="screenshot-section">
  <h2 class="section-title">Screenshot of the Day</h2>
  <div id="randomShot" class="random-shot" aria-live="polite">
    <div class="random-shot-placeholder">
      <i class="ph ph-image" aria-hidden="true"></i>
      <span>Loading&hellip;</span>
    </div>
  </div>
</section>

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
