(function () {
  'use strict';

  function backgroundUrl(card) {
    var value = getComputedStyle(card).backgroundImage;
    var match = value && value.match(/^url\(["']?(.*?)["']?\)$/);
    return match ? match[1] : '';
  }

  function openPreview(card) {
    var source = card.getAttribute('data-preview-image') || backgroundUrl(card);
    if (!source) return;
    card.setAttribute('data-preview-image', source);

    var dialog = document.querySelector('.portfolio-preview-dialog');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.className = 'portfolio-preview-dialog';
      dialog.setAttribute('aria-label', 'Full screen portfolio preview');
      dialog.innerHTML = '<button class="portfolio-preview-dialog__close" type="button" aria-label="Close full screen preview">&times;</button><img class="portfolio-preview-dialog__image" alt="Full screen portfolio preview">';
      document.body.appendChild(dialog);
      dialog.querySelector('.portfolio-preview-dialog__close').addEventListener('click', function () { dialog.close(); });
      dialog.addEventListener('click', function (event) {
        if (event.target === dialog) dialog.close();
      });
    }
    dialog.querySelector('.portfolio-preview-dialog__image').src = source;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else window.open(source, '_blank', 'noopener');
  }

  function init() {
    // Touching the image alternates its preview between the top and bottom.
    // Keep the caption as a separate full-view action, and allow page swipes.
    document.querySelectorAll('.bde-scrolling-image, .lumina-portfolio-preview').forEach(function (card) {
      var start = null;
      var touchClick = false;
      var caption = card.querySelector('.ee-scrollimage-caption, .lumina-portfolio-caption');
      if (caption) {
        caption.setAttribute('role', 'button');
        caption.setAttribute('tabindex', '0');
        caption.setAttribute('aria-label', 'View full design');
        caption.addEventListener('keydown', function (event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            caption.click();
          }
        });
      }
      function updateLabel() {
        if (!caption) return;
        if (window.matchMedia('(hover: none), (pointer: coarse)').matches) {
          caption.textContent = 'Touch image to scroll ↕ · View full design ↗';
        }
      }
      updateLabel();
      card.addEventListener('pointerdown', function (event) {
        touchClick = event.pointerType !== 'mouse';
        start = touchClick ? { x: event.clientX, y: event.clientY, caption: caption && caption.contains(event.target) } : null;
      }, { passive: true });
      card.addEventListener('pointerup', function (event) {
        if (!start) return;
        if (!start.caption && Math.hypot(event.clientX - start.x, event.clientY - start.y) < 12) {
          card.classList.toggle('is-touch-bottom');
        }
        start = null;
      }, { passive: true });
      card.addEventListener('pointercancel', function () { start = null; });
      card.addEventListener('click', function (event) {
        if (touchClick && !(caption && caption.contains(event.target))) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
        touchClick = false;
      });
    });
    document.querySelectorAll('.bde-scrolling-image').forEach(function (card) {
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', 'View portfolio preview full screen');
      card.addEventListener('click', function () { openPreview(card); });
      card.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openPreview(card);
        }
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
