(function () {
  'use strict';
  var config = JSON.parse(document.getElementById('widget-config').textContent);
  document.documentElement.style.setProperty('--accent', config.color);
  var rgb = [1, 3, 5].map(function (offset) { var channel = parseInt(config.color.slice(offset, offset + 2), 16) / 255; return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4); });
  document.documentElement.style.setProperty('--on-accent', rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722 > 0.179 ? '#000000' : '#ffffff');
  var conversation = document.getElementById('conversation'), identity = document.getElementById('identity');
  var input = document.getElementById('message'), sendButton = document.getElementById('send');
  var status = document.getElementById('status'), review = document.getElementById('review');
  var suggestions = Array.from(document.querySelectorAll('#suggestions button'));
  var token = null, customerId, messages = [], busy = false, connecting = true, initialized = false, generation = 0, authGeneration = 0, timer, abort, currentTicket;
  function notify(type) { window.parent.postMessage({ type: type }, config.origin); }
  function controls() { input.disabled = !token || busy || connecting; sendButton.disabled = !token || busy || connecting || !input.value.trim(); suggestions.forEach(function (button) { button.disabled = !token || busy || connecting; }); }
  function setStatus(message, error) { status.textContent = message; status.className = error ? 'error' : ''; }
  async function api(path, options) {
    var response = await fetch(path, Object.assign({ cache: 'no-store', credentials: 'omit' }, options));
    var data = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(data.error || 'The assistant is temporarily unavailable. Please try again.');
    return data;
  }
  function reset() { if (abort) abort.abort(); clearInterval(timer); currentTicket = null; review.hidden = true; messages = []; conversation.querySelectorAll('.message').forEach(function (el) { el.remove(); }); }
  async function initialize(incoming, identityError) {
    var current = ++authGeneration;
    connecting = true; controls(); if (!busy) setStatus('Connecting…');
    try {
      var data;
      if (incoming) data = await api('/api/widget/session', { headers: { Authorization: 'Bearer ' + incoming } });
      else data = await api('/api/widget/bootstrap', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company: config.company, origin: config.origin }) });
      if (current !== authGeneration) return;
      if (incoming && (data.company !== config.company || data.origin !== config.origin)) throw new Error('This chat session belongs to another website.');
      var nextCustomer = data.customer ? data.customer.id : null;
      if (!initialized || customerId !== nextCustomer) { ++generation; reset(); busy = false; }
      customerId = nextCustomer;
      token = incoming || data.token;
      initialized = true;
      identity.textContent = data.customer ? 'Helping ' + data.customer.name : 'Here to help · Sign in for personal orders';
      if (!busy) setStatus(identityError ? identityError + ' You can still ask about policies.' : '', !!identityError);
    } catch (error) { if (current === authGeneration) { ++generation; reset(); token = null; busy = false; identity.textContent = 'Unable to connect'; setStatus(error.message, true); } }
    finally { if (current === authGeneration) { connecting = false; controls(); if (token && !busy) input.focus(); } }
  }
  function addMessage(role, content, result) {
    var box = document.createElement('div'); box.className = 'message ' + role; box.textContent = content;
    if (result && result.actions && result.actions.length) {
      var tags = document.createElement('div'); tags.className = 'tags'; tags.textContent = result.actions.map(function (action) { return action === 'queryDatabase' ? 'Order database checked' : action === 'sendEmail' ? 'Email workflow' : action === 'guardrailBlocked' ? 'Blocked by safety check' : 'Manager review requested'; }).join(' · '); box.append(tags);
    }
    if (result && result.sources && result.sources.length) { var source = document.createElement('small'); source.textContent = 'Source: ' + result.sources.join(', '); box.append(source); }
    conversation.append(box); conversation.scrollTop = conversation.scrollHeight;
  }
  async function pollReview() {
    if (!token || !currentTicket) return;
    var ticket = currentTicket, current = generation;
    try {
      var data = await api('/api/widget/escalation?id=' + encodeURIComponent(ticket), { headers: { Authorization: 'Bearer ' + token } });
      if (current !== generation || ticket !== currentTicket) return;
      review.hidden = false; review.textContent = 'Manager review: ' + data.status + (data.adminNote ? ' — ' + data.adminNote : '') + (data.status !== 'pending' ? ' · No payment was executed in this demo.' : '');
      if (data.status !== 'pending') clearInterval(timer);
    } catch { /* retry on the next poll */ }
  }
  async function send(text) {
    if (!token || busy || connecting || !text.trim()) return;
    busy = true; input.value = ''; controls(); setStatus('Checking that for you…'); addMessage('user', text);
    var current = generation; abort = new AbortController();
    try {
      var result = await api('/api/widget/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ message: text, history: messages.slice(-8), requestId: crypto.randomUUID() }), signal: abort.signal });
      if (current !== generation) return;
      if (!result.reply) throw new Error('The assistant returned an empty response.');
      messages.push({ role: 'user', content: text }, { role: 'assistant', content: result.reply }); addMessage('assistant', result.reply, result); setStatus('');
      if (result.escalationId) { currentTicket = result.escalationId; clearInterval(timer); void pollReview(); timer = setInterval(pollReview, 5000); }
    } catch (error) { if (current === generation && error.name !== 'AbortError') { addMessage('assistant', error.message); setStatus('Please try again, or close and reopen the assistant.', true); } }
    finally { if (current === generation) { busy = false; controls(); input.focus(); } }
  }
  window.addEventListener('message', function (event) {
    if (event.origin !== config.origin || event.source !== window.parent || !event.data) return;
    if (event.data.type === 'agentforge:init') void initialize(event.data.token, event.data.identityError);
    if (event.data.type === 'agentforge:focus' && token) input.focus();
  });
  document.getElementById('close').onclick = function () { notify('agentforge:close'); };
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') notify('agentforge:close'); });
  input.addEventListener('input', controls);
  document.getElementById('compose').onsubmit = function (event) { event.preventDefault(); void send(input.value); };
  suggestions.forEach(function (button) { button.onclick = function () { void send(button.textContent); }; });
  window.addEventListener('pagehide', function () { if (abort) abort.abort(); clearInterval(timer); });
  notify('agentforge:ready');
}());
