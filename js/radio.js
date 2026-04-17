/* ============================================
   Proto-Town Radio — KLKT 107.9 FM Audio Engine
   ============================================ */

(function () {
  'use strict';

  var STREAM_URL = 'https://klkt.broadcasttool.stream/play';

  var audio = null;
  var audioCtx = null;
  var analyser = null;
  var source = null;
  var isPlaying = false;
  var isInitialized = false;

  var MAX_RETRIES = 5;
  var BASE_DELAY = 2000; // 2s, doubles each retry
  var retryCount = 0;
  var retryTimer = null;

  var playBtn = document.getElementById('radio-play-btn');
  var playIcon = document.getElementById('radio-play-icon');
  var volumeSlider = document.getElementById('radio-volume');
  var statusText = document.getElementById('radio-status');
  var radioPanel = document.getElementById('radio-panel');

  function initAudio() {
    if (isInitialized) return;

    audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'none';
    audio.src = STREAM_URL;

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.8;

    source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    audio.volume = volumeSlider ? parseFloat(volumeSlider.value) : 0.4;

    audio.addEventListener('playing', function () {
      retryCount = 0; // reset on successful playback
      if (statusText) statusText.textContent = 'KLKT 107.9 · LOCKHART, TX';
    });

    audio.addEventListener('waiting', function () {
      if (statusText) statusText.textContent = 'TUNING IN...';
    });

    audio.addEventListener('error', function () {
      if (isPlaying) {
        attemptRetry();
      }
    });

    isInitialized = true;
  }

  function attemptRetry() {
    if (retryCount >= MAX_RETRIES) {
      if (statusText) statusText.textContent = 'OFF AIR';
      isPlaying = false;
      updatePlayButton();
      return;
    }
    retryCount++;
    var delay = BASE_DELAY * Math.pow(2, retryCount - 1);
    if (statusText) statusText.textContent = 'RECONNECTING...';
    retryTimer = setTimeout(function () {
      if (!isPlaying) return; // user stopped during wait
      audio.src = STREAM_URL;
      audio.play().catch(function () {
        attemptRetry();
      });
    }, delay);
  }

  function cancelRetry() {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    retryCount = 0;
  }

  function updatePlayButton() {
    if (!playIcon) return;
    if (isPlaying) {
      playIcon.textContent = '\u25A0'; // ■ stop square
      if (radioPanel) radioPanel.classList.add('is-playing');
    } else {
      playIcon.textContent = '\u25B6'; // ▶ play triangle
      if (radioPanel) radioPanel.classList.remove('is-playing');
    }
  }

  function togglePlay() {
    if (!isInitialized) initAudio();

    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    if (isPlaying) {
      cancelRetry();
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      isPlaying = false;
      if (statusText) statusText.textContent = 'KLKT 107.9 · STANDBY';
    } else {
      cancelRetry();
      audio.src = STREAM_URL;
      audio.play().catch(function () {
        isPlaying = true; // ensure retry loop can run
        attemptRetry();
      });
      isPlaying = true;
      if (statusText) statusText.textContent = 'TUNING IN...';
    }

    updatePlayButton();
  }

  if (playBtn) {
    playBtn.addEventListener('click', togglePlay);
  }

  if (volumeSlider) {
    volumeSlider.addEventListener('input', function () {
      if (audio) audio.volume = parseFloat(this.value);
    });
  }

  // Expose analyser for the visualizer
  window.protoRadio = {
    getAnalyser: function () { return analyser; },
    isPlaying: function () { return isPlaying; }
  };
})();
