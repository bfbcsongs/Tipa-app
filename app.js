let currentKeyShift = 0;
let scrollInterval = null;
let suggestionDebounce = null;
const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const demoSongData = {
  title: "Still",
  artist: "Hillsong Worship",
  youtubeQuery: "Still Hillsong Worship Audio",
  lines: [
    { chords: ["C", "G", "Am"], lyrics: "Hide me now, under Your wings" },
    { chords: ["F", "D", "G"], lyrics: "Cover me, within Your mighty hand" },
    { chords: ["F", "G", "C"], lyrics: "When the oceans rise and thunders roar" },
    { chords: ["F", "G", "Am"], lyrics: "I will soar with You above the storm" }
  ]
};

function handleSearchSuggestions() {
  clearTimeout(suggestionDebounce);
  const input = document.getElementById('yt-search-input');
  const suggestionsBox = document.getElementById('yt-suggestions');

  if (!input || !suggestionsBox) return;
  const query = input.value.trim();

  if (query.length < 2) {
    suggestionsBox.classList.add('hidden');
    return;
  }

  suggestionDebounce = setTimeout(() => {
    const oldScript = document.getElementById('jsonp-suggest');
    if (oldScript) oldScript.remove();

    window.suggestCallback = function(data) {
      if (data && data[1] && data[1].length > 0) {
        let html = '';
        data[1].slice(0, 5).forEach(item => {
          const text = item[0];
          html += `<div onclick="selectSuggestion('${text.replace(/'/g, "\\'")}')" class="suggestion-item">🔍 ${text}</div>`;
        });
        suggestionsBox.innerHTML = html;
        suggestionsBox.classList.remove('hidden');
      } else {
        suggestionsBox.classList.add('hidden');
      }
    };

    const script = document.createElement('script');
    script.id = 'jsonp-suggest';
    script.src = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}&jsonp=suggestCallback`;
    document.body.appendChild(script);
  }, 200);
}

function selectSuggestion(text) {
  const input = document.getElementById('yt-search-input');
  const suggestionsBox = document.getElementById('yt-suggestions');
  if (input) input.value = text;
  if (suggestionsBox) suggestionsBox.classList.add('hidden');
  searchYouTubeDirect();
}

async function searchYouTubeDirect() {
  const inputElem = document.getElementById('yt-search-input');
  const suggestionsBox = document.getElementById('yt-suggestions');
  const resultsContainer = document.getElementById('yt-video-results');
  
  if (suggestionsBox) suggestionsBox.classList.add('hidden');
  if (!inputElem) return;

  const query = inputElem.value.trim();
  if (!query) return;

  if (resultsContainer) {
    resultsContainer.classList.remove('hidden');
    resultsContainer.innerHTML = `<p style="font-size:0.75rem; color:#94a3b8; text-align:center; padding:8px;">Searching YouTube...</p>`;
  }

  if (query.includes("youtube.com") || query.includes("youtu.be")) {
    let videoId = "";
    if (query.includes("v=")) videoId = query.split("v=")[1].split("&")[0];
    else if (query.includes("youtu.be/")) videoId = query.split("youtu.be/")[1].split("?")[0];
    if (resultsContainer) resultsContainer.classList.add('hidden');
    renderEmbedPlayer(videoId);
    return;
  }

  try {
    const res = await fetch(`https://invidious.nerdvpn.de/api/v1/search?q=${encodeURIComponent(query)}&type=video`);
    const results = await res.json();

    if (results && results.length > 0) {
      let html = `<span class="label">Select track to play:</span>`;
      results.slice(0, 3).forEach(video => {
        const title = video.title;
        const author = video.author;
        const vId = video.videoId;
        html += `
          <div onclick="playSelectedVideo('${vId}')" class="video-item">
            <div>
              <div class="video-title">${title}</div>
              <div class="video-author">${author}</div>
            </div>
            <span class="play-badge">▶ Play</span>
          </div>`;
      });
      if (resultsContainer) resultsContainer.innerHTML = html;
    } else {
      fallbackToDirectSearch(query);
    }
  } catch (err) {
    fallbackToDirectSearch(query);
  }
}

function playSelectedVideo(videoId) {
  const resultsContainer = document.getElementById('yt-video-results');
  if (resultsContainer) resultsContainer.classList.add('hidden');
  renderEmbedPlayer(videoId);
}

function fallbackToDirectSearch(query) {
  const resultsContainer = document.getElementById('yt-video-results');
  if (resultsContainer) resultsContainer.classList.add('hidden');
  const embedUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}&autoplay=1`;
  renderPlayerIframe(embedUrl);
}

function renderEmbedPlayer(videoId) {
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  renderPlayerIframe(embedUrl);
}

function renderPlayerIframe(embedUrl) {
  const container = document.getElementById('yt-player-container');
  if (!container) return;

  container.innerHTML = `
    <div style="overflow:hidden; border-radius:8px; height:90px; width:100%; background:#000; margin-bottom:8px;">
      <iframe width="100%" height="90" src="${embedUrl}" title="YouTube Player" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
    </div>
    <div class="player-controls">
      <div class="ctrl-group">
        <span style="color:#94a3b8; font-weight:700;">KEY:</span>
        <button onclick="transpose(-1)" class="ctrl-btn">-</button>
        <span id="key-shift-indicator" style="font-weight:700; color:#818cf8; font-family:monospace;">0</span>
        <button onclick="transpose(1)" class="ctrl-btn">+</button>
      </div>
      <div class="ctrl-group">
        <button id="scroll-toggle-btn" onclick="toggleAutoScroll()" class="btn-primary" style="padding:4px 10px; font-size:0.7rem;">
          <span id="scroll-btn-text">Scroll</span>
        </button>
        <input type="range" id="scroll-speed" min="1" max="10" value="3" style="width:50px;" />
      </div>
    </div>`;

  container.classList.remove('hidden');
}

function loadDemoSong() {
  const resultsContainer = document.getElementById('yt-video-results');
  if (resultsContainer) resultsContainer.classList.add('hidden');
  renderEmbedPlayer("gWW2a3B46X0");
  renderChordSheet(demoSongData);
}

function renderChordSheet(song) {
  const canvas = document.getElementById('chord-canvas');
  if (!canvas) return;

  let html = `<div style="margin-bottom:12px; border-bottom:1px solid #1e293b; padding-bottom:8px;"><h2 style="font-size:0.9rem; font-weight:700; color:#fff;">${song.title}</h2><p style="font-size:0.7rem; color:#94a3b8;">${song.artist}</p></div>`;
  song.lines.forEach((line) => {
    html += `<div style="margin-bottom:12px;"><div style="display:flex; flex-wrap:wrap; margin-bottom:2px;">`;
    line.chords.forEach(chord => {
      const shiftedChord = transposeChord(chord, currentKeyShift);
      html += `<span class="chord-block">${shiftedChord}</span>`;
    });
    html += `</div><p style="font-size:0.75rem; color:#cbd5e1; font-family:monospace;">${line.lyrics}</p></div>`;
  });
  canvas.innerHTML = html;
}

function transpose(semitones) {
  currentKeyShift += semitones;
  const indicator = document.getElementById('key-shift-indicator');
  if (indicator) indicator.innerText = (currentKeyShift > 0 ? '+' : '') + currentKeyShift;
  renderChordSheet(demoSongData);
}

function transposeChord(chord, semitones) {
  return chord.replace(/[A-G][#b]?/g, (match) => {
    let index = chromaticScale.indexOf(match);
    if (index === -1) return match;
    let newIndex = (index + semitones) % 12;
    if (newIndex < 0) newIndex += 12;
    return chromaticScale[newIndex];
  });
}

function toggleAutoScroll() {
  const btnText = document.getElementById('scroll-btn-text');
  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;
    if (btnText) btnText.innerText = 'Scroll';
  } else {
    if (btnText) btnText.innerText = 'Pause';
    scrollInterval = setInterval(() => {
      const speedElem = document.getElementById('scroll-speed');
      const speed = speedElem ? speedElem.value : 3;
      window.scrollBy({ top: parseInt(speed), behavior: 'smooth' });
    }, 100);
  }
}

function clearCanvas() {
  if (scrollInterval) clearInterval(scrollInterval);
  currentKeyShift = 0;
  const playerContainer = document.getElementById('yt-player-container');
  if (playerContainer) playerContainer.classList.add('hidden');
  const resultsContainer = document.getElementById('yt-video-results');
  if (resultsContainer) resultsContainer.classList.add('hidden');
  
  const canvas = document.getElementById('chord-canvas');
  if (canvas) {
    canvas.innerHTML = `<div class="empty-state"><p>Type a song title above or tap <strong>Load Demo Track</strong>!</p></div>`;
  }
}
