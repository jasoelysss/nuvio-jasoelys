// FullHDFilmizlesene Provider for Nuvio (Slug Haritası + Aday Slug Denemesi + Kararlı Motor)

const MAIN_URL = "https://www.fullhdfilmizlesene.now";
const TMDB_API_KEY = "a2f888b27315e62e471b2d587048f32e";
const TMDB_BASE = "https://api.themoviedb.org/3";
const UA = "okhttp/4.9.2";
const UA_EXO = "ExoPlayer/2.19.1";

// Popüler filmler için doğrudan slug haritası (isteğe bağlı, her zaman önce buna bakılır)
const SLUG_MAP = {
  "27205": "baslangic", // Inception
  "155": "the-dark-knight", // The Dark Knight
  "157336": "yildizlararasinda", // Interstellar
  "680": "ucuz-roman", // Pulp Fiction
  "278": "esaretin-bedeli", // The Shawshank Redemption
  "13": "forest-gump", // Forrest Gump
  "299534": "avengers-son-oyun", // Avengers: Endgame
  "tt26657236": "backrooms"
};

const atobPolyfill = (input) => {
  const b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = String(input).replace(/=+$/, '');
  let out = '';
  for (let bc = 0, bs = 0, buffer, i = 0; (buffer = str.charAt(i++)); ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4) ? (out += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)))) : 0) {
    buffer = b64chars.indexOf(buffer);
  }
  return out;
};

function ye(text) {
  return String(text || '').replace(/[a-zA-Z]/g, (char) => {
    const base = char <= 'Z' ? 0x41 : 0x61;
    return String.fromCharCode(((char.charCodeAt(0) - base + 13) % 26) + base);
  });
}

function m0(text) {
  const b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  const input = String(text || '').replace(/[\r\n\t =]+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  let output = '';
  for (let i = 0; i < input.length; i += 4) {
    const enc1 = b64chars.indexOf(input.charAt(i));
    const enc2 = i + 1 < input.length ? b64chars.indexOf(input.charAt(i + 1)) : -1;
    const enc3 = i + 2 < input.length ? b64chars.indexOf(input.charAt(i + 2)) : -1;
    const enc4 = i + 3 < input.length ? b64chars.indexOf(input.charAt(i + 3)) : -1;
    if (enc1 === -1 || enc2 === -1) break;
    output += String.fromCharCode((enc1 << 2) | (enc2 >> 4));
    if (enc3 !== -1) {
      output += String.fromCharCode(((enc2 & 15) << 4) | (enc3 >> 2));
      if (enc4 !== -1) {
        output += String.fromCharCode(((enc3 & 3) << 6) | enc4);
      }
    }
  }
  return output;
}

function av(e) {
  try {
    let reversed = e.split("").reverse().join("");
    let t = atobPolyfill(reversed);
    let o = "";
    for (let i = 0; i < t.length; i++) {
      let r = "K9L"[i % 3];
      let n = t.charCodeAt(i) - (r.charCodeAt(0) % 5 + 1);
      o += String.fromCharCode(n);
    }
    return atobPolyfill(o);
  } catch (err) {
    return '';
  }
}

function nuFetch(url, headers = {}) {
  const finalHeaders = {
    'User-Agent': headers['User-Agent'] || UA,
    'Referer': headers['Referer'] || MAIN_URL + '/',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
    ...headers
  };

  return fetch(url, { headers: finalHeaders }).then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.text();
  });
}

// Türkçe karakterleri çevirir, tireleri korur: "Spider-Man: Eve Dönüş" -> "spider-man-eve-donus"
function makeSlug(str) {
  if (!str) return '';
  return String(str)
    .replace(/İ/g, 'i').replace(/I/g, 'i')
    .toLowerCase()
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
    .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Kiril -> Latin (sitedeki "na-solntse-vdol-ryadov-kukuruzy" gibi sluglar için)
const CYR = {
  'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'y',
  'к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f',
  'х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'
};
function translit(str) {
  return String(str || '').toLowerCase().replace(/[а-яё]/g, c => CYR[c] || '');
}

function getMovieMetadata(tmdbId) {
  const cleanId = String(tmdbId).replace('tmdb:', '').trim();

  if (cleanId.indexOf('tt') === 0) {
    return fetch(`${TMDB_BASE}/find/${cleanId}?api_key=${TMDB_API_KEY}&external_source=imdb_id&language=tr-TR`)
      .then(r => r.json())
      .then(d => {
        const m = d && d.movie_results && d.movie_results[0];
        return {
          imdbId: cleanId,
          trTitle: m ? m.title : null,
          originalTitle: m ? m.original_title : null,
          enTitle: null,
          year: m && m.release_date ? m.release_date.slice(0, 4) : null
        };
      })
      .catch(() => ({ imdbId: cleanId, trTitle: null, originalTitle: null, enTitle: null, year: null }));
  }

  return Promise.all([
    fetch(`${TMDB_BASE}/movie/${cleanId}?api_key=${TMDB_API_KEY}&language=tr-TR`).then(r => r.ok ? r.json() : null),
    fetch(`${TMDB_BASE}/movie/${cleanId}/external_ids?api_key=${TMDB_API_KEY}`).then(r => r.ok ? r.json() : null),
    fetch(`${TMDB_BASE}/movie/${cleanId}?api_key=${TMDB_API_KEY}&language=en-US`).then(r => r.ok ? r.json() : null).catch(() => null)
  ]).then(res => {
    const details = res[0] || {};
    const ext = res[1] || {};
    const en = res[2] || {};
    return {
      imdbId: ext.imdb_id || details.imdb_id || null,
      trTitle: details.title || null,
      originalTitle: details.original_title || null,
      enTitle: en.title || null,
      year: details.release_date ? details.release_date.slice(0, 4) : null
    };
  });
}

// Olası film sayfası adreslerini sırayla üretir.
// Sitede iki biçim görüldü: "baslangic" (sadece Türkçe) ve
// "yardim-cagrisi-send-help" / "acil-inis-na-solntse-..." (Türkçe + orijinal ad)
function buildCandidates(tmdbId, meta) {
  const cleanId = String(tmdbId).replace('tmdb:', '').trim();
  const out = [];

  [cleanId, meta.imdbId].forEach(id => {
    if (id && SLUG_MAP[id]) out.push(SLUG_MAP[id]);
  });

  const tr = makeSlug(translit(meta.trTitle));
  const orig = makeSlug(translit(meta.originalTitle));
  const en = makeSlug(translit(meta.enTitle));

  // 1) Türkçe + yabancı ad birleşimleri (en spesifik, yanlış eşleşme riski düşük)
  [orig, en].forEach(o => {
    if (tr && o && o !== tr) out.push(tr + '-' + o);
  });

  // 2) Tek başına adlar
  [tr, orig, en].forEach(t => { if (t) out.push(t); });

  // 3) Yıl ve -izle ekli varyantlar
  [tr, orig, en].forEach(t => {
    if (!t) return;
    if (meta.year) out.push(t + '-' + meta.year);
    out.push(t + '-izle');
  });

  return out
    .filter((v, i, a) => v && a.indexOf(v) === i)
    .map(x => `${MAIN_URL}/film/${x}/`);
}

// ---------- Sitenin kendi aramasıyla eşleştirme ----------

function decodeEntities(t) {
  return String(t || '')
    .replace(/&#0*39;|&#x27;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

// /arama/<kelime> sayfasındaki film kartlarını okur
function parseSearchResults(html) {
  const items = [];
  const re = /<li class="film">([\s\S]*?)<\/li>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const block = m[1];
    const href = (block.match(/<a class="tt" href="([^"]+)"/) || [])[1];
    if (!href) continue;
    items.push({
      url: href,
      title: decodeEntities((block.match(/class="film-title">([^<]*)</) || [])[1] || '').trim(),
      alt: decodeEntities((block.match(/class="kt">([^<]*)</) || [])[1] || '').trim(),
      year: (block.match(/class="film-yil">(\d{4})</) || [])[1] || null,
      imdb: (block.match(/poster\/film\/film-(tt\d+)\./) || [])[1] || null
    });
  }
  return items;
}

function siteSearch(query) {
  const q = String(query).trim().split(/\s+/).map(encodeURIComponent).join('+');
  return nuFetch(`${MAIN_URL}/arama/${q}`, { 'Referer': MAIN_URL + '/' })
    .then(parseSearchResults)
    .catch(err => {
      console.log('[FullHD] Arama hatası:', query, err.message);
      return [];
    });
}

function yearOk(a, b) {
  if (!a || !b) return true;
  return Math.abs(Number(a) - Number(b)) <= 1;
}

// Başlık aramasında sonuçları ada ve yıla göre puanlar, uygun olanları sıralı döndürür
function pickResults(items, meta) {
  const wanted = [meta.trTitle, meta.originalTitle, meta.enTitle]
    .map(t => makeSlug(translit(t))).filter(Boolean);

  return items
    .map(it => {
      if (!yearOk(it.year, meta.year)) return null;
      const names = [it.title, it.alt].map(t => makeSlug(translit(t))).filter(Boolean);
      let score = 0;
      if (it.imdb && meta.imdbId && it.imdb === meta.imdbId) score += 100;
      if (names.some(n => wanted.indexOf(n) !== -1)) score += 10;
      else if (names.some(n => wanted.some(w => w.length >= 4 && (n.indexOf(w) !== -1 || w.indexOf(n) !== -1)))) score += 4;
      if (it.year && meta.year && it.year === meta.year) score += 2;
      return score >= 4 ? { url: it.url, score: score } : null;
    })
    .filter(Boolean)
    .sort((x, y) => y.score - x.score)
    .slice(0, 3)
    .map(x => x.url);
}

// Önce IMDb ID ile, olmazsa başlıklarla arar
function searchForMovie(meta) {
  function byId() {
    if (!meta.imdbId) return Promise.resolve([]);
    return siteSearch(meta.imdbId).then(items =>
      items.filter(it => yearOk(it.year, meta.year)).map(it => it.url)
    );
  }

  const queries = [meta.trTitle, meta.enTitle, meta.originalTitle]
    .filter(Boolean)
    .map(t => t.replace(/[’‘]/g, "'"))
    .filter(t => !/[\u0370-\uFFFF]/.test(t))
    .filter((v, i, a) => a.indexOf(v) === i);

  function byTitle(i) {
    if (i >= queries.length) return Promise.resolve([]);
    return siteSearch(queries[i]).then(items => {
      const picked = pickResults(items, meta);
      if (picked.length) return picked;
      return byTitle(i + 1);
    });
  }

  return byId().then(hits => {
    if (hits.length) {
      console.log('[FullHD] IMDb aramasıyla bulundu');
      return hits;
    }
    return byTitle(0).then(found => {
      if (found.length) console.log('[FullHD] Başlık aramasıyla bulundu');
      return found;
    });
  });
}

// Sıra: elle haritadakiler, site araması, slug tahminleri
function buildAllCandidates(tmdbId, meta) {
  const cleanId = String(tmdbId).replace('tmdb:', '').trim();
  const mapped = [];
  [cleanId, meta.imdbId].forEach(id => {
    if (id && SLUG_MAP[id]) mapped.push(`${MAIN_URL}/film/${SLUG_MAP[id]}/`);
  });

  return searchForMovie(meta).then(found =>
    mapped.concat(found, buildCandidates(tmdbId, meta))
      .filter((v, i, a) => v && a.indexOf(v) === i)
  );
}

// Sayfa başlığındaki yılı okur: <title>Acil İniş HD Film izle (2023)</title>
// (Menüdeki "2026 Filmleri" bağlantılarına bakmaz, onlar her sayfada var)
function pageYear(html) {
  const t = html.match(/<title>([^<]*)<\/title>/i);
  if (t) {
    const y = t[1].match(/\((\d{4})\)/);
    if (y) return y[1];
  }
  const o = html.match(/property="og:title"\s+content="[^"]*\((\d{4})\)/i);
  return o ? o[1] : null;
}

// Adayları sırayla dener, scx içeren ve yılı tutan ilk sayfayı döndürür
function fetchFirstValid(urls, year, i = 0) {
  if (i >= urls.length) return Promise.reject(new Error('Film bulunamadı'));
  return nuFetch(urls[i], { 'Referer': MAIN_URL + '/' }).then(
    html => {
      if (!/scx\s*=/.test(html)) {
        console.log('[FullHD] scx yok:', urls[i]);
        return fetchFirstValid(urls, year, i + 1);
      }
      const py = pageYear(html);
      if (year && py && Math.abs(Number(py) - Number(year)) > 1) {
        console.log('[FullHD] Yıl tutmadı (' + py + ' != ' + year + '):', urls[i]);
        return fetchFirstValid(urls, year, i + 1);
      }
      console.log('[FullHD] Bulundu:', urls[i], 'yıl:', py);
      return { html: html, url: urls[i] };
    },
    err => {
      console.log('[FullHD] Olmadı:', urls[i], err.message);
      return fetchFirstValid(urls, year, i + 1);
    }
  );
}

const BUILD = '2026-10-14-e';

function getStreams(tmdbId, mediaType, season, episode) {
  console.log('[FullHD] build', BUILD, 'id:', tmdbId, 'tip:', mediaType);
  if (mediaType === 'tv' || mediaType === 'series') {
    return Promise.resolve([]);
  }

  let movieUrl = '';

  return getMovieMetadata(tmdbId)
    .then(meta => {
      console.log('[FullHD] Meta:', JSON.stringify(meta));
      return buildAllCandidates(tmdbId, meta).then(urls => fetchFirstValid(urls, meta.year));
    })
    .then(found => {
      movieUrl = found.url;
      const html = found.html;

      const scxMatch = html.match(/scx\s*=\s*({[\s\S]*?});/);
      if (!scxMatch) throw new Error('scx yok');

      const scx = JSON.parse(scxMatch[1]);
      let encrypted = null;
      for (const name in scx) {
        const v = scx[name];
        if (v && v.sx && v.sx.t && v.sx.t.length > 0) {
          encrypted = Array.isArray(v.sx.t) ? v.sx.t[0] : v.sx.t[Object.keys(v.sx.t)[0]];
          break;
        }
      }
      if (!encrypted) throw new Error('Şifreli link yok');

      const rapidUrl = m0(ye(encrypted));
      return nuFetch(rapidUrl, {
        'User-Agent': UA,
        'Referer': movieUrl
      });
    })
    .then(rapidHtml => {
      let m3u8Url = '';
      const subtitles = [];

      function addSub(subUrl) {
        if (!subUrl) return;
        subtitles.push({
          id: 'tr',
          lang: 'tr',
          language: 'tr',
          label: 'Türkçe',
          name: 'Türkçe',
          url: String(subUrl).replace(/\\/g, '')
        });
      }

      // 1) Yeni şema: window._p8='...' -> av() ile çözülünce JSON (cm = HLS, tm = alternatif, ct = altyazılar)
      const p8Match = rapidHtml.match(/_p8\s*=\s*['"]([^'"]+)['"]/);
      if (p8Match) {
        try {
          const cfg = JSON.parse(av(p8Match[1]));
          m3u8Url = cfg.cm || cfg.tm || '';
          (cfg.ct || []).forEach(t => { if (t && t.file) addSub(t.file); });
          console.log('[FullHD] _p8 şeması kullanıldı');
        } catch (e) {
          console.log('[FullHD] _p8 çözülemedi:', e.message);
        }
      }

      // 2) Eski şema: file: av('...')
      if (!m3u8Url) {
        const sourceMatch = rapidHtml.match(/file["']?\s*:\s*av\(['"]([^"']+)['"]\)/);
        if (sourceMatch) {
          m3u8Url = av(sourceMatch[1]);
          console.log('[FullHD] eski av() şeması kullanıldı');
        }
        const subRegex = /"file"\s*:\s*"([^"]+\.vtt[^"]*)"/g;
        let subMatch;
        while ((subMatch = subRegex.exec(rapidHtml)) !== null) {
          addSub(subMatch[1]);
        }
      }

      if (!m3u8Url) throw new Error('Kaynak linki bulunamadı (_p8 ve av() ikisi de olmadı)');

      return [{
        name: 'FullHDFilmizlesene',
        title: '1080p • Altyazılı • ' + BUILD,
        url: m3u8Url,
        quality: '1080p',
        format: 'm3u8',
        behaviorHints: {
          notWebReady: true,
          proxyHeaders: {
            request: {
              'User-Agent': UA_EXO,
              'Referer': movieUrl,
              'Origin': MAIN_URL
            }
          }
        },
        subtitles: subtitles
      }];
    })
    .catch(e => {
      console.log('[FullHD] Hata:', e && e.message);
      return [];
    });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getStreams };
} else {
  global.getStreams = { getStreams };
}