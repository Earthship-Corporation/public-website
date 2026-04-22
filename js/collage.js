/* ============================================
   Proto-Town Broadcast — Photo Collage Background
   Scatters a random subset of iconic photos as
   polaroid-style snapshots behind the main UI.
   ============================================ */

(function () {
  'use strict';

  // Photo inventory. Approximate natural aspect ratio (width/height)
  // is hinted so we can size each poster before the image loads and
  // avoid layout shift once they decode.
  var PHOTOS = [
    { src: 'assets/images/d-day.webp', ratio: 1.5 },
    { src: 'assets/images/earthrise.webp', ratio: 1.0 },
    { src: 'assets/images/gettysburg-address.webp', ratio: 1.4 },
    { src: 'assets/images/i-have-a-dream.webp', ratio: 1.45 },
    { src: 'assets/images/iwo-jima.webp', ratio: 1.25 },
    { src: 'assets/images/kitty-hawk.webp', ratio: 1.5 },
    { src: 'assets/images/man-on-moon.jpg', ratio: 0.8 },
    { src: 'assets/images/mars-rover-viking.jpg', ratio: 1.5 },
    { src: 'assets/images/mars-sunset.webp', ratio: 1.5 },
    { src: 'assets/images/muhammad-ali.webp', ratio: 1.3 },
    { src: 'assets/images/nine-eleven-firefighters.webp', ratio: 1.4 },
    { src: 'assets/images/skyscraper-lunch.jpg', ratio: 1.5 },
    { src: 'assets/images/v-day.webp', ratio: 0.75 }
  ];

  var DESKTOP_COUNT = 7;
  var MOBILE_COUNT = 4;
  var MOBILE_BREAKPOINT = 640;

  // Poster size range (px, referring to the image width inside the frame).
  var MIN_WIDTH = 140;
  var MAX_WIDTH = 220;
  var MIN_WIDTH_MOBILE = 110;
  var MAX_WIDTH_MOBILE = 160;

  // Frame padding matches CSS: 6px sides, 22px bottom.
  var FRAME_PAD_X = 12;
  var FRAME_PAD_Y = 28;

  // Rotation range in degrees.
  var MAX_ROTATE = 12;

  // Max overlap between posters, as a fraction of the smaller poster's area.
  var MAX_OVERLAP = 0.35;

  // Padding around the central broadcast window (px) to keep the collage
  // out of the focal area.
  var CENTER_MARGIN = 48;

  // Maximum placement attempts per poster before we give up and drop it.
  var MAX_ATTEMPTS = 30;

  function randRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  function shuffled(list) {
    var arr = list.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function rectsOverlapArea(a, b) {
    var x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
    var y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    return x * y;
  }

  function intersects(a, b) {
    return rectsOverlapArea(a, b) > 0;
  }

  // Approximate the broadcast window bounding rect. We read it from the DOM
  // when available so the exclusion zone tracks the real layout; fall back
  // to a centered rect based on the CSS --window-max-w variable.
  function getCenterRect(vw, vh) {
    var el = document.querySelector('.broadcast-window');
    if (el) {
      var r = el.getBoundingClientRect();
      return {
        x: r.left - CENTER_MARGIN,
        y: r.top - CENTER_MARGIN,
        w: r.width + CENTER_MARGIN * 2,
        h: r.height + CENTER_MARGIN * 2
      };
    }
    var w = Math.min(860, vw * 0.9);
    var h = Math.min(600, vh * 0.7);
    return {
      x: (vw - w) / 2 - CENTER_MARGIN,
      y: (vh - h) / 2 - CENTER_MARGIN,
      w: w + CENTER_MARGIN * 2,
      h: h + CENTER_MARGIN * 2
    };
  }

  function placePoster(rect, centerRect, placed) {
    for (var attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      rect.x = randRange(0, Math.max(0, rect.vw - rect.w));
      rect.y = randRange(0, Math.max(0, rect.vh - rect.h));

      if (intersects(rect, centerRect)) continue;

      var tooMuchOverlap = false;
      for (var i = 0; i < placed.length; i++) {
        var other = placed[i];
        var overlap = rectsOverlapArea(rect, other);
        var smaller = Math.min(rect.w * rect.h, other.w * other.h);
        if (smaller > 0 && overlap / smaller > MAX_OVERLAP) {
          tooMuchOverlap = true;
          break;
        }
      }
      if (tooMuchOverlap) continue;

      return true;
    }
    return false;
  }

  function buildPoster(photo, rect, rotate) {
    var poster = document.createElement('div');
    poster.className = 'poster';
    poster.style.left = rect.x + 'px';
    poster.style.top = rect.y + 'px';
    poster.style.width = rect.w + 'px';
    poster.style.transform = 'rotate(' + rotate.toFixed(2) + 'deg)';

    var img = document.createElement('img');
    img.src = photo.src;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    // Set intrinsic size hints to reserve space before the image decodes.
    var imgW = rect.w - FRAME_PAD_X;
    var imgH = imgW / photo.ratio;
    img.width = imgW;
    img.height = imgH;

    poster.appendChild(img);
    return poster;
  }

  function render() {
    var container = document.getElementById('photo-collage');
    if (!container) return;

    // Clear previous posters (in case of re-render on resize).
    container.innerHTML = '';

    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var isMobile = vw <= MOBILE_BREAKPOINT;

    var count = isMobile ? MOBILE_COUNT : DESKTOP_COUNT;
    var minW = isMobile ? MIN_WIDTH_MOBILE : MIN_WIDTH;
    var maxW = isMobile ? MAX_WIDTH_MOBILE : MAX_WIDTH;

    var picks = shuffled(PHOTOS).slice(0, count);
    var centerRect = getCenterRect(vw, vh);
    var placed = [];

    for (var i = 0; i < picks.length; i++) {
      var photo = picks[i];
      var imgW = randRange(minW, maxW);
      var imgH = imgW / photo.ratio;
      var frameW = imgW + FRAME_PAD_X;
      var frameH = imgH + FRAME_PAD_Y;

      var rect = { x: 0, y: 0, w: frameW, h: frameH, vw: vw, vh: vh };
      if (!placePoster(rect, centerRect, placed)) continue;
      placed.push(rect);

      var rotate = randRange(-MAX_ROTATE, MAX_ROTATE);
      container.appendChild(buildPoster(photo, rect, rotate));
    }
  }

  function onReady() {
    render();

    // Re-layout on significant resize (debounced) so the exclusion zone
    // continues to match the broadcast window.
    var resizeTimer = null;
    var lastW = window.innerWidth;
    window.addEventListener('resize', function () {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var crossedBreakpoint =
          (lastW <= MOBILE_BREAKPOINT) !== (window.innerWidth <= MOBILE_BREAKPOINT);
        var bigDelta = Math.abs(window.innerWidth - lastW) > 200;
        if (crossedBreakpoint || bigDelta) {
          lastW = window.innerWidth;
          render();
        }
      }, 250);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
