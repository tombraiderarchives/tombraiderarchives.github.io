#!/usr/bin/env node
/**
 * Tomb Raider Archives — News Bot (Puppeteer edition)
 *
 * 1. Launches a headless Chrome browser via Puppeteer
 * 2. Navigates to the Google News search page for "tomb raider"
 * 3. Extracts article cards: title, source, publish time, thumbnail image, link
 * 4. Visits each article link → follows redirects to get the real article URL,
 *    scrapes the og:image (full quality) and readable article text from the DOM
 * 5. If ANTHROPIC_API_KEY is set, Claude Haiku writes a proper summary
 * 6. Writes Jekyll post files to news/_posts/
 *
 * Run manually:  node scripts/news-bot.js
 * Scheduled:     via .github/workflows/news-bot.yml
 */

'use strict';

const puppeteer = require('puppeteer');
const https     = require('https');
const fs        = require('fs');
const path      = require('path');

// ── Config ────────────────────────────────────────────────────────────────────

const GOOGLE_NEWS_URL  = 'https://news.google.com/search?q=tomb+raider&hl=en-CA&gl=CA&ceid=CA:en';
const POSTS_DIR        = path.join(__dirname, '..', 'news', '_posts');
const MAX_PER_RUN      = 5;      // posts per run — don't flood
const MAX_AGE_DAYS     = 7;      // ignore articles older than this
const MAX_ARTICLE_CHARS = 5000;  // max chars of article text sent to Claude

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

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

// ── Claude summarisation ──────────────────────────────────────────────────────

async function summariseWithClaude(title, articleText, sourceUrl) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !articleText || articleText.length < 100) return null;

  const prompt =
    `You are writing a news post for the Tomb Raider Archives fan website.\n` +
    `Based on the article text below, write 2–4 clear paragraphs summarising the news in your own words.\n` +
    `Be factual, informative, and engaging. Do not copy sentences verbatim.\n` +
    `Do not use an intro phrase like "In a recent article".\n` +
    `Write as if you are reporting the news directly.\n\n` +
    `Title: ${title}\n` +
    `Article text:\n${articleText}\n\n` +
    `Write only the summary paragraphs.`;

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

// ── Step 1: scrape Google News search page ────────────────────────────────────

async function scrapeGoogleNews(browser) {
  console.log('  Opening Google News search page…');
  const page = await browser.newPage();
  await page.setUserAgent(USER_AGENT);
  // Block images/fonts on the listing page — we only need the DOM
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (['image', 'font', 'media'].includes(req.resourceType())) req.abort();
    else req.continue();
  });

  await page.goto(GOOGLE_NEWS_URL, { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait for article cards
  await page.waitForSelector('article', { timeout: 15000 }).catch(() =>
    console.warn('  ⚠  No <article> elements found within timeout — continuing anyway')
  );

  const cutoffMs = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

  const items = await page.evaluate((cutoffMs) => {
    const results = [];

    document.querySelectorAll('article').forEach((article) => {
      // ── Title + link ──────────────────────────────────────────────────────
      // Google News uses hashed class names, so target by element role/tag
      const titleLink =
        article.querySelector('h3 a, h4 a') ||
        article.querySelector('a[href*="/articles/"]') ||
        article.querySelector('a[href*="news.google.com"]');
      if (!titleLink) return;

      const title = titleLink.textContent.trim();
      if (!title || title.length < 10) return;

      const link = titleLink.href;
      if (!link || !link.startsWith('http')) return;

      // ── Source name ───────────────────────────────────────────────────────
      // Appears in a <cite>, an <a> near a time element, or an element with
      // aria-label. Fall back to empty string.
      const sourceEl =
        article.querySelector('cite') ||
        article.querySelector('time')?.closest('div')?.querySelector('a') ||
        article.querySelector('[class*="source"], [class*="publisher"]');
      const sourceName = sourceEl?.textContent.trim() || '';

      // ── Publish time ──────────────────────────────────────────────────────
      const timeEl  = article.querySelector('time');
      const timeStr = timeEl?.getAttribute('datetime') || timeEl?.textContent.trim() || '';

      // Age filter
      if (timeStr) {
        const pub = new Date(timeStr);
        if (!isNaN(pub) && pub.getTime() < cutoffMs) return;
      }

      // ── Thumbnail image ───────────────────────────────────────────────────
      // Google News card images are loaded lazily; src is usually populated.
      // We blocked image requests in setRequestInterception so src won't be
      // a blob/data URI here — it'll be the real CDN URL or empty.
      let cardImage = '';
      for (const img of article.querySelectorAll('img')) {
        const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
        if (src && src.startsWith('http') && !src.startsWith('data:')) {
          cardImage = src;
          break;
        }
      }

      results.push({ title, link, sourceName, timeStr, cardImage });
    });

    return results;
  }, cutoffMs);

  await page.close();
  console.log(`  Found ${items.length} article card(s)\n`);
  return items;
}

// ── Step 2: visit article page ────────────────────────────────────────────────

async function fetchArticlePage(browser, googleNewsLink) {
  const page = await browser.newPage();
  await page.setUserAgent(USER_AGENT);

  try {
    // Google News links redirect to the real article.
    // waitUntil: 'domcontentloaded' is enough — we just need the HTML.
    await page.goto(googleNewsLink, { waitUntil: 'domcontentloaded', timeout: 20000 });

    // Some sites do a second JS redirect; wait briefly for it to settle.
    await new Promise(r => setTimeout(r, 1500));

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

    // ── Article text ──────────────────────────────────────────────────────────
    // Manipulate the live DOM for cleaner extraction than regex on raw HTML.
    const articleText = await page.evaluate((maxChars) => {
      // Remove noise elements
      [
        'script', 'style', 'noscript', 'svg', 'nav', 'header', 'footer',
        'aside', 'form', 'figure', 'iframe',
        '[class*="cookie"]', '[class*="gdpr"]', '[class*="subscribe"]',
        '[class*="newsletter"]', '[class*="social"]', '[class*="share"]',
        '[class*="related"]', '[class*="recommend"]', '[class*="sidebar"]',
        '[class*="comment"]', '[class*="ad"]', '[class*="promo"]',
        '[class*="popup"]', '[class*="modal"]', '[class*="sticky"]',
      ].forEach(sel => {
        try { document.querySelectorAll(sel).forEach(el => el.remove()); }
        catch (_) {}
      });

      // Find the main content container
      const container =
        document.querySelector('article') ||
        document.querySelector('main') ||
        document.querySelector('[class*="article-body"]') ||
        document.querySelector('[class*="article-content"]') ||
        document.querySelector('[class*="article-text"]') ||
        document.querySelector('[class*="post-body"]') ||
        document.querySelector('[class*="post-content"]') ||
        document.querySelector('[class*="entry-content"]') ||
        document.querySelector('[class*="story-body"]') ||
        document.body;

      // Collect non-trivial paragraphs and list items
      const seen = new Set();
      const paras = [];
      let total = 0;
      const noiseRe = /\b(?:share|tweet|cookie|subscribe|sign.?up|newsletter|advertisement|sponsored)\b/i;

      for (const el of container.querySelectorAll('p, li')) {
        const text = el.innerText?.replace(/\s+/g, ' ').trim() || '';
        if (text.length < 60) continue;
        if (seen.has(text)) continue;
        if (noiseRe.test(text)) continue;
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
    console.warn(`    ⚠  Could not fetch article page: ${err.message}`);
    return { finalUrl: googleNewsLink, imageUrl: null, articleText: '' };
  }
}

// ── Step 3: write Jekyll post ─────────────────────────────────────────────────

async function writePost(item, existingUrls, browser) {
  const date     = formatDate(item.timeStr);
  const slug     = slugify(item.title);
  const filename = `${date}-${slug}.md`;
  const filepath = path.join(POSTS_DIR, filename);

  if (fs.existsSync(filepath)) {
    console.log(`  ↩  ${filename} already exists — skipping`);
    return null;
  }

  console.log(`  → fetching: ${item.link.slice(0, 80)}…`);
  const { finalUrl, imageUrl: ogImage, articleText } = await fetchArticlePage(browser, item.link);

  // Dedup against stored real URLs (check AFTER redirect resolution)
  if (existingUrls.has(finalUrl)) {
    console.log('  ↩  Skipping (real URL already posted)');
    return null;
  }

  // Best available image: og:image from article > thumbnail from news card
  const imageUrl = ogImage || (item.cardImage.startsWith('http') ? item.cardImage : null);

  const sourceName = item.sourceName ||
    (() => { try { return new URL(finalUrl).hostname.replace(/^www\./, ''); } catch { return 'source'; } })();

  const category = inferCategory(item.title, articleText);

  const summary =
    await summariseWithClaude(item.title, articleText, finalUrl) ||
    articleText.slice(0, 600).trim() ||
    item.title;

  const excerpt  = summary.split('\n')[0].slice(0, 280);
  const yamlStr  = (s) => JSON.stringify(String(s));

  const lines = [
    '---',
    `layout: post`,
    `title: ${yamlStr(item.title)}`,
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
    `source_name: ${yamlStr(sourceName)}`,
    '---',
    '',
    summary,
    '',
    `---`,
    ``,
    `*Source: [${sourceName}](${finalUrl})*`
  );

  if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });
  fs.writeFileSync(filepath, lines.join('\n') + '\n', 'utf8');

  // Register both URLs so within-run duplicates are also caught
  existingUrls.add(finalUrl);
  existingUrls.add(item.link);

  const imgMark = imageUrl ? '🖼 ' : '   ';
  const txtMark = articleText.length > 100 ? '📄' : '  ';
  console.log(`  ✓  ${filename} ${imgMark}${txtMark}`);
  return filename;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Tomb Raider Archives — News Bot\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1280,800',
    ],
  });

  try {
    // ── 1. Scrape Google News listing ────────────────────────────────────────
    const items = await scrapeGoogleNews(browser);
    if (!items.length) {
      console.log('No articles found on the page. Exiting.');
      return;
    }

    // ── 2. Dedup + batch ─────────────────────────────────────────────────────
    const existingUrls = getExistingSourceUrls();
    const batch = items.slice(0, MAX_PER_RUN);
    console.log(`Processing up to ${batch.length} article(s)…\n`);

    let created = 0;
    for (const item of batch) {
      try {
        const result = await writePost(item, existingUrls, browser);
        if (result) created++;
      } catch (err) {
        console.error(`  ✗  Failed (${item.title}): ${err.message}`);
      }
      // Brief pause — be a polite bot
      await new Promise(r => setTimeout(r, 2000));
    }

    console.log(`\nDone — created ${created} post(s).`);
    console.log(process.env.ANTHROPIC_API_KEY
      ? '(Claude summaries enabled)'
      : '(No ANTHROPIC_API_KEY — used extracted article text)');

  } finally {
    await browser.close();
  }
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });
