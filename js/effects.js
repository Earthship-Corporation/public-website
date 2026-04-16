/* ============================================
   Proto-Town Broadcast — Effects & Interactivity
   ============================================ */

(function () {
  'use strict';

  // --- Boot Sequence ---
  const bootScreen = document.getElementById('boot-screen');
  const site = document.getElementById('site');

  function endBoot() {
    bootScreen.classList.add('fade-out');
    site.classList.remove('hidden');
    setTimeout(function () {
      bootScreen.style.display = 'none';
    }, 500);
  }

  // Show boot screen for ~1.8s then reveal site
  setTimeout(endBoot, 1800);

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
