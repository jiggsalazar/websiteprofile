const { test } = require('node:test');
const assert = require('node:assert/strict');
const { sendMessage, bindForm } = require('../static-site/assets/contact-forms.js');

const reply = (data, ok = true) => ({ ok, json: async () => data });

test('accepts only an explicit provider success, not just HTTP 200', async () => {
  for (const success of [true, 'true']) {
    await sendMessage('/test', { message: 'Hello & welcome' }, {
      fetch: async (_, init) => {
        assert.equal(init.body.get('message'), 'Hello & welcome');
        return reply({ success });
      }
    });
  }
  for (const data of [{ success: false }, { success: 'false' }, {}, null]) {
    await assert.rejects(sendMessage('/test', {}, { fetch: async () => reply(data) }));
  }
  await assert.rejects(sendMessage('/test', {}, { fetch: async () => reply({}, false) }));
  await assert.rejects(sendMessage('/test', {}, { fetch: async () => { throw Error('Network offline'); } }));
  await assert.rejects(sendMessage('/test', {}, { fetch: async () => ({ ok: true, json: async () => { throw Error('HTML, not JSON'); } }) }));
});

test('bounds the waiting time and aborts a hung request', async () => {
  let signal;
  await assert.rejects(sendMessage('/test', {}, {
    timeout: 10, fetch: (_, init) => { signal = init.signal; return new Promise(() => {}); }
  }));
  assert.equal(signal.aborted, true);
});

function fixture() {
  const fields = Object.fromEntries(Object.entries({ name: 'Visitor', email: 'visitor@example.com',
    service: 'Web development', subject: 'Project & quote', message: 'Hello, Jigg!', _honey: '' })
    .map(([name, value]) => [name, { value, checkValidity: () => name !== 'email' || fields.email.value.includes('@'),
      setAttribute() {}, removeAttribute() {}, focus() { this.focused = true; } }]));
  const classes = new Set();
  const status = { textContent: '', classList: { toggle: (name, active) => active ? classes.add(name) : classes.delete(name) } };
  const submit = { textContent: 'Submit', disabled: false };
  const link = {};
  const handlers = {};
  const form = {
    resetCount: 0,
    querySelector(selector) {
      if (selector === '[role="status"]') return status;
      if (selector === '[type="submit"]') return submit;
      if (selector === '[data-contact-email]') return link;
      return fields[selector.match(/name="(.+)"/)[1]];
    },
    addEventListener: (name, fn) => { handlers[name] = fn; },
    getAttribute: () => 'https://formsubmit.co/ajax/jiggsalazar89@gmail.com',
    setAttribute() {}, removeAttribute() {},
    reset() { this.resetCount++; Object.values(fields).forEach(field => { field.value = ''; }); }
  };
  bindForm(form);
  return { fields, form, status, submit, link, classes, handlers, send: () => handlers.submit({ preventDefault() {} }) };
}

test('forms preserve failed drafts, unlock submit and provide an encoded email fallback', async () => {
  globalThis.location = { href: 'https://madebyjigg.com/contact/' };
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => reply({ success: 'false' });
  try {
    const f = fixture();
    await f.send();
    assert.equal(f.form.resetCount, 0);
    assert.equal(f.fields.message.value, 'Hello, Jigg!');
    assert.equal(f.submit.disabled, false);
    assert.ok(f.classes.has('is-error'));
    assert.ok(f.link.href.includes('Project%20%26%20quote'));
    assert.ok(decodeURIComponent(f.link.href).includes('Hello, Jigg!'));
  } finally { globalThis.fetch = previousFetch; }
});

test('blocks invalid fields and duplicate submissions; preserves edits made while sending', async () => {
  const previousFetch = globalThis.fetch;
  let resolve, calls = 0;
  globalThis.fetch = () => { calls++; return new Promise(done => { resolve = done; }); };
  try {
    const f = fixture();
    f.fields.email.value = 'invalid';
    await f.send();
    assert.equal(calls, 0);
    assert.equal(f.fields.email.focused, true);
    f.fields.email.value = 'visitor@example.com';
    const sending = f.send();
    await f.send();
    assert.equal(calls, 1);
    assert.equal(f.submit.disabled, true);
    f.fields.message.value = 'A newly edited message';
    resolve(reply({ success: 'true' }));
    await sending;
    assert.equal(f.form.resetCount, 0);
    assert.equal(f.fields.message.value, 'A newly edited message');
    assert.equal(f.submit.disabled, false);
    assert.ok(f.classes.has('is-success'));
  } finally { globalThis.fetch = previousFetch; }
});

test('resets an unchanged draft only after confirmed acceptance', async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => reply({ success: true });
  try {
    const f = fixture();
    await f.send();
    assert.equal(f.form.resetCount, 1);
    assert.equal(f.submit.disabled, false);
    assert.ok(f.classes.has('is-success'));
  } finally { globalThis.fetch = previousFetch; }
});
