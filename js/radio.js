/* ============================================
   Proto-Town Radio — KLKT 107.9 FM Audio Engine
   ============================================ */

(function () {
  'use strict';

  var STREAM_URL = 'https://klkt.broadcasttool.stream/play';

  var audio = null;
  var isPlaying = false;
  var isInitialized = false;

  var BASE_DELAY = 2; // seconds, doubles each retry
  var MAX_DELAY = 120; // cap at 2 minutes
  var retryCount = 0;
  var retryTimer = null;
  var countdownTimer = null;

  var playBtn = document.getElementById('radio-play-btn');
  var playIcon = document.getElementById('radio-play-icon');
  var volumeSlider = document.getElementById('radio-volume');
  var statusText = document.getElementById('radio-status');
  var radioPanel = document.getElementById('radio-panel');

  function initAudio() {
    if (isInitialized) return;

    audio = new Audio();
    audio.preload = 'none';

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
    retryCount++;
    var delay = Math.min(BASE_DELAY * Math.pow(2, retryCount - 1), MAX_DELAY);
    var remaining = delay;

    if (statusText) statusText.textContent = 'RECONNECTING IN ' + remaining + 's';

    countdownTimer = setInterval(function () {
      remaining--;
      if (remaining <= 0 || !isPlaying) {
        clearInterval(countdownTimer);
        countdownTimer = null;
        return;
      }
      if (statusText) statusText.textContent = 'RECONNECTING IN ' + remaining + 's';
    }, 1000);

    retryTimer = setTimeout(function () {
      if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
      if (!isPlaying) return; // user stopped during wait
      if (statusText) statusText.textContent = 'TUNING IN...';
      audio.src = STREAM_URL;
      audio.play().catch(function () {
        attemptRetry();
      });
    }, delay * 1000);
  }

  function cancelRetry() {
    if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
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

  window.ProtoRadio = {
    pause: function () { if (isPlaying) togglePlay(); },
    resume: function () { if (!isPlaying) togglePlay(); },
    isPlaying: function () { return isPlaying; }
  };
})();
