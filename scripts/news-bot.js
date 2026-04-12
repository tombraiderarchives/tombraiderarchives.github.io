#!/usr/bin/env node
/**
 * Tomb Raider Archives — News Bot (hybrid RSS + Puppeteer)
 *
 * 1. Fetches article list via Google News RSS — plain HTTPS, always reliable,
 *    no browser-detection issues
 * 2. For each article, launches a Puppeteer page to follow the Google News
 *    redirect URL to the real article, then scrapes:
 *      - og:image / twitter:image (full quality)
 *      - Readable article text via live DOM manipulation
 * 3. Optionally summarises with Claude Haiku if ANTHROPIC_API_KEY is set
 * 4. Writes Jekyll post files to news/_posts/
 *
 * Why hybrid?
 *   Scraping the Google News *search page* from GitHub Actions IPs triggers
 *   Google's consent/captcha wall, so the listing page returns zero articles.
 *   The RSS feed is a simple XML endpoint with no such restriction.
 *   Puppeteer is reserved for individual article pages where it shines:
 *   proper redirect following, og:image extraction, and clean DOM-based text.
 */

'use strict';

const puppeteer = require('puppeteer');
const https     = require('https');
const http      = require('http');
const fs        = require('fs');
const path      = require('path');

// ── Config ────────────────────────────────────────────────────────────────────

const RSS_URL          = 'https://news.google.com/rss/search?q=tomb+raider&hl=en-US&gl=US&ceid=US:en';
const POSTS_DIR        = path.join(__dirname, '..', 'news', '_posts');
const MAX_PER_RUN      = 5;      // posts per run — don't flood
const MAX_AGE_DAYS     = 7;      // ignore articles older than this
const MAX_ARTICLE_CHARS = 5000;  // max chars of article text sent to Claude

// YouTube — official Tomb Raider channel RSS (no API key needed, public feed).
// Channel ID: go to youtube.com/@tombraider → view-source → search "channelId"
const YT_CHANNEL_ID = 'UCO_MlRMBJSI3k3RNbcR_wxA';
const YT_DATA_FILE  = path.join(__dirname, '..', '_data', 'youtube_videos.json');
const YT_MAX_VIDEOS = 4;

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// ── Plain HTTPS fetch (for RSS only) ─────────────────────────────────────────

function fetchUrl(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 8) return reject(new Error('Too many redirects'));
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/rss+xml,text/xml,*/*' }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let next = res.headers.location;
        if (next.startsWith('/')) { try { next = new URL(next, url).href; } catch {} }
        res.resume();
        return resolve(fetchUrl(next, redirects + 1));
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// ── RSS parsing ───────────────────────────────────────────────────────────────

function decodeEntities(str) {
  return str
    .replace(/&amp;/g,  '&').replace(/&lt;/g,   '<').replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g,  "'").replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

function extractCDATA(str) {
  const m = str.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return m ? m[1] : str;
}

function tagContent(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? decodeEntities(extractCDATA(m[1].trim())) : '';
}

function parseRSS(xml) {
  const items   = [];
  const cutoff  = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const matches = xml.match(/<item>([\s\S]*?)<\/item>/gi) || [];

  for (const block of matches) {
    const title      = tagContent(block, 'title');
    const link       = tagContent(block, 'link').replace(/\s/g, '');
    const pubDate    = tagContent(block, 'pubDate');
    const sourceName = block.match(/<source[^>]*>([^<]*)<\/source>/i)?.[1]?.trim() || '';
    const description = tagContent(block, 'description')
      .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    if (!title || !link) continue;

    const published = pubDate ? new Date(pubDate) : null;
    if (published && !isNaN(published) && published.getTime() < cutoff) continue;

    items.push({ title, link, description, pubDate, sourceName });
  }
  return items;
}

// ── Deduplication ─────────────────────────────────────────────────────────────

function getExistingSourceUrls() {
  const urls = new Set();
  if (!fs.existsSync(POSTS_DIR)) return urls;
  for (const file of fs.readdirSync(POSTS_DIR)) {
    if (!file.endsWith('.md')) continue;
    const content = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
    for (const field of ['source_url', 'source_rss_url']) {
      const m = content.match(new RegExp(`^${field}:\\s*["']?([^"'\\n]+)`, 'm'));
      if (m) urls.add(m[1].trim());
    }
  }
  return urls;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(str) {
  return str.toLowerCase()
    .replace(/['']/g, '').replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 60);
}

function formatDate(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  return (isNaN(d) ? new Date() : d).toISOString().slice(0, 10);
}

function inferCategory(title, text) {
  const t = (title + ' ' + text).toLowerCase();
  if (/\btrailer\b|\bgameplay\b/.test(t))                      return 'Trailer';
  if (/\bannounce|\breveal\b|\bteaser\b/.test(t))              return 'Announcement';
  if (/\brelease\b|\blaunch\b|\bout now\b|\bships\b/.test(t)) return 'Release';
  if (/\bdlc\b|\bupdate\b|\bpatch\b/.test(t))                 return 'Development Update';
  if (/\bmerch\b|\bfigurine\b|\bcollectible\b/.test(t))       return 'Merchandise';
  if (/\bevent\b|\bexpo\b|\bgamescom\b|\bsgf\b/.test(t))      return 'Event';
  if (/\brumou?r\b|\bleak\b/.test(t))                         return 'Rumour';
  return 'News';
}

/** Strip " - Source Name" suffix that Google News appends to RSS titles. */
function cleanTitle(rawTitle, sourceName) {
  let title = rawTitle;
  if (sourceName) {
    const esc = sourceName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const cleaned = title.replace(new RegExp(`\\s*[-–|]\\s*${esc}\\s*$`, 'i'), '').trim();
    if (cleaned && cleaned.length > 10) title = cleaned;
  }
  // Fallback: strip generic " - Publication" trailing pattern
  if (title === rawTitle) {
    const fallback = title.replace(/\s*[-–]\s*[A-Z][^-–]{2,50}$/, '').trim();
    if (fallback && fallback.length > 10) title = fallback;
  }
  return title || rawTitle;
}

/** Truncate to first complete sentence within maxLen, or word boundary + ellipsis. */
function makeExcerpt(text, maxLen = 220) {
  if (!text) return '';
  const firstPara = text.split(/\n\n+/)[0].replace(/\n/g, ' ').trim();
  if (firstPara.length <= maxLen) return firstPara;
  const trimmed = firstPara.slice(0, maxLen);
  const sentenceEnd = Math.max(
    trimmed.lastIndexOf('. '),
    trimmed.lastIndexOf('! '),
    trimmed.lastIndexOf('? ')
  );
  if (sentenceEnd > maxLen * 0.5) return trimmed.slice(0, sentenceEnd + 1).trim();
  const lastSpace = trimmed.lastIndexOf(' ');
  return (lastSpace > maxLen * 0.4 ? trimmed.slice(0, lastSpace) : trimmed).trim() + '…';
}

/**
 * Truncate body text gracefully:
 * - If over maxLen, cut at the last complete sentence within that limit.
 * - Always ensure the final text ends at a sentence boundary, even for
 *   short texts that arrived pre-truncated mid-word (e.g. RSS excerpts,
 *   raw article slices). Never leave the reader mid-sentence.
 */
function cleanBody(text, maxLen = 4000) {
  if (!text) return '';
  let body = text.trim();

  // Step 1 — hard length cap at sentence boundary
  if (body.length > maxLen) {
    const chunk = body.slice(0, maxLen);
    const sentEnd = Math.max(
      chunk.lastIndexOf('. '), chunk.lastIndexOf('! '),
      chunk.lastIndexOf('? '), chunk.lastIndexOf('.\n'),
      chunk.lastIndexOf('!\n'), chunk.lastIndexOf('?\n')
    );
    if (sentEnd > maxLen * 0.4) {
      body = chunk.slice(0, sentEnd + 1).trim();
    } else {
      const lastPara = chunk.lastIndexOf('\n\n');
      body = (lastPara > maxLen * 0.4 ? chunk.slice(0, lastPara) : chunk).trim();
    }
  }

  // Step 2 — if it still doesn't end cleanly, trim to last complete sentence
  // This catches pre-sliced text that ends mid-word or mid-sentence.
  if (!/[.!?]["']?\s*$/.test(body)) {
    const lastSent = Math.max(
      body.lastIndexOf('. '), body.lastIndexOf('! '),
      body.lastIndexOf('? '), body.lastIndexOf('.\n')
    );
    if (lastSent > body.length * 0.2) {
      body = body.slice(0, lastSent + 1).trim();
    } else {
      // No sentence found — at minimum trim to the last complete word
      const lastSpace = body.lastIndexOf(' ');
      if (lastSpace > body.length * 0.3) body = body.slice(0, lastSpace).trim();
    }
  }

  return body;
}

// ── YouTube latest videos ─────────────────────────────────────────────────────

async function fetchYouTubeVideos() {
  if (!YT_CHANNEL_ID) return [];
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${YT_CHANNEL_ID}`;
  console.log('Fetching YouTube feed…');
  let xml;
  try {
    xml = await fetchUrl(feedUrl);
  } catch (err) {
    console.warn(`  ⚠  YouTube fetch failed: ${err.message}`);
    return [];
  }

  const videos = [];
  const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g) || [];
  for (const entry of entries.slice(0, YT_MAX_VIDEOS)) {
    const videoId   = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1]?.trim();
    const rawTitle  = entry.match(/<title[^>]*>([^<]+)<\/title>/)?.[1]?.trim() || '';
    const published = entry.match(/<published>([^<]+)<\/published>/)?.[1]?.trim() || '';
    // Prefer media:thumbnail url attr (higher quality than mqdefault)
    const thumbM    = entry.match(/<media:thumbnail[^>]+url="([^"]+)"/);
    const thumb     = thumbM ? thumbM[1]
                             : (videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : '');
    if (!videoId || !rawTitle) continue;
    videos.push({
      id:        videoId,
      title:     decodeEntities(rawTitle),
      thumb,
      url:       `https://www.youtube.com/watch?v=${videoId}`,
      published,
    });
  }
  console.log(`  ✓  ${videos.length} YouTube video(s) fetched`);
  return videos;
}

// ── Claude summarisation ──────────────────────────────────────────────────────

async function summariseWithClaude(title, articleText, rssExcerpt, sourceUrl) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const sourceContent = articleText && articleText.length > 100 ? articleText : rssExcerpt;
  if (!sourceContent) return null;

  const prompt = articleText && articleText.length > 100
    ? `You are writing a news post for the Tomb Raider Archives fan website.\n` +
      `Based on the article text below, write 2–4 clear paragraphs summarising the news in your own words.\n` +
      `Be factual, informative, and engaging. Do not copy sentences verbatim.\n` +
      `Do not use an intro phrase like "In a recent article".\n` +
      `Write as if you are reporting the news directly.\n\n` +
      `Title: ${title}\nArticle text:\n${sourceContent}\n\nWrite only the summary paragraphs.`
    : `You are writing a short news blurb for the Tomb Raider Archives fan website.\n` +
      `Summarise this in 2–3 sentences. Be factual and concise.\n\n` +
      `Title: ${title}\nExcerpt: ${sourceContent}\nURL: ${sourceUrl}\n\nWrite only the summary.`;

  const body = JSON.stringify({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages:   [{ role: 'user', content: prompt }]
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.anthropic.com',
      path:     '/v1/messages',
      method:   'POST',
      headers: {
        'content-type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'content-length':    Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data).content?.[0]?.text?.trim() || null); }
        catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.write(body);
    req.end();
  });
}

// ── Puppeteer: fetch individual article page ──────────────────────────────────

async function fetchArticlePage(browser, googleNewsLink) {
  const page = await browser.newPage();
  await page.setUserAgent(USER_AGENT);

  try {
    // Navigate — Google News link redirects to the real article URL
    await page.goto(googleNewsLink, { waitUntil: 'domcontentloaded', timeout: 20000 });

    // Wait for any JS redirect to leave news.google.com, then let page settle
    await page.waitForFunction(
      () => !location.href.includes('news.google.com'),
      { timeout: 6000 }
    ).catch(() => {});
    await new Promise(r => setTimeout(r, 800));

    const finalUrl = page.url();

    // ── og:image ─────────────────────────────────────────────────────────────
    const imageUrl = await page.evaluate(() => {
      for (const sel of [
        'meta[property="og:image"]',
        'meta[name="twitter:image"]',
        'meta[name="twitter:image:src"]',
      ]) {
        const content = document.querySelector(sel)?.getAttribute('content');
        if (content && content.startsWith('http')) return content;
      }
      return null;
    });

    // ── Article text via live DOM ─────────────────────────────────────────────
    const articleText = await page.evaluate((maxChars) => {
      // Strip noise nodes in-place
      [
        'script', 'style', 'noscript', 'svg', 'nav', 'header', 'footer',
        'aside', 'form', 'figure', 'iframe',
        '[class*="cookie"]', '[class*="gdpr"]', '[class*="subscribe"]',
        '[class*="newsletter"]', '[class*="social"]', '[class*="share"]',
        '[class*="related"]', '[class*="recommend"]', '[class*="sidebar"]',
        '[class*="comment"]', '[class*="ad-"]', '[id*="ad-"]',
        '[class*="promo"]', '[class*="popup"]', '[class*="modal"]',
        '[class*="sticky"]', '[aria-label*="advertisement" i]',
      ].forEach(sel => {
        try { document.querySelectorAll(sel).forEach(el => el.remove()); }
        catch (_) {}
      });

      // Find the main content container
      const container =
        document.querySelector('article') ||
        document.querySelector('[class*="article-body"]') ||
        document.querySelector('[class*="article-content"]') ||
        document.querySelector('[class*="article-text"]') ||
        document.querySelector('[class*="post-body"]') ||
        document.querySelector('[class*="post-content"]') ||
        document.querySelector('[class*="entry-content"]') ||
        document.querySelector('[class*="story-body"]') ||
        document.querySelector('main') ||
        document.body;

      const seen    = new Set();
      const paras   = [];
      const noiseRe = /\b(?:share|tweet|cookie|subscribe|sign.?up|newsletter|advertisement|sponsored)\b/i;
      let total = 0;

      for (const el of container.querySelectorAll('p, li')) {
        const text = (el.innerText || '').replace(/\s+/g, ' ').trim();
        if (text.length < 60 || seen.has(text) || noiseRe.test(text)) continue;
        seen.add(text);
        paras.push(text);
        total += text.length;
        if (total >= maxChars) break;
      }

      return paras.join('\n\n').slice(0, maxChars).trim();
    }, MAX_ARTICLE_CHARS);

    await page.close();
    return { finalUrl, imageUrl, articleText };

  } catch (err) {
    await page.close().catch(() => {});
    console.warn(`    ⚠  Article fetch failed: ${err.message}`);
    return { finalUrl: googleNewsLink, imageUrl: null, articleText: '' };
  }
}

// ── Post writer ───────────────────────────────────────────────────────────────

async function writePost(item, existingUrls, browser) {
  // Resolve source name early so we can clean the title
  const sourceName = item.sourceName ||
    (() => { try { return new URL(item.link).hostname.replace(/^www\./, ''); } catch { return ''; } })();

  const title    = cleanTitle(item.title, sourceName);
  const date     = formatDate(item.pubDate);
  const slug     = slugify(title);
  const filename = `${date}-${slug}.md`;
  const filepath = path.join(POSTS_DIR, filename);

  if (fs.existsSync(filepath)) {
    console.log(`  ↩  ${filename} already exists`);
    return null;
  }

  console.log(`  → ${title.slice(0, 70)}…`);
  const { finalUrl, imageUrl, articleText } = await fetchArticlePage(browser, item.link);

  // Dedup against real URL — must happen after redirect resolution
  if (existingUrls.has(finalUrl)) {
    console.log('     ↩  Real URL already posted — skipping');
    return null;
  }

  // Re-derive source name from final URL if not available from RSS
  const resolvedSource = sourceName ||
    (() => { try { return new URL(finalUrl).hostname.replace(/^www\./, ''); } catch { return 'source'; } })();

  const category = inferCategory(title, item.description + ' ' + articleText);

  const summary =
    await summariseWithClaude(title, articleText, item.description, finalUrl) ||
    articleText ||
    item.description;

  const excerpt = makeExcerpt(summary);
  const body    = cleanBody(summary);
  const yamlStr = (s) => JSON.stringify(String(s));

  const lines = [
    '---',
    `layout: post`,
    `title: ${yamlStr(title)}`,
    `date: ${date}`,
    `category: ${yamlStr(category)}`,
    `tags:`,
    `  - tag: tomb-raider`,
  ];

  if (imageUrl) lines.push(`header_image: ${yamlStr(imageUrl)}`);

  lines.push(
    `excerpt_text: ${yamlStr(excerpt)}`,
    `source_url: ${yamlStr(finalUrl)}`,
    `source_rss_url: ${yamlStr(item.link)}`,
    `source_name: ${yamlStr(resolvedSource)}`,
    '---',
    '',
    body
  );

  if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });
  fs.writeFileSync(filepath, lines.join('\n') + '\n', 'utf8');

  existingUrls.add(finalUrl);
  existingUrls.add(item.link);

  const imgMark = imageUrl         ? '🖼 ' : '   ';
  const txtMark = articleText.length > 100 ? '📄' : '  ';
  console.log(`     ✓  ${filename} ${imgMark}${txtMark}`);
  return filename;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Tomb Raider Archives — News Bot\n');

  // ── 1. Fetch article list from RSS ────────────────────────────────────────
  console.log('Fetching RSS feed…');
  let xml;
  try {
    xml = await fetchUrl(RSS_URL);
  } catch (err) {
    console.error('Failed to fetch RSS:', err.message);
    process.exit(1);
  }

  const items = parseRSS(xml);
  console.log(`${items.length} item(s) in feed (within ${MAX_AGE_DAYS} days)\n`);

  // ── 2. Fetch YouTube videos (always — independent of news items) ──────────
  const dataDir = path.join(__dirname, '..', '_data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const videos = await fetchYouTubeVideos();
  fs.writeFileSync(YT_DATA_FILE, JSON.stringify(videos, null, 2) + '\n', 'utf8');
  console.log('');

  if (!items.length) { console.log('No new news items — done.'); return; }

  // ── 3. Deduplicate + batch ────────────────────────────────────────────────
  const existingUrls = getExistingSourceUrls();
  const batch = items.slice(0, MAX_PER_RUN);
  console.log(`Processing up to ${batch.length} article(s)…\n`);

  // ── 3. Launch browser once for all article fetches ────────────────────────
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  let created = 0;
  try {
    for (const item of batch) {
      try {
        const result = await writePost(item, existingUrls, browser);
        if (result) created++;
      } catch (err) {
        console.error(`  ✗  Failed (${item.title}): ${err.message}`);
      }
      await new Promise(r => setTimeout(r, 2000));
    }
  } finally {
    await browser.close();
  }

  console.log(`\nDone — created ${created} post(s).`);
  console.log(process.env.ANTHROPIC_API_KEY
    ? '(Claude summaries enabled)'
    : '(No ANTHROPIC_API_KEY — used extracted article text / RSS excerpts)');
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });
