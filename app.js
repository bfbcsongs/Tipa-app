let currentKeyShift = 0;
let scrollInterval = null;
let currentSongData = null;
const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// 1. Process Local MP3 Upload
function handleLocalAudio(event) {
  const file = event.target.files[0];
  if (!file) return;

  const canvas = document.getElementById('chord-canvas');
  const playerBox = document.getElementById('player-box');
  const audioPlayer = document.getElementById('audio-player');
  const fileTitle = document.getElementById('file-title');

  // Set File Name
  fileTitle.innerText = file.name;

  // Create Object URL for HTML5 Audio Tag
  const fileUrl = URL.createObjectURL(file);
  audioPlayer.src = fileUrl;

  // Show Processing State
  canvas.innerHTML = `
    <div class="text-center py-10 text-slate-400">
      <i class="fa-solid fa-waveform-lines fa-spin text-2xl mb-2 text-indigo-400"></i>
      <p class="text-xs font-bold">Analyzing Local MP3 File...</p>
      <p class="text-[10px] text-slate-500 mt-1">Detecting key signature and extracting chord structure</p>
    </div>`;

  // Simulate Local Audio Analysis / Detection Engine
  setTimeout(() => {
    currentSongData = analyzeLocalAudioFile(file.name);
    renderChords(currentSongData);
    playerBox.classList.remove('hidden');
  }, 1200);
}

// 2. Local Audio Chord Detection Parser (Generates Chords Based on File Context)
function analyzeLocalAudioFile(fileName) {
  // In production, Web Audio API / Pitch Detection algorithm runs here.
  // For proof of concept, it parses filename or assigns analyzed progression:
  return {
    title: fileName.replace(/\.[^/.]+$/, ""),
    artist: "Local Storage Audio",
    lines: [
      { chords: ["G", "D", "Em", "C"], lyrics: "[Verse 1] Detected Progression A" },
      { chords: ["G", "D", "C"], lyrics: "Audio stream synchronized successfully" },
      { chords: ["Em", "Bm", "C", "D"], lyrics: "[Chorus] Live transpose and scroll active" },
      { chords: ["G", "D", "G"], lyrics: "Ready for playback" }
    ]
  };
}

// 3. Render Chord Sheet
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

// 4. Transpose Functions
function transpose(semitones) {
  currentKeyShift += semitones;
  document.getElementById('key-shift-indicator').innerText = (currentKeyShift > 0 ? '+' : '') + currentKeyShift;
  if (currentSongData) renderChords(currentSongData);
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

// 5. Auto Scroll
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
