// providers/animecix.js
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36';
const TMDB_API_KEY = '439c478a771f35c05022f9feabcca01c';
const TMDB_BASE = 'https://api.themoviedb.org/3';

// Karşılaştırma için: küçük harf, aksan yok, boşluk/noktalama yok
function norm(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s\-_:;.,!?'"’‘()\[\]&]+/g, '');
}

// TMDB'den dizi/filmin olası adlarını döndürür (İngilizce ad + orijinal ad)
function getTMDBTitles(tmdbId, mediaType) {
  const cleanId = String(tmdbId).replace('tmdb:', '').trim();

  const collect = item => {
    if (!item) return [];
    return [item.name, item.title, item.original_name, item.original_title]
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i);
  };

  if (cleanId.indexOf('tt') === 0) {
    return fetch(`${TMDB_BASE}/find/${cleanId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return [];
        const tv = d.tv_results && d.tv_results[0];
        const mv = d.movie_results && d.movie_results[0];
        return collect(mediaType === 'movie' ? (mv || tv) : (tv || mv));
      });
  }

  const type = (mediaType === 'movie') ? 'movie' : 'tv';
  return fetch(`${TMDB_BASE}/${type}/${cleanId}?api_key=${TMDB_API_KEY}`)
    .then(r => r.ok ? r.json() : null)
    .then(d => collect(d));
}

function searchAnimeCix(query) {
  const url = `https://animecix.tv/secure/search/${encodeURIComponent(query)}?type=undefined&limit=8&provider=null`;
  return fetch(url, {
    headers: { 'User-Agent': UA, 'Accept': 'application/json', 'Referer': 'https://animecix.tv/' }
  })
    .then(r => r.ok ? r.json() : null)
    .then(d => (d && d.results) ? d.results : []);
}

// KATI eşleştirme: SADECE TMDB ID birebir eşleşmeli. İsim eşleşmesi YOK.
// Bu, "East of Eden" gibi yanlış eşleştirmeleri önler.
function pickAnime(results, cleanId, titles) {
  if (!results || results.length === 0) return null;

  // SADECE TMDB ID birebir eşleşmesi
  const byId = results.find(r => r.tmdb_id && String(r.tmdb_id) === cleanId);
  if (byId) return byId;

  console.log('[AnimeCix] TMDB ID eslesmesi yok, atlandi');
  return null;
}

function getFirstVideo(titleId) {
  const url = `https://animecix.tv/secure/first-video?titleId=${titleId}`;
  return fetch(url, {
    headers: { 'User-Agent': UA, 'Accept': 'application/json', 'Referer': 'https://animecix.tv/' }
  })
    .then(r => r.ok ? r.json() : null);
}

function getTauStreams(embedUrl, vid) {
  const match = embedUrl.match(/\/embed\/([a-f0-9]+)/);
  const videoId = match ? match[1] : null;
  if (!videoId) return Promise.resolve(null);

  const url = `https://tau-video.xyz/api/video/${videoId}?vid=${vid}`;
  return fetch(url, {
    headers: { 'User-Agent': UA, 'Accept': '*/*', 'Referer': embedUrl, 'Origin': 'https://tau-video.xyz' }
  })
    .then(r => r.ok ? r.json() : null);
}

function getStreams(tmdbId, mediaType, season, episode) {
  const cleanId = String(tmdbId).replace('tmdb:', '').trim();
  let titles = [];

  // SADECE dizi/anime için çalış, film için çalışma
  if (mediaType === 'movie') {
    console.log('[AnimeCix] Film turu, atlandi');
    return Promise.resolve([]);
  }

  return getTMDBTitles(tmdbId, mediaType)
    .then(found => {
      titles = found;
      if (titles.length === 0) return [];
      console.log(`[AnimeCix] Aranıyor: "${titles[0]}" (tmdbId=${cleanId})`);
      return searchAnimeCix(titles[0]);
    })
    .then(results => {
      const anime = pickAnime(results, cleanId, titles);
      if (!anime) {
        console.log('[AnimeCix] Eşleşen anime yok, atlandı');
        return null;
      }

      console.log(`[AnimeCix] Seçilen: ${anime.name_english || anime.name} (id=${anime.id})`);
      return getFirstVideo(anime.id).then(fv => ({ anime, fv }));
    })
    .then(data => {
      if (!data || !data.fv || !data.fv.url) return null;
      const { anime, fv } = data;
      console.log(`[AnimeCix] Embed: ${fv.url} vid=${fv.id}`);
      return getTauStreams(fv.url, fv.id).then(tau => ({ anime, tau }));
    })
    .then(data => {
      if (!data || !data.tau || !data.tau.urls) return [];
      const { anime, tau } = data;

      const streams = tau.urls.map(u => ({
        name: `AnimeCix ${u.label}`,
        title: `${anime.name_english || anime.name} S${tau.season_number}E${tau.episode_number} [${u.label}]`,
        url: u.url,
        quality: u.label,
        size: u.size,
        headers: {
          'User-Agent': UA,
          'Referer': u.url
        }
      }));

      console.log(`[AnimeCix] ${streams.length} stream bulundu`);
      return streams;
    })
    .catch(err => {
      console.error('[AnimeCix] Hata:', err.message);
      return [];
    });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getStreams };
} else {
  global.getStreams = getStreams;
}