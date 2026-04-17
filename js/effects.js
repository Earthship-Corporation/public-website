/* ============================================
   Proto-Town Broadcast — Effects & Interactivity
   ============================================ */

(function () {
  'use strict';

  // --- Clock ---
  const clockEl = document.getElementById('clock');
  const dateEl = document.getElementById('date-display');

  function updateClock() {
    var now = new Date();

    // Time in CT (Central Time)
    var timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'America/Chicago'
    });

    var dateStr = now.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'America/Chicago'
    }).toUpperCase();

    if (clockEl) clockEl.textContent = timeStr + ' CT';
    if (dateEl) dateEl.textContent = dateStr;
  }

  updateClock();
  setInterval(updateClock, 1000);

  // --- Subtle random flicker on CRT overlay (very occasional) ---
  var crtOverlay = document.querySelector('.crt-overlay');
  if (crtOverlay) {
    setInterval(function () {
      if (Math.random() < 0.03) {
        crtOverlay.style.opacity = '0.6';
        setTimeout(function () {
          crtOverlay.style.opacity = '1';
        }, 80);
      }
    }, 2000);
  }
})();
