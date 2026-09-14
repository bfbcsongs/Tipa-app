let currentKeyShift = 0;
let scrollInterval = null;
const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const demoSong = {
  title: "Still",
  artist: "Hillsong Worship",
  lines: [
    { chords: ["C", "G", "Am"], lyrics: "Hide me now, under Your wings" },
    { chords: ["F", "D", "G"], lyrics: "Cover me, within Your mighty hand" },
    { chords: ["F", "G", "C"], lyrics: "When the oceans rise and thunders roar" },
    { chords: ["F", "G", "Am"], lyrics: "I will soar with You above the storm" }
  ]
};

// Pure URL/ID Regex Extractor
function getYouTubeId(input) {
  if (!input) return null;
  const match = input.trim().match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : (input.trim().length === 11 ? input.trim() : null);
}

function playVideo() {
  const input = document.getElementById('yt-url-input').value;
  const videoId = getYouTubeId(input);

  if (!videoId) {
    alert("Pakilagay po ang valid na YouTube link o 11-character Video ID.");
    return;
  }

  const container = document.getElementById('iframe-container');
  container.innerHTML = `<iframe class="w-full h-full" src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;

  document.getElementById('player-box').classList.remove('hidden');
}

function loadDemoTrack() {
  document.getElementById('yt-url-input').value = 'https://www.youtube.com/watch?v=gWW2a3B46X0';
  playVideo();
  renderChords(demoSong);
}

function renderChords(song) {
  const canvas = document.getElementById('chord-canvas');
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
  document.getElementById('key-shift-indicator').innerText = (currentKeyShift > 0 ? '+' : '') + currentKeyShift;
  renderChords(demoSong);
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
    btnText.innerText = 'Scroll';
  } else {
    btnText.innerText = 'Pause';
    scrollInterval = setInterval(() => {
      const speed = document.getElementById('scroll-speed').value;
      window.scrollBy({ top: parseInt(speed), behavior: 'smooth' });
    }, 100);
  }
}

function resetAll() {
  if (scrollInterval) clearInterval(scrollInterval);
  document.getElementById('player-box').classList.add('hidden');
  document.getElementById('iframe-container').innerHTML = '';
  document.getElementById('yt-url-input').value = '';
  document.getElementById('chord-canvas').innerHTML = `
    <div class="text-center py-10 text-slate-500">
      <i class="fa-solid fa-music text-3xl mb-2 block text-slate-600"></i>
      <p class="text-xs">Paste a YouTube link above or click Demo Song.</p>
    </div>`;
}
