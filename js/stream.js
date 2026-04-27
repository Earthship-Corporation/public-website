/* ============================================
   Proto-Town — Custom Stream Switcher
   ============================================
   Polls a status endpoint to detect when a custom broadcast is live.
   When live: swaps the default camera feed for the custom stream
   (unmuted, with its own audio) and hides the KLKT radio panel.
   When offline: restores the default Cloudflare Stream feed + radio. */

(function () {
  'use strict';

  var STATUS_URL       = 'https://stream-status.proto.town/';
  var POLL_INTERVAL    = 15000;
  var CF_CUSTOMER_BASE = 'https://customer-jvitd3fw0f6iv9bm.cloudflarestream.com/';
  var DEFAULT_VIDEO_ID = '71d96000406138bcd6cced6b04863058';
  var DEFAULT_SRC      = CF_CUSTOMER_BASE + DEFAULT_VIDEO_ID + '/iframe?muted=true&autoplay=true';

  var iframeEl      = document.getElementById('livestream');
  var radioPanel    = document.getElementById('radio-panel');
  var feedLabel     = document.querySelector('.feed-label');
  var windowTitle   = document.querySelector('.window-title');
  var statusLabel   = document.querySelector('.status-label');
  var streamStatus  = document.getElementById('stream-status');
  var banner        = document.getElementById('special-broadcast-banner');
  var isCustomLive  = false;

  function buildCustomSrc(videoId) {
    return CF_CUSTOMER_BASE + videoId + '/iframe?muted=false&autoplay=true';
  }

  function switchToCustomStream(videoId) {
    if (isCustomLive) return;
    isCustomLive = true;

    iframeEl.src = buildCustomSrc(videoId);

    if (window.ProtoRadio) window.ProtoRadio.pause();
    radioPanel.classList.add('stream-hidden');

    if (feedLabel)   feedLabel.textContent = 'LIVE BROADCAST';
    if (windowTitle) windowTitle.textContent = 'LIVE — PROTO-TOWN, USA';
    if (statusLabel) statusLabel.textContent = 'SPECIAL BROADCAST';

    if (streamStatus) streamStatus.classList.add('special');
    if (banner) banner.classList.add('active');

    document.body.classList.add('special-live');
  }

  function switchToDefault() {
    if (!isCustomLive) return;
    isCustomLive = false;

    iframeEl.src = DEFAULT_SRC;

    radioPanel.classList.remove('stream-hidden');

    if (feedLabel)   feedLabel.textContent = 'CAM-01';
    if (windowTitle) windowTitle.textContent = 'FEED — PROTO-TOWN, USA';
    if (statusLabel) statusLabel.textContent = 'PROTO-TOWN BROADCAST';

    if (streamStatus) streamStatus.classList.remove('special');
    if (banner) banner.classList.remove('active');

    document.body.classList.remove('special-live');
  }

  function checkLiveStatus() {
    fetch(STATUS_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.live && data.videoId) {
          switchToCustomStream(data.videoId);
        } else {
          switchToDefault();
        }
      })
      .catch(function () {
        /* On fetch error, keep current state (don't flicker) */
      });
  }

  checkLiveStatus();
  setInterval(checkLiveStatus, POLL_INTERVAL);

  /* Expose for manual testing: ProtoStream.goLive() / ProtoStream.goDefault() */
  window.ProtoStream = {
    goLive: function (videoId) {
      switchToCustomStream(videoId || 'test');
    },
    goDefault: function () {
      switchToDefault();
    },
    isLive: function () { return isCustomLive; }
  };
})();
