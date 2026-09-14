let player = null;
let currentKeyShift = 0;
let scrollInterval = null;
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

// YouTube API Ready Callback
function onYouTubeIframeAPIReady() {
  player = new YT.Player('yt-player', {
    height: '100%',
    width: '100%',
    videoId: '',
    playerVars: {
      'playsinline': 1,
      'rel': 0
    }
  });
}

function extractYouTubeId(urlOrId) {
  if (!urlOrId) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = urlOrId.trim().match(regExp);
  return (match && match[2].length === 11) ? match[2] : urlOrId.trim();
}

function loadYouTubeVideo() {
  const input = document.getElementById('yt-url-input');
  if (!input || !input.value.trim()) return;

  const videoId = extractYouTubeId(input.value);
  if (!videoId) return;

  document.getElementById('player-wrapper').classList.remove('hidden');

  if (player && typeof player.loadVideoById === 'function') {
    player.loadVideoById(videoId);
  } else {
    // Retry initialization if API is still loading
    setTimeout(() => {
      if (player && typeof player.loadVideoById === 'function') {
        player.loadVideoById(videoId);
      }
    }, 500);
  }
}

function loadDemoSong() {
  document.getElementById('yt-url-input').value = 'https://www.youtube.com/watch?v=gWW2a3B46X0';
  loadYouTubeVideo();
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

function resetApp() {
  if (scrollInterval) clearInterval(scrollInterval);
  if (player && typeof player.stopVideo === 'function') player.stopVideo();
  document.getElementById('player-wrapper').classList.add('hidden');
  document.getElementById('yt-url-input').value = '';
  document.getElementById('chord-canvas').innerHTML = `
    <div class="text-center py-12 text-slate-500">
      <i class="fa-solid fa-music text-3xl mb-2 block text-slate-600"></i>
      <p class="text-xs">Paste a YouTube link above to sync video & chords.</p>
    </div>`;
}
