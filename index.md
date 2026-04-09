---
layout: default
title: Home
---

<div class="home-hero">
  <h1>Tomb Raider Archives</h1>
  <p>A comprehensive archive of the Tomb Raider franchise — games, movies, and series.</p>
</div>

<section class="news-section">
  <h2>Latest News</h2>
  <div class="news-list">
    {% for post in site.posts limit:5 %}
    <article class="news-item">
      <p class="news-item-meta">{{ post.date | date: "%B %d, %Y" }}</p>
      <h3 class="news-item-title"><a href="{{ post.url }}">{{ post.title }}</a></h3>
      {% if post.excerpt_text %}
      <p class="news-item-excerpt">{{ post.excerpt_text }}</p>
      {% endif %}
      <a href="{{ post.url }}" class="news-read-more">Read more <span aria-hidden="true">&rarr;</span></a>
    </article>
    {% endfor %}
  </div>
</section>
