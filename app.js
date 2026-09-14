let currentKeyShift = 0;
let scrollInterval = null;
let suggestionDebounce = null;
const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const demoSongData = {
  title: "Still",
  artist: "Hillsong Worship",
  lines: [
    { chords: ["C", "G", "Am"], lyrics: "Hide me now, under Your wings" },
    { chords: ["F", "D", "G"], lyrics: "Cover me, within Your mighty hand" },
    { chords: ["F", "G", "C"], lyrics: "When the oceans rise and thunders roar" },
    { chords: ["F", "G", "Am"], lyrics: "I will soar with You above the storm" }
  ]
};

// 1. LIVE SUGGESTIONS
function handleSearchSuggestions() {
  clearTimeout(suggestionDebounce);
  const input = document.getElementById('yt-search-input');
  const suggestionsBox = document.getElementById('yt-suggestions');

  if (!input || !suggestionsBox) return;
  const query = input.value.trim();

  // Huwag mag-suggest kapag direct link ang in-input
  if (query.length < 2 || query.includes('http://') || query.includes('https://')) {
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
          html += `<div onclick="selectSuggestion('${text.replace(/'/g, "\\'")}')" class="px-3 py-2 text-xs text-slate-200 hover:bg-indigo-600 hover:text-white cursor-pointer border-b border-slate-700/50 last:border-none flex items-center gap-2">
            <i class="fa-solid fa-magnifying-glass text-[10px] text-slate-400"></i> ${text}
          </div>`;
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
  processMediaInput();
}

// 2. YOUTUBE VIDEO ID EXTRACTOR & EMBED ENGINE
function extractYouTubeId(urlOrText) {
  if (!urlOrText) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = urlOrText.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function processMediaInput() {
  const inputElem = document.getElementById('yt-search-input');
  const suggestionsBox = document.getElementById('yt-suggestions');
  if (suggestionsBox) suggestionsBox.classList.add('hidden');
  if (!inputElem) return;

  const rawInput = inputElem.value.trim();
  if (!rawInput) return;

  const videoId = extractYouTubeId(rawInput);

  if (videoId) {
    // Kapag Direct Link o Direct Video ID
    renderEmbedPlayer(videoId);
  } else {
    // Kapag Title Search (Gumamit ng Direct Search Query Format)
    const searchEmbedUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(rawInput)}`;
    renderPlayerIframe(searchEmbedUrl);
  }
}

function renderEmbedPlayer(videoId) {
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
  renderPlayerIframe(embedUrl);
}

function renderPlayerIframe(embedUrl) {
  const container = document.getElementById('yt-player-container');
  if (!container) return;

  container.innerHTML = `
    <div class="bg-slate-800 border border-slate-700/80 rounded-2xl p-3 shadow-xl space-y-3">
      <div class="overflow-hidden rounded-xl h-[120px] w-full bg-black border border-slate-900">
        <iframe width="100%" height="120" src="${embedUrl}" title="YouTube Player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </div>
      <div class="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-700/80 text-xs">
        <div class="flex items-center gap-1.5">
          <span class="text-[10px] text-slate-400 font-bold uppercase">Key:</span>
          <button onclick="transpose(-1)" class="w-6 h-6 bg-slate-800 hover:bg-slate-700 font-bold rounded-lg text-white border border-slate-700">-</button>
          <span id="key-shift-indicator" class="font-mono font-bold text-indigo-400 px-1">0</span>
          <button onclick="transpose(1)" class="w-6 h-6 bg-slate-800 hover:bg-slate-700 font-bold rounded-lg text-white border border-slate-700">+</button>
        </div>
        <div class="flex items-center gap-2">
          <button id="scroll-toggle-btn" onclick="toggleAutoScroll()" class="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-lg font-bold text-[11px] transition">
            <span id="scroll-btn-text">Scroll</span>
          </button>
          <input type="range" id="scroll-speed" min="1" max="10" value="3" class="w-14 h-1 bg-slate-700 appearance-none rounded accent-indigo-500" />
        </div>
      </div>
    </div>`;

  container.classList.remove('hidden');
}

// 3. DEMO TRACK & RENDERER
function loadDemoSong() {
  renderEmbedPlayer("gWW2a3B46X0"); // Hillsong - Still Official Video ID
  renderChordSheet(demoSongData);
}

function renderChordSheet(song) {
  const canvas = document.getElementById('chord-canvas');
  if (!canvas) return;

  let html = `<div class="mb-3 border-b border-slate-700/80 pb-2"><h2 class="text-sm font-bold text-white">${song.title}</h2><p class="text-[11px] text-slate-400">${song.artist}</p></div><div class="space-y-3">`;
  song.lines.forEach((line) => {
    html += `<div class="song-line"><div class="flex flex-wrap gap-1 mb-1">`;
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
    canvas.innerHTML = `<div class="text-center py-12 text-slate-500"><i class="fa-solid fa-music text-3xl mb-2 block text-slate-600"></i><p class="text-xs">Paste a YouTube URL or tap <strong>Load Demo Track</strong>!</p></div>`;
  }
}
