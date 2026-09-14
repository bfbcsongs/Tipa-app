// ==========================================
// PWA CHORDIFY LAB - APP.JS
// ==========================================

let currentKeyShift = 0;
let scrollInterval = null;
const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Sample Demo Track Data
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

// 1. DIRECT IN-APP YOUTUBE SEARCH
async function searchYouTubeDirect() {
  const query = document.getElementById('yt-search-input').value.trim();
  const resultsContainer = document.getElementById('yt-search-results');

  if (!query) return;

  resultsContainer.classList.remove('hidden');
  resultsContainer.innerHTML = `
    <div class="text-center py-2 text-slate-400 text-xs">
      🔍 Searching tracks for "${query}"...
    </div>
  `;

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
        <div onclick="selectSearchResult('${trackSearch}')" 
             class="flex items-center justify-between bg-slate-950 hover:bg-slate-800 p-2 rounded-lg border border-slate-800 cursor-pointer transition-colors">
          <div class="overflow-hidden">
            <p class="text-xs font-bold text-white truncate">${item.trackName}</p>
            <p class="text-[10px] text-slate-400 truncate">${item.artistName}</p>
          </div>
          <span class="text-xs text-indigo-400 font-bold">▶ Play</span>
        </div>
      `;
    });

    resultsContainer.innerHTML = html;

  } catch (err) {
    loadYouTubePlayerByQuery(query);
  }
}

function selectSearchResult(searchTerm) {
  document.getElementById('yt-search-results').classList.add('hidden');
  loadYouTubePlayerByQuery(searchTerm);
}

function loadYouTubePlayerByQuery(query) {
  const container = document.getElementById('yt-player-container');
  const embedUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}&autoplay=1`;

  container.innerHTML = `
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xl space-y-3">
      <!-- 90px Compact Audio Player Embed -->
      <div class="overflow-hidden rounded-lg h-[90px] w-full bg-black">
        <iframe 
          width="100%" 
          height="90" 
          src="${embedUrl}" 
          title="YouTube Player" 
          frameborder="0" 
          allow="autoplay; encrypted-media" 
          allowfullscreen>
        </iframe>
      </div>

      <!-- Controls Toolbar -->
      <div class="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs">
        <!-- Transposer -->
        <div class="flex items-center gap-1.5">
          <span class="text-[10px] text-slate-400 font-semibold uppercase">Key:</span>
          <button onclick="transpose(-1)" class="w-6 h-6 bg-slate-800 font-bold rounded text-white">-</button>
          <span id="key-shift-indicator" class="font-mono font-bold text-indigo-400">0</span>
          <button onclick="transpose(1)" class="w-6 h-6 bg-slate-800 font-bold rounded text-white">+</button>
        </div>

        <!-- Auto-Scroll -->
        <div class="flex items-center gap-2">
          <button id="scroll-toggle-btn" onclick="toggleAutoScroll()" class="bg-indigo-600 text-white px-2.5 py-1 rounded font-semibold text-[11px]">
            <span id="scroll-btn-text">Scroll</span>
          </button>
          <input type="range" id="scroll-speed" min="1" max="10" value="3" class="w-14 h-1 bg-slate-700 appearance-none rounded accent-indigo-500" />
        </div>
      </div>
    </div>
  `;

  container.classList.remove('hidden');
  document.getElementById('yt-search-results').classList.add('hidden');
}

// 2. DEMO SONG & CHORD SHEET RENDERER
function loadDemoSong() {
  loadYouTubePlayerByQuery(demoSongData.youtubeQuery);
  renderChordSheet(demoSongData);
}

function renderChordSheet(song) {
  const canvas = document.getElementById('chord-canvas');
  
  let html = `
    <div class="mb-3 border-b border-slate-800 pb-2">
      <h2 class="text-sm font-bold text-white">${song.title}</h2>
      <p class="text-[11px] text-slate-400">${song.artist}</p>
    </div>
    <div class="space-y-3">
  `;

  song.lines.forEach((line) => {
    html += `<div class="song-line">`;
    html += `<div class="flex gap-1 mb-1">`;
    line.chords.forEach(chord => {
      const shiftedChord = transposeChord(chord, currentKeyShift);
      html += `<span class="chord-block">${shiftedChord}</span>`;
    });
    html += `</div>`;
    html += `<p class="text-xs text-slate-300 font-mono">${line.lyrics}</p>`;
    html += `</div>`;
  });

  html += `</div>`;
  canvas.innerHTML = html;
}

// 3. TRANSPOSER LOGIC
function transpose(semitones) {
  currentKeyShift += semitones;
  document.getElementById('key-shift-indicator').innerText = (currentKeyShift > 0 ? '+' : '') + currentKeyShift;
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

// 4. AUTO-SCROLL LOGIC
function toggleAutoScroll() {
  const btnText = document.getElementById('scroll-btn-text');
  
  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;
    btnText.innerText = 'Scroll';
  } else {
    btnText.innerText = 'Pause';
    scrollInterval = setInterval(() => {
      const speed = document.getElementById('scroll-speed').value;
      window.scrollBy({ top: parseInt(speed), behavior: 'smooth' });
    }, 100);
  }
}

function clearCanvas() {
  if (scrollInterval) clearInterval(scrollInterval);
  currentKeyShift = 0;
  document.getElementById('yt-player-container').classList.add('hidden');
  document.getElementById('chord-canvas').innerHTML = `
    <div class="text-center py-10 text-slate-500">
      <p class="text-xs">Type a song above and tap <strong>Search</strong> to load music & chords!</p>
    </div>
  `;
}
