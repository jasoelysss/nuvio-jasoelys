// providers/anizium.js (Tam ve Kusursuz Hal)
const TMDB_API_KEY = '439c478a771f35c05022f9feabcca01c';

const ANIZIUM_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Origin': 'https://anizium.co',
  'Referer': 'https://anizium.co/',
  'Cf-Control': '134e150d5b430204550809065940060f014441085852560f'
};

const STREAM_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://anizium.co/'
};

function getTMDBTitles(tmdbId, mediaType) {
  const cleanId = String(tmdbId).replace('tmdb:', '').trim();

  const resolveIdPromise = (cleanId.indexOf('tt') === 0)
    ? fetch('https://api.themoviedb.org/3/find/' + cleanId + '?api_key=' + TMDB_API_KEY + '&external_source=imdb_id')
        .then(function(r) { return r.ok ? r.json() : null; })
        .then(function(d) {
          if (!d) return null;
          const item = (d.tv_results && d.tv_results[0]) || (d.movie_results && d.movie_results[0]);
          return item ? item.id : null;
        })
    : Promise.resolve(cleanId);

  return resolveIdPromise.then(function(realTmdbId) {
    if (!realTmdbId) return [];
    const type = (mediaType === 'movie') ? 'movie' : 'tv';

    const enUrl = 'https://api.themoviedb.org/3/' + type + '/' + realTmdbId + '?api_key=' + TMDB_API_KEY + '&language=en-US&append_to_response=alternative_titles';
    const trUrl = 'https://api.themoviedb.org/3/' + type + '/' + realTmdbId + '?api_key=' + TMDB_API_KEY + '&language=tr-TR';

    return Promise.all([
      fetch(enUrl).then(function(r) { return r.ok ? r.json() : null; }),
      fetch(trUrl).then(function(r) { return r.ok ? r.json() : null; })
    ]).then(function(res) {
      const enData = res[0];
      const trData = res[1];
      const titles = [];

      function addTitle(t) {
        if (!t) return;
        const clean = t.trim();
        if (clean && !/[^\u0000-\u024F\s\-:!?'",.0-9]/.test(clean) && titles.indexOf(clean) === -1) {
          titles.push(clean);
        }
      }

      if (enData) {
        addTitle(enData.name || enData.title);
        const mainEn = enData.name || enData.title || '';
        if (mainEn.indexOf(':') !== -1) {
          addTitle(mainEn.split(':')[0]);
          addTitle(mainEn.split(':')[1]);
        }
      }

      if (trData) {
        addTitle(trData.name || trData.title);
      }

      if (enData && enData.alternative_titles) {
        const altList = enData.alternative_titles.results || enData.alternative_titles.titles || [];
        for (let i = 0; i < altList.length; i++) {
          addTitle(altList[i].title);
        }
      }

      return titles;
    });
  });
}

function searchAnizium(query) {
  const url = 'https://api.anizium.co/page/search?value=' + encodeURIComponent(query) + '&page=1';
  return fetch(url, { headers: ANIZIUM_HEADERS })
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(d) { return (d && d.page && d.page.data) ? d.page.data : []; });
}

function searchWithFallback(titles, index) {
  const idx = index || 0;
  if (idx >= titles.length || idx >= 4) return Promise.resolve([]);

  const currentQuery = titles[idx];
  console.log('[Anizium] Aranıyor: "' + currentQuery + '"');

  return searchAnizium(currentQuery).then(function(results) {
    if (results && results.length > 0) {
      return results;
    }
    return searchWithFallback(titles, idx + 1);
  });
}

function getAniziumSource(animeId, season, episode) {
  const url = 'https://api.anizium.co/anime/source?id=' + animeId + '&site=main&plan=&season=' + season + '&episode=' + episode + '&server=1';
  return fetch(url, { headers: ANIZIUM_HEADERS })
    .then(function(r) { return r.ok ? r.json() : null; });
}

function getStreams(tmdbId, mediaType, season, episode) {
  const s = season || 1;
  const e = episode || 1;

  return getTMDBTitles(tmdbId, mediaType)
    .then(function(titles) {
      if (!titles || titles.length === 0) return { titles: [], results: [] };
      return searchWithFallback(titles, 0).then(function(results) {
        return { titles: titles, results: results };
      });
    })
    .then(function(payload) {
      if (!payload || !payload.results || payload.results.length === 0) return [];
      const titles = payload.titles;
      const results = payload.results;

      const lowerTitles = [];
      for (let t = 0; t < titles.length; t++) {
        lowerTitles.push(titles[t].toLowerCase().trim());
      }

      let anime = null;

      // 1. Önce birebir eşleşme
      for (let i = 0; i < results.length; i++) {
        const rName = (results[i].name || '').toLowerCase().trim();
        const rOrig = (results[i].original_name || '').toLowerCase().trim();
        if (lowerTitles.indexOf(rName) !== -1 || (rOrig && lowerTitles.indexOf(rOrig) !== -1)) {
          anime = results[i];
          break;
        }
      }

      // 2. Yoksa içinde geçen ilk sonuç
      if (!anime) {
        anime = results[0];
        for (let i = 0; i < results.length; i++) {
          const rName = (results[i].name || '').toLowerCase();
          for (let t = 0; t < lowerTitles.length; t++) {
            if (rName.includes(lowerTitles[t])) {
              anime = results[i];
              break;
            }
          }
          if (anime !== results[0]) break;
        }
      }

      console.log('[Anizium] Seçilen: ' + anime.name + ' (id=' + anime.ID + ')');
      return getAniziumSource(anime.ID, s, e).then(function(source) {
        return { anime: anime, source: source };
      });
    })
    .then(function(payload) {
      if (!payload || !payload.source || !payload.source.success) return [];
      const anime = payload.anime;
      const source = payload.source;

      const streams = [];
      const subtitles = [];
      const subs = source.subtitles || [];
      for (let i = 0; i < subs.length; i++) {
        const sub = subs[i];
        subtitles.push({
          id: sub.group,
          lang: sub.group,
          language: sub.group,
          label: sub.name,
          name: sub.name,
          url: sub.link
        });
      }

      const groups = source.groups || [];
      const eklenenAnahtarlar = {};

      for (let g = 0; g < groups.length; g++) {
        const items = groups[g].items || [];
        for (let k = 0; k < items.length; k++) {
          const item = items[k];
          if (!item.link) continue;

          // Linkin sonuna göre Türkçe Dublaj mı Altyazılı mı tespit et
          const isDub = item.link.indexOf('.trdub.') !== -1;
          const audioTag = isDub ? 'TR Dublaj' : 'Altyazılı';
          const uniqueKey = item.quality + '_' + audioTag;

          if (eklenenAnahtarlar[uniqueKey]) continue;
          eklenenAnahtarlar[uniqueKey] = true;

          const stream = {
            name: 'Anizium ' + item.quality + 'p (' + audioTag + ')',
            title: anime.name + ' S' + s + 'E' + e + ' [' + item.quality + 'p • ' + audioTag + ']',
            url: item.link,
            quality: item.quality + 'p',
            headers: STREAM_HEADERS
          };
          if (subtitles.length > 0) {
            stream.subtitles = subtitles;
          }
          streams.push(stream);
        }
      }

      // Altyazılı (Orijinal Ses) olanları listenin en üstüne, Dublajları altına sırala
      streams.sort(function(a, b) {
        const aIsSub = a.name.indexOf('Altyazılı') !== -1 ? 0 : 1;
        const bIsSub = b.name.indexOf('Altyazılı') !== -1 ? 0 : 1;
        return aIsSub - bIsSub;
      });

      console.log('[Anizium] ' + streams.length + ' stream bulundu, ' + subtitles.length + ' altyazı');
      return streams;
    })
    .catch(function(err) {
      console.error('[Anizium] Hata: ' + err.message);
      return [];
    });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getStreams: getStreams };
} else {
  global.getStreams = { getStreams: getStreams };
}