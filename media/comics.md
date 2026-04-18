---
layout: default
title: Comics
---

<div class="page-hero">
  <div class="page-hero-banner" aria-hidden="true">
    <svg viewBox="0 0 880 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="cmxgrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="var(--accent)" stop-opacity=".08"/>
          <stop offset="100%" stop-color="var(--secondary)" stop-opacity=".03"/>
        </linearGradient>
      </defs>
      <rect width="880" height="100" fill="url(#cmxgrad)"/>
      <rect x="60"  y="20" width="40" height="55" rx="2" fill="none" stroke="var(--accent)" stroke-opacity=".12" stroke-width="1"/>
      <rect x="110" y="15" width="40" height="55" rx="2" fill="none" stroke="var(--accent)" stroke-opacity=".10" stroke-width="1"/>
      <rect x="160" y="22" width="40" height="55" rx="2" fill="none" stroke="var(--accent)" stroke-opacity=".09" stroke-width="1"/>
      <rect x="210" y="18" width="40" height="55" rx="2" fill="none" stroke="var(--accent)" stroke-opacity=".08" stroke-width="1"/>
      <rect x="260" y="24" width="40" height="55" rx="2" fill="none" stroke="var(--accent)" stroke-opacity=".07" stroke-width="1"/>
      <rect x="310" y="16" width="40" height="55" rx="2" fill="none" stroke="var(--accent)" stroke-opacity=".06" stroke-width="1"/>
      <rect x="360" y="21" width="40" height="55" rx="2" fill="none" stroke="var(--accent)" stroke-opacity=".06" stroke-width="1"/>
      <rect x="780" y="20" width="40" height="55" rx="2" fill="none" stroke="var(--accent)" stroke-opacity=".07" stroke-width="1"/>
      <rect x="730" y="17" width="40" height="55" rx="2" fill="none" stroke="var(--accent)" stroke-opacity=".06" stroke-width="1"/>
    </svg>
  </div>
  <h1>Comics</h1>
  <p>Tomb Raider comics spanned the late 1990s through the mid-2000s, primarily published by Top Cow Productions. The series ranged from ongoing monthly titles to companion series, one-shots, and crossovers with other Top Cow properties.</p>
</div>

<!-- ── Tomb Raider: The Series ────────────────────────────────────────────── -->

<div class="comic-series-block">
  <div class="comic-series-header-wrap">
    <img src="{{ site.baseurl }}/images/comics/tomb-raider-the-series/header.jpg"
         alt="Tomb Raider: The Series banner"
         class="comic-series-header"
         loading="lazy">
  </div>
  <div class="comic-series-meta">
    <h2 class="comic-series-name"><a href="{{ site.baseurl }}/media/comics/tomb-raider-the-series/" style="color:inherit;text-decoration:none;">Tomb Raider: The Series</a></h2>
    <p class="comic-series-pub">Top Cow Productions &nbsp;·&nbsp; 1999–2005 &nbsp;·&nbsp; #0–#50 + Special #0</p>
    <p class="comic-series-desc">The flagship ongoing series. Written primarily by Dan Jurgens and illustrated by Andy Park, Adam Hughes, and others — one of Top Cow's best-selling titles during its run, and the source of some of the most celebrated non-game Tomb Raider artwork of the era.</p>
    <a href="{{ site.baseurl }}/media/comics/tomb-raider-the-series/" class="comic-series-link">View all issues &rarr;</a>
  </div>

  <div class="comic-grid">
    <a href="{{ site.baseurl }}/images/comics/tomb-raider-the-series/issues/!00.jpg"
       class="comic-issue" target="_blank">
      <img src="{{ site.baseurl }}/images/comics/tomb-raider-the-series/issues/thumbs/!00.jpg"
           alt="Tomb Raider: The Series Special #0" loading="lazy">
      <span class="comic-issue-num">Special #0</span>
    </a>
    <a href="{{ site.baseurl }}/images/comics/tomb-raider-the-series/issues/00.jpg"
       class="comic-issue" target="_blank">
      <img src="{{ site.baseurl }}/images/comics/tomb-raider-the-series/issues/thumbs/00.jpg"
           alt="Tomb Raider: The Series #0" loading="lazy">
      <span class="comic-issue-num">#0</span>
    </a>
    {% for i in (1..50) %}
    {% assign padded = i | prepend: '00' | slice: -2, 2 %}
    <a href="{{ site.baseurl }}/images/comics/tomb-raider-the-series/issues/{{ padded }}.jpg"
       class="comic-issue" target="_blank">
      <img src="{{ site.baseurl }}/images/comics/tomb-raider-the-series/issues/thumbs/{{ padded }}.jpg"
           alt="Tomb Raider: The Series #{{ i }}" loading="lazy">
      <span class="comic-issue-num">#{{ i }}</span>
    </a>
    {% endfor %}
  </div>
</div>

<!-- ── Tomb Raider: Journeys ──────────────────────────────────────────────── -->

<div class="comic-series-block">
  <div class="comic-series-meta" style="border-radius: var(--radius);">
    <h2 class="comic-series-name"><a href="{{ site.baseurl }}/media/comics/tomb-raider-journeys/" style="color:inherit;text-decoration:none;">Tomb Raider: Journeys</a></h2>
    <p class="comic-series-pub">Top Cow Productions &nbsp;·&nbsp; 2001–2003 &nbsp;·&nbsp; 12 issues</p>
    <p class="comic-series-desc">A companion series running concurrently with <em>The Series</em>, telling self-contained stories with a rotating roster of writers and artists. Each issue stands alone, making it a more accessible entry point than the ongoing title.</p>
    <a href="{{ site.baseurl }}/media/comics/tomb-raider-journeys/" class="comic-series-link">View all issues &rarr;</a>
  </div>

  <div class="comic-grid">
    {% for i in (1..12) %}
    {% assign padded = i | prepend: '00' | slice: -2, 2 %}
    <a href="{{ site.baseurl }}/images/comics/tomb-raider-journeys/issues/{{ padded }}.jpg"
       class="comic-issue" target="_blank">
      <img src="{{ site.baseurl }}/images/comics/tomb-raider-journeys/issues/thumbs/{{ padded }}.jpg"
           alt="Tomb Raider: Journeys #{{ i }}" loading="lazy">
      <span class="comic-issue-num">#{{ i }}</span>
    </a>
    {% endfor %}
  </div>
</div>

<!-- ── One-Shots ──────────────────────────────────────────────────────────── -->

<div class="comic-series-block">
  <div class="comic-series-meta" style="border-radius: var(--radius);">
    <h2 class="comic-series-name"><a href="{{ site.baseurl }}/media/comics/tomb-raider-one-shots/" style="color:inherit;text-decoration:none;">One-Shots &amp; Specials</a></h2>
    <p class="comic-series-pub">Top Cow Productions &nbsp;·&nbsp; Various years &nbsp;·&nbsp; 11 issues</p>
    <p class="comic-series-desc">Standalone issues and prestige-format specials. These frequently attracted higher-profile talent than the monthly series, and include anniversary publications, introductory jumping-on-point issues, and tie-in specials.</p>
    <a href="{{ site.baseurl }}/media/comics/tomb-raider-one-shots/" class="comic-series-link">View all issues &rarr;</a>
  </div>

  <div class="comic-grid">
    {% for i in (1..11) %}
    {% assign padded = i | prepend: '00' | slice: -2, 2 %}
    <a href="{{ site.baseurl }}/images/comics/tomb-raider-one-shots/issues/{{ padded }}.jpg"
       class="comic-issue" target="_blank">
      <img src="{{ site.baseurl }}/images/comics/tomb-raider-one-shots/issues/thumbs/{{ padded }}.jpg"
           alt="One-shot #{{ i }}" loading="lazy"
           onerror="this.src='{{ site.baseurl }}/images/comics/tomb-raider-one-shots/issues/thumbs/{{ padded }}.JPG'">
      <span class="comic-issue-num">#{{ i }}</span>
    </a>
    {% endfor %}
  </div>
</div>

<!-- ── Crossovers ─────────────────────────────────────────────────────────── -->

<div class="comic-series-block">
  <div class="comic-series-meta" style="border-radius: var(--radius);">
    <h2 class="comic-series-name"><a href="{{ site.baseurl }}/media/comics/tomb-raider-crossovers/" style="color:inherit;text-decoration:none;">Crossovers</a></h2>
    <p class="comic-series-pub">Top Cow Productions &nbsp;·&nbsp; Various years &nbsp;·&nbsp; 4 issues</p>
    <p class="comic-series-desc">Lara Croft crossing into the wider Top Cow universe — Witchblade, The Darkness, and others. Rare, sought-after issues that sit at the intersection of two distinct publishing traditions.</p>
    <a href="{{ site.baseurl }}/media/comics/tomb-raider-crossovers/" class="comic-series-link">View all issues &rarr;</a>
  </div>

  <div class="comic-grid">
    {% for i in (1..4) %}
    {% assign padded = i | prepend: '00' | slice: -2, 2 %}
    <a href="{{ site.baseurl }}/images/comics/tomb-raider-crossovers/issues/{{ padded }}.jpg"
       class="comic-issue" target="_blank">
      <img src="{{ site.baseurl }}/images/comics/tomb-raider-crossovers/issues/thumbs/{{ padded }}.jpg"
           alt="Crossover #{{ i }}" loading="lazy"
           onerror="this.onerror=null;this.src='{{ site.baseurl }}/images/comics/tomb-raider-crossovers/issues/{{ padded }}.jpg'">
      <span class="comic-issue-num">#{{ i }}</span>
    </a>
    {% endfor %}
  </div>
</div>
