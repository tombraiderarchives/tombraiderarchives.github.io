#!/usr/bin/env node
/**
 * Tomb Raider Archives — News Bot
 *
 * 1. Fetches Tomb Raider news from Google News RSS
 * 2. Follows each link to the real article page
 * 3. Scrapes the article's og:image and readable text
 * 4. If ANTHROPIC_API_KEY is set, Claude writes an original summary from
 *    the actual article text — otherwise the RSS excerpt is used
 * 5. Writes Jekyll post files to news/_posts/
 *
 * Run manually:  node scripts/news-bot.js
 * Scheduled:     via .github/workflows/news-bot.yml (daily at 9 AM UTC)
 */

'use strict';

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

// ── Config ────────────────────────────────────────────────────────────────────

const RSS_URL          = 'https://news.google.com/rss/search?q=tomb+raider&hl=en-US&gl=US&ceid=US:en';
const POSTS_DIR        = path.join(__dirname, '..', 'news', '_posts');
const MAX_PER_RUN      = 5;     // posts per run — don't flood
const MAX_AGE_DAYS     = 7;     // ignore articles older than this
const ARTICLE_TIMEOUT  = 10000; // ms to wait for each article page
const MAX_ARTICLE_CHARS = 5000; // max chars of article text sent to Claude

// ── HTTP ──────────────────────────────────────────────────────────────────────

/**
 * Fetch a URL, follow redirects, return { body, finalUrl }.
 * finalUrl is the URL after all redirects — used to resolve the true
 * article URL from Google News tracking links.
 */
function fetch(url, redirects = 0, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    if (redirects > 8) return reject(new Error('Too many redirects'));
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TombRaiderArchivesBot/1.0)',
        'Accept':     'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Resolve relative redirects
        let next = res.headers.location;
        if (next.startsWith('/')) {
          try { next = new URL(next, url).href; } catch {}
        }
        res.resume(); // discard body
        return resolve(fetch(next, redirects + 1, timeoutMs));
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ body, finalUrl: url }));
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// ── HTML extraction ───────────────────────────────────────────────────────────

function decodeEntities(str) {
  return str
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g,  "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

/** Extract og:image or twitter:image URL from HTML. */
function extractOgImage(html, baseUrl) {
  const patterns = [
    // og:image — both attribute orders
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    // twitter:image
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    // twitter:image:src
    /<meta[^>]+name=["']twitter:image:src["'][^>]+content=["']([^"']+)["']/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (!m || !m[1]) continue;
    let imgUrl = decodeEntities(m[1]);
    // Resolve protocol-relative URLs
    if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
    // Resolve root-relative URLs against the page's base URL
    else if (imgUrl.startsWith('/') && baseUrl) {
      try { imgUrl = new URL(imgUrl, baseUrl).href; } catch { continue; }
    }
    if (imgUrl.startsWith('http')) return imgUrl;
  }
  return null;
}

/** Extract readable article text from HTML. Returns plain paragraphs. */
function extractArticleText(html) {
  // Remove noise elements entirely
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<form[\s\S]*?<\/form>/gi, '')
    .replace(/<figure[\s\S]*?<\/figure>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // Strip ad/cookie/social/modal blocks by class name
  const noiseClass = /\b(?:ad|advert|banner|cookie|gdpr|modal|popup|overlay|social|share|sharing|subscribe|newsletter|sidebar|related|recommend|comment|promo|sticky|sticky-bar|notification)\b/i;
  cleaned = cleaned.replace(/<(?:div|section)[^>]+class=["'][^"']*["'][^>]*>[\s\S]*?<\/(?:div|section)>/gi, (block) => {
    const classMatch = block.match(/class=["']([^"']+)["']/);
    if (classMatch && noiseClass.test(classMatch[1])) return '';
    return block;
  });

  // Try to narrow to the article body first
  const articleRe  = /<article[^>]*>([\s\S]*?)<\/article>/i;
  const mainRe     = /<main[^>]*>([\s\S]*?)<\/main>/i;
  const contentRe  = /<div[^>]+class=["'][^"']*(?:article[-_]body|post[-_]body|post[-_]content|entry[-_]content|story[-_]body|article[-_]content|article[-_]text)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i;

  for (const re of [articleRe, mainRe, contentRe]) {
    const m = re.exec(cleaned);
    if (m) { cleaned = m[1]; break; }
  }

  // Collect non-trivial paragraphs
  const paragraphs = [];
  const seen = new Set();
  let total = 0;

  // Use separate regex objects to avoid stale lastIndex state
  const pRe  = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;

  for (const re of [pRe, liRe]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(cleaned)) !== null) {
      const text = decodeEntities(m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
      // Skip short text, duplicates, and common noise strings
      if (text.length < 60) continue;
      if (seen.has(text)) continue;
      if (/\b(?:share|tweet|cookie|subscribe|sign.?up|newsletter|advertisement|sponsored)\b/i.test(text)) continue;
      seen.add(text);
      paragraphs.push(text);
      total += text.length;
      if (total >= MAX_ARTICLE_CHARS) break;
    }
    if (total >= MAX_ARTICLE_CHARS) break;
  }

  return paragraphs.join('\n\n').slice(0, MAX_ARTICLE_CHARS).trim();
}

/**
 * Fetch an article page and extract useful data.
 * Returns { imageUrl, articleText, finalUrl } — all fields may be null/empty
 * if the fetch fails or the site blocks us.
 */
async function fetchArticle(url) {
  try {
    const { body, finalUrl } = await fetch(url, 0, ARTICLE_TIMEOUT);
    return {
      imageUrl:    extractOgImage(body, finalUrl),
      articleText: extractArticleText(body),
      finalUrl
    };
  } catch {
    return { imageUrl: null, articleText: '', finalUrl: url };
  }
}

// ── RSS parsing ───────────────────────────────────────────────────────────────

function extractCDATA(str) {
  const m = str.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return m ? m[1] : str;
}

function tagContent(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? decodeEntities(extractCDATA(m[1].trim())) : '';
}

function parseItems(xml) {
  const items   = [];
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
    if (published && !isNaN(published)) {
      const ageMs = Date.now() - published.getTime();
      if (ageMs > MAX_AGE_DAYS * 24 * 60 * 60 * 1000) continue;
    }

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
    // Collect both source_url (real article URL) and source_rss_url (Google tracking URL)
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

function inferCategory(title, desc) {
  const t = (title + ' ' + desc).toLowerCase();
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

async function summariseWithClaude(title, articleText, rssExcerpt, sourceUrl) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  // Use actual article text if we got it, fall back to RSS excerpt
  const sourceContent = articleText && articleText.length > 100
    ? articleText
    : rssExcerpt;

  if (!sourceContent) return null;

  const prompt = articleText && articleText.length > 100
    ? `You are writing a news post for the Tomb Raider Archives fan website.
Based on the article text below, write 2–4 clear paragraphs summarising the news in your own words.
Be factual, informative, and engaging. Do not copy sentences verbatim. Do not use an intro phrase like "In a recent article".
Do not mention that you're summarising — write as if you're reporting the news directly.

Title: ${title}
Article text:
${sourceContent}

Write only the summary paragraphs.`
    : `You are writing a short news blurb for the Tomb Raider Archives fan website.
Summarise this in 2–3 sentences. Be factual and concise. No editorialising.

Title: ${title}
Excerpt: ${sourceContent}
URL: ${sourceUrl}

Write only the summary.`;

  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }]
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

// ── Post writer ───────────────────────────────────────────────────────────────

async function writePost(item, existingUrls) {
  const date     = formatDate(item.pubDate);
  const slug     = slugify(item.title);
  const filename = `${date}-${slug}.md`;
  const filepath = path.join(POSTS_DIR, filename);
  if (fs.existsSync(filepath)) return null;

  console.log(`  → fetching article: ${item.link.slice(0, 80)}…`);
  const { imageUrl, articleText, finalUrl } = await fetchArticle(item.link);

  const realUrl = finalUrl || item.link;

  // Dedup against the REAL URL (after redirect) — Google News tracking links
  // never match stored source_url values, so this check must happen here.
  if (existingUrls.has(realUrl)) {
    console.log('  ↩  Skipping (real URL already posted)');
    return null;
  }
  const sourceName = item.sourceName
    || (() => { try { return new URL(realUrl).hostname.replace(/^www\./, ''); } catch { return 'source'; } })();

  const rssExcerpt = item.description.slice(0, 400).trim();
  const category   = inferCategory(item.title, item.description + ' ' + articleText);

  // Summarise — tries Claude with article text first
  const summary = await summariseWithClaude(item.title, articleText, rssExcerpt, realUrl)
    || articleText.slice(0, 600).trim()
    || rssExcerpt;

  const excerpt = summary.split('\n')[0].slice(0, 280);
  const yamlStr = (s) => JSON.stringify(String(s));

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
    `source_url: ${yamlStr(realUrl)}`,
    `source_rss_url: ${yamlStr(item.link)}`,
    `source_name: ${yamlStr(sourceName)}`,
    '---',
    '',
    summary,
    '',
    `---`,
    ``,
    `*Source: [${sourceName}](${realUrl})*`
  );

  if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });
  fs.writeFileSync(filepath, lines.join('\n') + '\n', 'utf8');

  // Register both URLs so within-run duplicates are also caught
  existingUrls.add(realUrl);
  existingUrls.add(item.link);

  const imgStatus = imageUrl ? '🖼' : '  ';
  const txtStatus = articleText.length > 100 ? '📄' : '  ';
  console.log(`  ✓  ${filename} ${imgStatus}${txtStatus}`);
  return filename;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Tomb Raider Archives — News Bot\n');

  let xml;
  try {
    console.log(`Fetching RSS…`);
    ({ body: xml } = await fetch(RSS_URL));
  } catch (err) {
    console.error('Failed to fetch RSS:', err.message);
    process.exit(1);
  }

  const items = parseItems(xml);
  console.log(`${items.length} item(s) in feed (within ${MAX_AGE_DAYS} days)\n`);
  if (!items.length) return;

  const existingUrls = getExistingSourceUrls();
  // NOTE: don't pre-filter by item.link — Google News tracking URLs never
  // match stored source_url values. Dedup happens inside writePost() after
  // following the redirect to get the real article URL.
  const batch   = items.slice(0, MAX_PER_RUN);
  let   created = 0;

  for (const item of batch) {
    try {
      const result = await writePost(item, existingUrls);
      if (result) created++;
    } catch (err) {
      console.error(`  ✗  Failed: ${item.title}: ${err.message}`);
    }
    // Brief pause between article fetches — be a polite bot
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\nDone — created ${created} post(s).`);
  if (process.env.ANTHROPIC_API_KEY) {
    console.log('(Claude summaries enabled)');
  } else {
    console.log('(No ANTHROPIC_API_KEY — used extracted article text / RSS excerpts)');
  }
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });
