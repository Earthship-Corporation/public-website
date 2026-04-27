/* ============================================
   Proto-Town — Radio Booth Stream Switcher
   ============================================
   Detects when the Proto-Town Radio Booth stream is live by polling
   its Cloudflare Stream HLS manifest (200 = live, 204 = offline).
   When live: swaps the default camera feed for the radio booth stream
   (unmuted, with its own audio) and hides the KLKT radio panel.
   When offline: restores the default Cloudflare Stream feed + radio. */

(function () {
  'use strict';

  var CF_BASE      = 'https://customer-jvitd3fw0f6iv9bm.cloudflarestream.com/';
  var BOOTH_ID     = 'e5e83e2f7551b57db275ef55784e1cfe';
  var DEFAULT_ID   = '71d96000406138bcd6cced6b04863058';
  var DEFAULT_SRC  = CF_BASE + DEFAULT_ID + '/iframe?muted=true&autoplay=true';
  var BOOTH_SRC    = CF_BASE + BOOTH_ID + '/iframe?muted=false&autoplay=true';
  var MANIFEST_URL = CF_BASE + BOOTH_ID + '/manifest/video.m3u8';
  var POLL_MS      = 15000;

  var iframeEl     = document.getElementById('livestream');
  var radioPanel   = document.getElementById('radio-panel');
  var feedLabel    = document.querySelector('.feed-label');
  var windowTitle  = document.querySelector('.window-title');
  var statusLabel  = document.querySelector('.status-label');
  var streamStatus = document.getElementById('stream-status');
  var banner       = document.getElementById('special-broadcast-banner');
  var isBoothLive  = false;
  var testOverride = false;

  function switchToBooth() {
    if (isBoothLive) return;
    isBoothLive = true;

    iframeEl.src = BOOTH_SRC;

    if (window.ProtoRadio) window.ProtoRadio.pause();
    radioPanel.classList.add('stream-hidden');

    if (feedLabel)   feedLabel.textContent = 'RADIO BOOTH';
    if (windowTitle) windowTitle.textContent = 'LIVE — PROTO-TOWN RADIO';
    if (statusLabel) statusLabel.textContent = 'RADIO BOOTH LIVE';

    if (streamStatus) streamStatus.classList.add('special');
    if (banner) banner.classList.add('active');
    document.body.classList.add('special-live');
  }

  function switchToDefault() {
    if (!isBoothLive) return;
    isBoothLive = false;

    iframeEl.src = DEFAULT_SRC;

    radioPanel.classList.remove('stream-hidden');

    if (feedLabel)   feedLabel.textContent = 'CAM-01';
    if (windowTitle) windowTitle.textContent = 'FEED — PROTO-TOWN, USA';
    if (statusLabel) statusLabel.textContent = 'PROTO-TOWN BROADCAST';

    if (streamStatus) streamStatus.classList.remove('special');
    if (banner) banner.classList.remove('active');
    document.body.classList.remove('special-live');
  }

  function checkLive() {
    if (testOverride) return;
    fetch(MANIFEST_URL, { method: 'HEAD' })
      .then(function (r) {
        if (r.status === 200) {
          switchToBooth();
        } else {
          switchToDefault();
        }
      })
      .catch(function () {
        /* On network error, keep current state */
      });
  }

  checkLive();
  setInterval(checkLive, POLL_MS);

  /* Manual testing: goLive() / goDefault() pause polling so the
     override isn't immediately reverted by the next check cycle. */
  window.ProtoStream = {
    goLive: function () { testOverride = true; switchToBooth(); },
    goDefault: function () { testOverride = true; switchToDefault(); },
    resume: function () { testOverride = false; checkLive(); },
    isLive: function () { return isBoothLive; }
  };
})();
