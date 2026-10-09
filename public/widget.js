(function () {
  'use strict';
  var script = document.currentScript;
  if (!script || !script.dataset.company) return;
  var company = script.dataset.company;
  var service = new URL(script.src).origin;
  var tokenUrl = script.dataset.tokenUrl;
  var previous = window.AgentForgeWidget;
  if (previous && previous.company === company) return;
  if (previous) previous.destroy();
  var cancelled = false, expanded = false, frameReady = false, frame, config, refreshId = 0, connectTimer;
  var abort = new AbortController();
  var host = document.createElement('div');
  host.id = 'agentforge-widget';
  host.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:2147483000;';
  var shadow = host.attachShadow({ mode: 'open' });
  var style = document.createElement('style');
  style.textContent = ':host{font-family:Arial,sans-serif;color:#1c2c44}*{box-sizing:border-box}.bubble{width:62px;height:62px;border-radius:50%;border:3px solid white;background:var(--accent,#3159cc);color:var(--on-accent,#fff);box-shadow:0 8px 28px #16254445;cursor:pointer;display:grid;place-items:center;font-size:27px}.bubble:focus-visible{outline:3px solid #f4b942;outline-offset:3px}.panel{position:absolute;bottom:76px;right:0;width:390px;height:min(620px,calc(100dvh - 116px));max-width:calc(100vw - 52px);background:white;border-radius:18px;box-shadow:0 16px 60px #12254238;overflow:hidden;border:1px solid #e2e7f0}.panel[hidden]{display:none}.panel iframe{height:100%;width:100%;border:0;display:block}.notice{padding:24px;font-size:14px;line-height:1.6}.notice button{background:var(--accent,#3159cc);color:var(--on-accent,#fff);border:0;border-radius:8px;padding:10px 16px;cursor:pointer}@media(max-width:480px){.panel{width:calc(100vw - 52px);height:min(650px,calc(100dvh - 108px))}.bubble{width:58px;height:58px}}';
  var launcher = document.createElement('button');
  launcher.type = 'button'; launcher.className = 'bubble'; launcher.textContent = '…';
  launcher.setAttribute('aria-label', 'Open company assistant'); launcher.setAttribute('aria-expanded', 'false');
  launcher.setAttribute('aria-controls', 'agentforge-panel');
  var panel = document.createElement('div'); panel.className = 'panel'; panel.id = 'agentforge-panel'; panel.hidden = true;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Company assistant');
  shadow.append(style, panel, launcher);
  document.body.append(host);
  var initialNotice = document.createElement('div'); initialNotice.className = 'notice'; initialNotice.textContent = 'Opening your assistant…'; panel.append(initialNotice);
  function send(message) { if (frame && frame.contentWindow) frame.contentWindow.postMessage(message, service); }
  function notice(message, retry) {
    clearTimeout(connectTimer);
    panel.replaceChildren(); frame = null; frameReady = false;
    var box = document.createElement('div'); box.className = 'notice'; box.setAttribute('role', 'status'); box.textContent = message;
    if (retry) { var button = document.createElement('button'); button.textContent = 'Try again'; button.onclick = function () { void load(); }; box.append(document.createElement('br'), button); }
    panel.append(box);
  }
  async function load() {
    try {
      var url = new URL('/api/widget/config', service); url.searchParams.set('company', company); url.searchParams.set('origin', location.origin);
      var response = await fetch(url, { credentials: 'omit', signal: abort.signal });
      var data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Assistant is unavailable.');
      if (cancelled) return;
      config = data; host.style.setProperty('--accent', config.color);
      var rgb = [1, 3, 5].map(function (offset) { var channel = parseInt(config.color.slice(offset, offset + 2), 16) / 255; return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4); });
      host.style.setProperty('--on-accent', rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722 > 0.179 ? '#000000' : '#ffffff');
      launcher.textContent = expanded ? '×' : config.name.charAt(0);
      launcher.setAttribute('aria-label', (expanded ? 'Close ' : 'Open ') + config.name);
      panel.setAttribute('aria-label', config.name);
      if (expanded) createFrame();
    } catch (error) {
      if (cancelled) return;
      config = null; notice(error instanceof TypeError ? 'Unable to connect. The website owner should check the assistant’s allowed website settings.' : error instanceof Error ? error.message : 'Assistant is unavailable.', true);
    }
  }
  function createFrame() {
    clearTimeout(connectTimer);
    frameReady = false;
    frame = document.createElement('iframe'); frame.title = config.name;
    var url = new URL('/widget/frame', service); url.searchParams.set('company', company); url.searchParams.set('origin', location.origin);
    frame.src = url.href; frame.referrerPolicy = 'no-referrer';
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    panel.replaceChildren(frame);
    connectTimer = setTimeout(function () { if (!cancelled && !frameReady) notice('The chat panel could not open. Please check the website’s connection and embedding settings.', true); }, 15000);
  }
  async function refreshIdentity() {
    var current = ++refreshId;
    var token = null, identityError = '';
    try {
      if (tokenUrl) {
        var url = new URL(tokenUrl, location.href);
        if (url.origin !== location.origin) throw new Error('Customer token endpoint must belong to this website.');
        var response = await fetch(url, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company: company, origin: location.origin }), signal: abort.signal });
        var data = await response.json().catch(function () { return {}; });
        if (response.status !== 401 && !response.ok) throw new Error(data.error || 'Unable to verify your customer account.');
        if (response.ok) { if (typeof data.token !== 'string') throw new Error('Customer token endpoint returned no token.'); token = data.token; }
      }
    } catch (error) { if (cancelled) return; identityError = error instanceof Error ? error.message : 'Unable to verify your account.'; }
    if (!cancelled && frameReady && current === refreshId) send({ type: 'agentforge:init', token: token, identityError: identityError });
  }
  function open() {
    expanded = true; panel.hidden = false; launcher.textContent = '×'; launcher.setAttribute('aria-expanded', 'true');
    launcher.setAttribute('aria-label', 'Close ' + (config ? config.name : 'company assistant'));
    if (config && !frame) createFrame();
    else if (frameReady) { void refreshIdentity(); send({ type: 'agentforge:focus' }); }
  }
  function close() { expanded = false; panel.hidden = true; launcher.textContent = config ? config.name.charAt(0) : '…'; launcher.setAttribute('aria-expanded', 'false'); launcher.setAttribute('aria-label', 'Open ' + (config ? config.name : 'company assistant')); launcher.focus(); }
  function receive(event) {
    if (event.origin !== service || !frame || event.source !== frame.contentWindow) return;
    if (event.data && event.data.type === 'agentforge:ready') { clearTimeout(connectTimer); frameReady = true; void refreshIdentity(); }
    if (event.data && event.data.type === 'agentforge:close') close();
  }
  function keyboard(event) { if (event.key === 'Escape' && expanded) close(); }
  launcher.onclick = function () { if (expanded) close(); else open(); };
  window.addEventListener('message', receive); window.addEventListener('keydown', keyboard);
  window.AgentForgeWidget = { company: company, open: open, close: close, refreshIdentity: refreshIdentity, destroy: function () {
    cancelled = true; ++refreshId; clearTimeout(connectTimer); abort.abort(); host.remove(); window.removeEventListener('message', receive); window.removeEventListener('keydown', keyboard);
    if (window.AgentForgeWidget && window.AgentForgeWidget.company === company) delete window.AgentForgeWidget;
  } };
  void load();
}());
