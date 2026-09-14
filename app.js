// ==========================================
// PWA CHORDIFY LAB - APP.JS (SEARCH & PLAYER ENGINE)
// ==========================================

let currentKeyShift = 0;
let scrollInterval = null;
const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Demo Song Data
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

// 1. IN-APP YOUTUBE SEARCH FUNCTION
async function searchYouTubeDirect() {
  const inputElem = document.getElementById('yt-search-input');
  const resultsContainer = document.getElementById('yt-search-results');
  
  if (!inputElem) return;
  const query = inputElem.value.trim();
  if (!query) return;

  if (resultsContainer) {
    resultsContainer.classList.remove('hidden');
    resultsContainer.innerHTML = `<div class="text-center py-2 text-slate-400 text-xs"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Searching YouTube for "${query}"...</div>`;
  }

  try {
    const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=3`);
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      loadYouTubePlayerByQuery(query);
      return;
    }

    let html = `<p class="text-[10px] text-slate-400 font-bold uppercase mb-1">Select Track:</p>`;
    data.results.forEach(item => {
      const trackSearch = `${item.artistName} - ${item.trackName}`;
      html += `
        <div onclick="selectSearchResult('${trackSearch}')" class="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors mb-1">
          <div class="overflow-hidden">
            <p class="text-xs font-bold text-white truncate">${item.trackName}</p>
            <p class="text-[10px] text-slate-400 truncate">${item.artistName}</p>
          </div>
          <span class="text-xs text-indigo-400 font-bold">▶ Play</span>
        </div>`;
    });

    if (resultsContainer) resultsContainer.innerHTML = html;
  } catch (err) {
    loadYouTubePlayerByQuery(query);
  }
}

// Handler when user picks a track from search results
function selectSearchResult(searchTerm) {
  const resultsContainer = document.getElementById('yt-search-results');
  if (resultsContainer) resultsContainer.classList.add('hidden');
  loadYouTubePlayerByQuery(searchTerm);
}

// 2. EMBED PLAYER LOADER
function loadYouTubePlayerByQuery(query) {
  const container = document.getElementById('yt-player-container');
  if (!container) return;

  const embedUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}&autoplay=1`;

  container.innerHTML = `
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xl space-y-3">
      <!-- Compact 90px Audio Player -->
      <div class="overflow-hidden rounded-lg h-[90px] w-full bg-black">
        <iframe width="100%" height="90" src="${embedUrl}" title="YouTube Player" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
      </div>
      
      <!-- Toolbar Controls -->
      <div class="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs">
        <!-- Key Transposer -->
        <div class="flex items-center gap-1.5">
          <span class="text-[10px] text-slate-400 font-semibold uppercase">Key:</span>
          <button onclick="transpose(-1)" class="w-6 h-6 bg-slate-800 font-bold rounded text-white hover:bg-slate-700">-</button>
          <span id="key-shift-indicator" class="font-mono font-bold text-indigo-400">0</span>
          <button onclick="transpose(1)" class="w-6 h-6 bg-slate-800 font-bold rounded text-white hover:bg-slate-700">+</button>
        </div>
        
        <!-- Hands-free Auto-Scroll -->
        <div class="flex items-center gap-2">
          <button id="scroll-toggle-btn" onclick="toggleAutoScroll()" class="bg-indigo-600 text-white px-2.5 py-1 rounded font-semibold text-[11px] hover:bg-indigo-500">
            <span id="scroll-btn-text">Scroll</span>
          </button>
          <input type="range" id="scroll-speed" min="1" max="10" value="3" class="w-14 h-1 bg-slate-700 appearance-none rounded accent-indigo-500" />
        </div>
      </div>
    </div>`;

  container.classList.remove('hidden');
  const resultsContainer = document.getElementById('yt-search-results');
  if (resultsContainer) resultsContainer.classList.add('hidden');
}

// 3. DEMO TRACK & RENDERER
function loadDemoSong() {
  loadYouTubePlayerByQuery(demoSongData.youtubeQuery);
  renderChordSheet(demoSongData);
}

function renderChordSheet(song) {
  const canvas = document.getElementById('chord-canvas');
  if (!canvas) return;

  let html = `<div class="mb-3 border-b border-slate-800 pb-2"><h2 class="text-sm font-bold text-white">${song.title}</h2><p class="text-[11px] text-slate-400">${song.artist}</p></div><div class="space-y-3">`;
  song.lines.forEach((line) => {
    html += `<div class="song-line"><div class="flex gap-1 mb-1">`;
    line.chords.forEach(chord => {
      const shiftedChord = transposeChord(chord, currentKeyShift);
      html += `<span class="chord-block">${shiftedChord}</span>`;
    });
    html += `</div><p class="text-xs text-slate-300 font-mono">${line.lyrics}</p></div>`;
  });
  html += `</div>`;
  canvas.innerHTML = html;
}

// 4. TRANSPOSER LOGIC
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

// 5. AUTO-SCROLL LOGIC
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
  
  const canvas = document.getElementById('chord-canvas');
  if (canvas) {
    canvas.innerHTML = `<div class="text-center py-10 text-slate-500"><p class="text-xs">Type a song above and tap <strong>Search</strong>!</p></div>`;
  }
}
