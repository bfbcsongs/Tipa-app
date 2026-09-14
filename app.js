let activeAudio = document.getElementById('main-audio');

// 1. Time-Stamped Chord Data (Seconds : Chord)
const chordTimelineData = [
  { time: 0, chord: "C" },
  { time: 3, chord: "G" },
  { time: 6, chord: "Am" },
  { time: 9, chord: "F" },
  { time: 12, chord: "C" },
  { time: 15, chord: "G" },
  { time: 18, chord: "F" },
  { time: 21, chord: "C" }
];

function loadAudioTrack(event) {
  const file = event.target.files[0];
  if (!file) return;

  document.getElementById('track-name').innerText = file.name;
  activeAudio.src = URL.createObjectURL(file);
  document.getElementById('player-card').classList.remove('hidden');

  renderTimelineTiles();
  
  // Attach time listener for real-time chord highlighting
  activeAudio.ontimeupdate = syncChordsToTime;
}

function renderTimelineTiles() {
  const container = document.getElementById('chord-timeline');
  container.innerHTML = '';

  chordTimelineData.forEach((item, index) => {
    const tile = document.createElement('div');
    tile.id = `chord-tile-${index}`;
    tile.className = "chord-tile bg-slate-800 border border-slate-700 rounded-lg p-2 text-center text-xs font-bold font-mono text-slate-300";
    tile.innerHTML = `<div>${item.chord}</div><div class="text-[9px] text-slate-500 font-sans">${item.time}s</div>`;
    container.appendChild(tile);
  });
}

function syncChordsToTime() {
  const currentTime = activeAudio.currentTime;
  let activeIndex = -1;

  // Find the matching chord for the current playback time
  for (let i = 0; i < chordTimelineData.length; i++) {
    if (currentTime >= chordTimelineData[i].time) {
      activeIndex = i;
    } else {
      break;
    }
  }

  if (activeIndex !== -1) {
    const activeChord = chordTimelineData[activeIndex].chord;
    document.getElementById('current-chord-display').innerText = activeChord;

    // Highlight active tile in timeline grid
    document.querySelectorAll('.chord-tile').forEach(tile => tile.classList.remove('chord-active'));
    const currentTile = document.getElementById(`chord-tile-${activeIndex}`);
    if (currentTile) {
      currentTile.classList.add('chord-active');
      currentTile.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}
