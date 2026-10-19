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
