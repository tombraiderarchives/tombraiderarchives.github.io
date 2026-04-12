#!/usr/bin/env node
/**
 * Tomb Raider Archives — News Bot
 *
 * Fetches Tomb Raider news from Google News RSS, deduplicates against
 * existing posts, and writes new Jekyll post files to news/_posts/.
 *
 * If ANTHROPIC_API_KEY is set, Claude is used to write a proper summary
 * for each article. Otherwise the RSS excerpt is used as-is.
 *
 * Run manually:  node scripts/news-bot.js
 * Scheduled:     via .github/workflows/news-bot.yml (daily at 9 AM UTC)
 */

'use strict';

const https   = require('https');
const http    = require('http');
const fs      = require('fs');
const path    = require('path');

// ── Config ────────────────────────────────────────────────────────────────────

const RSS_URL       = 'https://news.google.com/rss/search?q=tomb+raider&hl=en-US&gl=US&ceid=US:en';
const POSTS_DIR     = path.join(__dirname, '..', 'news', '_posts');
const MAX_PER_RUN   = 5;    // posts to create per run — don't flood
const MAX_AGE_DAYS  = 7;    // ignore articles older than this

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function get(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Too many redirects'));
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'TombRaiderArchivesNewsBot/1.0 (https://tombraiderarchives.github.io)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(get(res.headers.location, redirects + 1));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Request timeout')); });
  });
}

// ── RSS parsing ───────────────────────────────────────────────────────────────

function decodeEntities(str) {
  return str
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g,  "'")
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

function parseItems(xml) {
  const items   = [];
  const matches = xml.match(/<item>([\s\S]*?)<\/item>/gi) || [];

  for (const block of matches) {
    const title      = tagContent(block, 'title');
    const link       = tagContent(block, 'link').replace(/\s/g, '');
    const pubDate    = tagContent(block, 'pubDate');
    const sourceName = block.match(/<source[^>]*>([^<]*)<\/source>/i)?.[1]?.trim() || '';
    // Strip HTML tags from description
    const description = tagContent(block, 'description')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!title || !link) continue;

    // Age filter
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
  const urls  = new Set();
  const slugs = new Set();
  if (!fs.existsSync(POSTS_DIR)) return { urls, slugs };

  for (const file of fs.readdirSync(POSTS_DIR)) {
    if (!file.endsWith('.md')) continue;
    const content = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
    const urlMatch = content.match(/^source_url:\s*["']?([^"'\n]+)/m);
    if (urlMatch) urls.add(urlMatch[1].trim());
    // Also track the slug portion of the filename (YYYY-MM-DD-slug)
    slugs.add(file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, ''));
  }
  return { urls, slugs };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function formatDate(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d)) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function inferCategory(title, desc) {
  const text = (title + ' ' + desc).toLowerCase();
  if (/\btrailer\b|\bgameplay\b/.test(text))                   return 'Trailer';
  if (/\bannounce|\breveal\b|\bteaser\b/.test(text))           return 'Announcement';
  if (/\brelease\b|\blaunch\b|\bout now\b|\bships\b/.test(text)) return 'Release';
  if (/\bdlc\b|\bupdate\b|\bpatch\b|\bdev\b/.test(text))      return 'Development Update';
  if (/\bmerch\b|\bfigurine\b|\bcollectible\b/.test(text))    return 'Merchandise';
  if (/\bevent\b|\bexpo\b|\bgamescom\b|\bsgf\b/.test(text))   return 'Event';
  if (/\brumou?r\b|\bleak\b/.test(text))                      return 'Rumour';
  return 'News';
}

// ── AI summarisation (optional) ───────────────────────────────────────────────

async function summariseWithClaude(title, excerpt, url) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `You are writing a short news blurb for the Tomb Raider Archives website.
Summarise this article in 2–3 plain sentences. Be factual and concise. No editorialising, no intro phrase like "In a recent article...".

Title: ${title}
Excerpt: ${excerpt}
URL: ${url}

Write only the summary.`
    }]
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
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
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.content?.[0]?.text?.trim() || null);
        } catch {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.write(body);
    req.end();
  });
}

// ── Post writer ───────────────────────────────────────────────────────────────

async function writePost(item) {
  const date     = formatDate(item.pubDate);
  const slug     = slugify(item.title);
  const filename = `${date}-${slug}.md`;
  const filepath = path.join(POSTS_DIR, filename);

  if (fs.existsSync(filepath)) return null;

  const category = inferCategory(item.title, item.description);
  const excerpt  = item.description.slice(0, 300).replace(/\n/g, ' ').trim();

  // Try Claude for a better summary, fall back to RSS excerpt
  const summary = await summariseWithClaude(item.title, excerpt, item.link) || excerpt;

  const sourceName = item.sourceName
    || (() => { try { return new URL(item.link).hostname.replace(/^www\./, ''); } catch { return 'source'; } })();

  // Safely quote the YAML string values
  const yamlStr = (s) => JSON.stringify(String(s));

  const content = [
    '---',
    `layout: post`,
    `title: ${yamlStr(item.title)}`,
    `date: ${date}`,
    `category: ${yamlStr(category)}`,
    `tags:`,
    `  - tag: tomb-raider`,
    `excerpt_text: ${yamlStr(summary.slice(0, 280))}`,
    `source_url: ${yamlStr(item.link)}`,
    `source_name: ${yamlStr(sourceName)}`,
    '---',
    '',
    summary,
    '',
    `[Read the full article at ${sourceName} →](${item.link})`,
    ''
  ].join('\n');

  if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });
  fs.writeFileSync(filepath, content, 'utf8');
  console.log(`  ✓  ${filename}`);
  return filename;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Tomb Raider News Bot — starting\n');
  console.log(`Fetching: ${RSS_URL}`);

  let xml;
  try {
    xml = await get(RSS_URL);
  } catch (err) {
    console.error('Failed to fetch RSS feed:', err.message);
    process.exit(1);
  }

  const items = parseItems(xml);
  console.log(`Found ${items.length} item(s) in feed (within ${MAX_AGE_DAYS} days)\n`);

  if (items.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  const { urls: existingUrls } = getExistingSourceUrls();
  const newItems = items.filter(i => !existingUrls.has(i.link));
  console.log(`${newItems.length} new item(s) after deduplication\n`);

  if (newItems.length === 0) {
    console.log('All articles already posted. Done.');
    return;
  }

  const batch   = newItems.slice(0, MAX_PER_RUN);
  let   created = 0;

  for (const item of batch) {
    const result = await writePost(item);
    if (result) created++;
  }

  console.log(`\nCreated ${created} post(s).`);

  if (created === 0) {
    console.log('No files written.');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
