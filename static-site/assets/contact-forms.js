(function (root) {
  'use strict';

  // A successful HTTP response alone does not mean FormSubmit accepted a message.
  async function sendMessage(endpoint, payload, options) {
    options = options || {};
    var controller = new AbortController();
    var timer;
    var timeout = new Promise(function (_, reject) {
      timer = setTimeout(function () {
        controller.abort();
        reject(new Error('Delivery could not be confirmed.'));
      }, options.timeout || 20000);
    });
    try {
      return await Promise.race([timeout, (async function () {
        var response = await (options.fetch || root.fetch.bind(root))(endpoint, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          // A simple form request avoids an unnecessary cross-origin preflight.
          body: new URLSearchParams(payload),
          signal: controller.signal
        });
        if (!response.ok) throw new Error('Message was not accepted.');
        var data = await response.json();
        if (!data || (data.success !== true && data.success !== 'true')) {
          throw new Error('Message was not accepted.');
        }
        return data;
      })()]);
    } finally {
      clearTimeout(timer);
    }
  }

  function bindForm(form) {
    var status = form.querySelector('[role="status"]');
    var submit = form.querySelector('[type="submit"]');
    var emailLink = form.querySelector('[data-contact-email]');
    var busy = false;
    var originalLabel = submit.textContent;
    function value(name) {
      var field = form.querySelector('[name="' + name + '"]');
      return field ? field.value.trim() : '';
    }
    function updateEmailLink() {
      var subject = value('subject') || 'Website inquiry';
      var body = 'Name: ' + value('name') + '\nEmail: ' + value('email') +
        '\nService: ' + value('service') + '\n\n' + value('message');
      emailLink.href = 'mailto:jiggsalazar89@gmail.com?subject=' +
        encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    }
    function setStatus(text, success) {
      status.textContent = text;
      status.classList.toggle('is-success', success === true);
      status.classList.toggle('is-error', success === false);
    }
    form.addEventListener('input', function (event) {
      updateEmailLink();
      if (event.target) event.target.removeAttribute('aria-invalid');
    });
    form.addEventListener('change', updateEmailLink);
    updateEmailLink();

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (busy) return;
      var invalid = null;
      ['name', 'email', 'message'].forEach(function (name) {
        var field = form.querySelector('[name="' + name + '"]');
        var valid = !!field.value.trim() && field.checkValidity();
        if (!valid) {
          field.setAttribute('aria-invalid', 'true');
          invalid = invalid || field;
        } else {
          field.removeAttribute('aria-invalid');
        }
      });
      if (invalid) {
        setStatus('Please complete your name, a valid email, and your message.', false);
        invalid.focus();
        return;
      }
      // Silently ignore bot submissions without sending spam or clearing a real draft.
      if (value('_honey')) return;
      var payload = {
        name: value('name'), email: value('email'), service: value('service'),
        subject: value('subject'), message: value('message'),
        _subject: value('subject') || 'New website inquiry from ' + value('name'),
        _replyto: value('email'), _template: 'table', _captcha: 'false',
        _url: root.location.href
      };
      busy = true;
      submit.disabled = true;
      submit.textContent = 'Sending...';
      form.setAttribute('aria-busy', 'true');
      setStatus('Sending your message...', null);
      try {
        await sendMessage(form.getAttribute('data-submit-url'), payload);
        setStatus('Message submitted successfully. Thank you! Jigg will reply to your email.', true);
        // Keep any changes the visitor made while this request was in flight.
        if (['name', 'email', 'service', 'subject', 'message'].every(function (key) {
          return value(key) === payload[key];
        })) form.reset();
        updateEmailLink();
      } catch (_) {
        setStatus('We could not confirm your submission. Your message is still here. Try again, or use Email Jigg / Messenger below. Please avoid resending if you already received a reply.', false);
      } finally {
        busy = false;
        submit.disabled = false;
        submit.textContent = originalLabel;
        form.removeAttribute('aria-busy');
      }
    });
    // Preserve native HTML validation and submission when JavaScript is unavailable.
    form.noValidate = true;
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = { sendMessage: sendMessage, bindForm: bindForm };
  } else {
    function ready() {
      root.document.querySelectorAll('[data-contact-form]').forEach(bindForm);
    }
    if (root.document.readyState === 'loading') {
      root.document.addEventListener('DOMContentLoaded', ready);
    } else ready();
  }
})(typeof window === 'undefined' ? globalThis : window);
