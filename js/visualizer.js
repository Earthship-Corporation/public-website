/* ============================================
   Proto-Town Radio — Retro Frequency Visualizer
   ============================================ */

(function () {
  'use strict';

  var canvas = document.getElementById('radio-visualizer');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var animId = null;

  // Colors — amber/rust gradient
  var BAR_COLOR_BOTTOM = '#d4a254';
  var BAR_COLOR_TOP = '#c45d3e';
  var BAR_GLOW = 'rgba(212, 162, 84, 0.3)';
  var BG_COLOR = '#0d0f08';
  var GRID_COLOR = 'rgba(80, 90, 60, 0.15)';

  // Idle shimmer state
  var idleBars = [];
  var idleTargets = [];
  var IDLE_BAR_COUNT = 32;

  function initIdleBars() {
    for (var i = 0; i < IDLE_BAR_COUNT; i++) {
      idleBars[i] = Math.random() * 0.15;
      idleTargets[i] = Math.random() * 0.2;
    }
  }
  initIdleBars();

  function updateIdleBars() {
    for (var i = 0; i < IDLE_BAR_COUNT; i++) {
      idleBars[i] += (idleTargets[i] - idleBars[i]) * 0.08;
      if (Math.abs(idleBars[i] - idleTargets[i]) < 0.01) {
        idleTargets[i] = Math.random() * 0.25;
      }
    }
  }

  function resizeCanvas() {
    var rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = Math.floor(rect.width);
    canvas.height = Math.floor(rect.height);
  }

  function drawBars(barData, count) {
    var w = canvas.width;
    var h = canvas.height;

    // Clear
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 0.5;
    var gridSpacing = h / 6;
    for (var g = 1; g < 6; g++) {
      var gy = Math.floor(g * gridSpacing) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }

    // Bars
    var gap = 2;
    var barWidth = Math.max(2, (w - gap * (count + 1)) / count);
    var x = gap;

    for (var i = 0; i < count; i++) {
      var val = barData[i]; // 0..1
      var barHeight = val * h * 0.9;

      if (barHeight < 1) barHeight = 1;

      // Gradient per bar
      var grad = ctx.createLinearGradient(x, h, x, h - barHeight);
      grad.addColorStop(0, BAR_COLOR_BOTTOM);
      grad.addColorStop(1, BAR_COLOR_TOP);

      // Glow
      ctx.shadowColor = BAR_GLOW;
      ctx.shadowBlur = barHeight > 10 ? 6 : 2;

      ctx.fillStyle = grad;
      ctx.fillRect(Math.floor(x), Math.floor(h - barHeight), Math.floor(barWidth), Math.floor(barHeight));

      // Peak indicator (bright line at top)
      if (barHeight > 4) {
        ctx.fillStyle = '#f0d090';
        ctx.fillRect(Math.floor(x), Math.floor(h - barHeight), Math.floor(barWidth), 1.5);
      }

      x += barWidth + gap;
    }

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Scanline overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
    for (var s = 0; s < h; s += 3) {
      ctx.fillRect(0, s, w, 1);
    }
  }

  function draw() {
    var radio = window.protoRadio;
    var analyser = radio ? radio.getAnalyser() : null;
    var playing = radio ? radio.isPlaying() : false;

    resizeCanvas();

    if (playing && analyser) {
      // Real frequency data
      var bufferLength = analyser.frequencyBinCount;
      var dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      var normalized = [];
      for (var i = 0; i < bufferLength; i++) {
        normalized[i] = dataArray[i] / 255;
      }
      drawBars(normalized, bufferLength);
    } else {
      // Idle shimmer
      updateIdleBars();
      drawBars(idleBars, IDLE_BAR_COUNT);
    }

    animId = requestAnimationFrame(draw);
  }

  // Start rendering when visible
  var observer = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) {
      if (!animId) draw();
    } else {
      if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    }
  }, { threshold: 0.1 });

  observer.observe(canvas);

  // Also start on load as fallback
  window.addEventListener('load', function () {
    if (!animId) draw();
  });
})();
