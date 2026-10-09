"use client";
/* eslint-disable */
// @ts-nocheck
export default function AgentForgeDocsandSDKReference() {
  return (
    <>
      <main className="w-full pt-16 bg-surface"><div className="flex flex-col w-full">
<div className="max-w-7xl mx-auto w-full px-margin-sm md:px-margin py-8">
<div className="flex flex-col lg:flex-row gap-10 items-start relative">

<aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-24 flex flex-col gap-6 select-none">

<div className="relative w-full">
<div className="flex items-center justify-between w-full h-9 px-3 bg-surface-container-lowest rounded-lg shadow-sm">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-outline text-[17px]">search</span>
<span className="font-body-sm text-body-sm text-on-surface-variant/80">Search docs...</span>
</div>
<kbd className="font-code-base text-[11px] bg-surface-container px-1.5 py-0.5 rounded text-on-surface-variant font-medium">⌘K</kbd>
</div>
</div>

<nav className="flex flex-col gap-6">

<div className="flex flex-col gap-1.5">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider font-semibold px-2 mb-1">Getting Started</span>
<a className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-surface-container-low text-primary font-label-ui text-label-ui font-semibold transition-colors" href="#quickstart">
<span>Quickstart</span>
<span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
</a>
<a className="py-1.5 px-3 text-on-surface-variant hover:text-on-surface font-body-sm text-body-sm transition-colors" href="#auth">Multi-Tenant Auth</a>
<a className="py-1.5 px-3 text-on-surface-variant hover:text-on-surface font-body-sm text-body-sm transition-colors" href="#setup">Installation &amp; Setup</a>
</div>

<div className="flex flex-col gap-1.5">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider font-semibold px-2 mb-1">Core Endpoints</span>
<a className="py-1.5 px-3 flex items-center gap-2 text-on-surface-variant hover:text-on-surface font-code-base text-[12px] transition-colors" href="#endpoint-invoke">
<span className="text-[10px] font-bold px-1 rounded bg-primary text-on-primary">POST</span>
<span>/api/v1/chat</span>
</a>
<a className="py-1.5 px-3 flex items-center gap-2 text-on-surface-variant hover:text-on-surface font-code-base text-[12px] transition-colors" href="#endpoint-inspect">
<span className="text-[10px] font-bold px-1 rounded bg-secondary text-on-secondary">POST</span>
<span>/v2/guardrails/inspect</span>
</a>
<a className="py-1.5 px-3 flex items-center gap-2 text-on-surface-variant hover:text-on-surface font-code-base text-[12px] transition-colors" href="#endpoint-traces">
<span className="text-[10px] font-bold px-1 rounded bg-tertiary-container text-on-tertiary-container">GET</span>
<span>/v2/audit/traces</span>
</a>
</div>

<div className="flex flex-col gap-1.5">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider font-semibold px-2 mb-1">Infrastructure</span>
<a className="py-1.5 px-3 text-on-surface-variant hover:text-on-surface font-body-sm text-body-sm transition-colors" href="#terraform">GCP Terraform Module</a>
<a className="py-1.5 px-3 text-on-surface-variant hover:text-on-surface font-body-sm text-body-sm transition-colors" href="#webhooks">Escalation Webhooks</a>
<a className="py-1.5 px-3 text-on-surface-variant hover:text-on-surface font-body-sm text-body-sm transition-colors" href="#guardrails">Custom Guardrails</a>
</div>
</nav>

<div className="mt-4 p-3 rounded-xl bg-surface-container-low flex flex-col gap-2">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="relative flex h-2 w-2">
<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
<span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary"></span>
</span>
<span className="font-code-base text-[11px] font-medium text-on-surface">us-central1</span>
</div>
<span className="font-label-caps text-[10px] text-tertiary font-semibold px-1.5 py-0.5 rounded bg-surface-container-lowest">99.99%</span>
</div>
<span className="font-body-sm text-[11px] text-on-surface-variant">Cloud Run cold-starts &lt; 24ms</span>
</div>
</aside>

<div className="flex-1 max-w-4xl min-w-0 flex flex-col gap-10">

<section className="flex flex-col gap-4">
<div className="flex items-center gap-2">
<span className="font-label-caps text-label-caps uppercase text-primary font-semibold tracking-wider">REST &amp; gRPC Specification</span>
<span className="text-outline-variant font-code-base text-xs">/</span>
<span className="font-code-base text-xs text-on-surface-variant font-medium">v2.4-stable</span>
</div>
<h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">Developer Platform &amp; API Reference</h1>
<p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
            Construct autonomous agent swarms with deterministic sandboxed tools, multi-tenant RBAC, and real-time streaming telemetry.
          </p>

<div className="flex flex-wrap gap-2.5 pt-2">
<div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-lowest shadow-sm font-label-ui text-label-ui text-on-surface">
<span className="material-symbols-outlined text-primary text-[16px]">bolt</span>
<span>&lt; 320ms P95 TTFT</span>
</div>
<div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-lowest shadow-sm font-label-ui text-label-ui text-on-surface">
<span className="material-symbols-outlined text-secondary text-[16px]">shield_lock</span>
<span>3-Tier Guardrails (PII, Injection, Schema)</span>
</div>
<div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-lowest shadow-sm font-label-ui text-label-ui text-on-surface">
<span className="material-symbols-outlined text-tertiary text-[16px]">monitoring</span>
<span>W3C Otel Traces (BigQuery Native)</span>
</div>
</div>
</section>
<div className="w-full h-px bg-surface-container-highest"></div>

<section className="flex flex-col gap-5" id="quickstart">
<div className="flex items-center justify-between">
<div className="flex items-center gap-3">
<h2 className="font-headline-md text-headline-md text-on-surface font-semibold">Quickstart Installation</h2>
<span className="px-2.5 py-0.5 rounded-full bg-surface-container-high font-label-caps text-label-caps text-on-primary-fixed-variant font-medium">2 min setup</span>
</div>
</div>
<p className="font-body-md text-body-md text-on-surface-variant">
            Install the native runtime client to establish streaming WebSockets and gRPC channels with the agent fabric.
          </p>

<div className="rounded-xl overflow-hidden shadow-sm bg-inverse-surface text-inverse-on-surface">
<div className="flex items-center justify-between px-4 py-2.5 bg-[#1b2234]">
<div className="flex items-center gap-4 font-label-ui text-xs">
<button className="text-on-primary font-semibold flex items-center gap-1.5" id="pkg-tab-pip" onClick={() => {}}>
<span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>pip
                </button>
<button className="text-on-surface-variant hover:text-inverse-on-surface transition-colors flex items-center gap-1.5" id="pkg-tab-npm" onClick={() => {}}>npm</button>
<button className="text-on-surface-variant hover:text-inverse-on-surface transition-colors flex items-center gap-1.5" id="pkg-tab-cargo" onClick={() => {}}>cargo</button>
</div>
<button className="text-on-surface-variant hover:text-inverse-on-surface transition-colors flex items-center gap-1 text-xs" onClick={() => {}}>
<span className="material-symbols-outlined text-[15px]" id="copy-icon">content_copy</span>
<span id="copy-label">Copy</span>
</button>
</div>
<div className="p-4 font-code-base text-code-base flex items-center justify-between">
<code className="text-on-primary-container font-medium" id="pkg-command">pip install agentforge-sdk</code>
</div>
</div>
</section>

<section className="flex flex-col gap-4">
<div className="flex items-center justify-between">
<h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Client Implementation</h2>
<div className="flex items-center gap-1 bg-surface-container p-1 rounded-lg">
<button className="px-3 py-1 rounded font-label-ui text-xs font-semibold bg-surface-container-lowest text-primary shadow-sm transition-all" id="tab-py" onClick={() => {}}>Python</button>
<button className="px-3 py-1 rounded font-label-ui text-xs text-on-surface-variant hover:text-on-surface transition-all" id="tab-ts" onClick={() => {}}>TypeScript</button>
<button className="px-3 py-1 rounded font-label-ui text-xs text-on-surface-variant hover:text-on-surface transition-all" id="tab-curl" onClick={() => {}}>cURL</button>
</div>
</div>

<div className="rounded-xl overflow-hidden shadow-md bg-[#0F172A] text-slate-200">
<div className="flex items-center justify-between px-4 py-2.5 bg-[#172033] font-code-base text-xs">
<div className="flex items-center gap-2">
<span className="w-2.5 h-2.5 rounded-full bg-error/60"></span>
<span className="w-2.5 h-2.5 rounded-full bg-secondary/60"></span>
<span className="w-2.5 h-2.5 rounded-full bg-tertiary-container/60"></span>
<span className="ml-2 text-slate-400 font-medium" id="code-filename">agent_orchestrator.py</span>
</div>
<span className="text-slate-400">UTF-8</span>
</div>

<pre className="p-5 font-code-base text-sm leading-relaxed overflow-x-auto text-slate-200" id="code-py"><code><span className="text-purple-400">import</span> agentforge
<span className="text-purple-400">import</span> os

client = agentforge.AgentForgeClient(
    api_key=os.getenv(<span className="text-emerald-400">"FORGE_SECRET_KEY"</span>),
    tenant_id=<span className="text-emerald-400">"tnt-fintech-boc-09"</span>,
    region=<span className="text-emerald-400">"us-central1"</span>
)

stream = client.agents.stream(
    agent_id=<span className="text-emerald-400">"ag-boc-treasury-reconciler"</span>,
    prompt=<span className="text-emerald-400">"Audit ledger discrepancies for batch #8492"</span>,
    strict_guardrails=<span className="text-amber-400">True</span>
)

<span className="text-purple-400">for</span> event <span className="text-purple-400">in</span> stream:
    <span className="text-blue-300">print</span>(event.token_delta, end=<span className="text-emerald-400">""</span>)</code></pre>

<pre className="p-5 font-code-base text-sm leading-relaxed overflow-x-auto text-slate-200 hidden" id="code-ts"><code><span className="text-purple-400">import</span> {"{"} AgentForgeClient {"}"} <span className="text-purple-400">from</span> <span className="text-emerald-400">"@agentforge/sdk"</span>;

<span className="text-purple-400">const</span> client = <span className="text-purple-400">new</span> AgentForgeClient({"{"}
  apiKey: process.env.FORGE_SECRET_KEY!,
  tenantId: <span className="text-emerald-400">"tnt-fintech-boc-09"</span>,
  region: <span className="text-emerald-400">"us-central1"</span>,
{"}"});

<span className="text-purple-400">const</span> stream = <span className="text-purple-400">await</span> client.agents.stream({"{"}
  agentId: <span className="text-emerald-400">"ag-boc-treasury-reconciler"</span>,
  prompt: <span className="text-emerald-400">"Audit ledger discrepancies for batch #8492"</span>,
  strictGuardrails: <span className="text-amber-400">true</span>,
{"}"});

<span className="text-purple-400">for await</span> (<span className="text-purple-400">const</span> event <span className="text-purple-400">of</span> stream) {"{"}
  process.stdout.write(event.tokenDelta);
{"}"}</code></pre>

<pre className="p-5 font-code-base text-sm leading-relaxed overflow-x-auto text-slate-200 hidden" id="code-curl"><code>curl -X POST https://api.agentforge.ai/api/v1/chat \
  -H <span className="text-emerald-400">"Authorization: Bearer af_sk_a3b8f29e1c4d..."</span> \
  -H <span className="text-emerald-400">"Content-Type: application/json"</span> \
  -d <span className="text-amber-400">'{"{"}
    "message": "What is our company refund policy?",
    "history": []
  {"}"}'</span></code></pre>
</div>
</section>

<section className="flex flex-col gap-6 pt-4" id="endpoint-invoke">
<div className="flex flex-wrap items-center justify-between gap-3">
<div className="flex items-center gap-3">
<span className="px-2.5 py-1 rounded bg-primary text-on-primary font-code-base text-xs font-bold">POST</span>
<span className="font-code-base text-headline-sm font-semibold text-on-surface">/api/v1/chat</span>
</div>
<span className="px-3 py-1 rounded-full bg-surface-container font-label-caps text-label-caps text-on-surface-variant font-medium">Synchronous Block</span>
</div>
<p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            Directly invoke an autonomous agent runtime instance. Invocation requests pass through the active 3-tier inspection pipeline (regex masking, vector injection classification, and JSON schema conformity) before execution in isolated microVM gVisor environments.
          </p>

<div className="flex flex-col rounded-xl overflow-hidden bg-surface-container-lowest shadow-sm">
<div className="px-4 py-3 bg-surface-container-low font-label-caps text-label-caps uppercase text-on-surface-variant font-semibold">
              Required Headers
            </div>
<div className="flex flex-col divide-y divide-surface-container">
<div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
<div className="flex items-center gap-3">
<span className="font-code-base text-sm font-semibold text-on-surface">Authorization</span>
<span className="font-label-caps text-[10px] text-error font-medium px-2 py-0.5 rounded bg-error-container">required</span>
</div>
<div className="font-body-sm text-body-sm text-on-surface-variant font-mono text-xs md:text-right">
                  Bearer &lt;FORGE_SECRET_KEY&gt;
                </div>
</div>

<div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
<div className="flex items-center gap-3">
<span className="font-code-base text-sm font-semibold text-on-surface">X-Correlation-Trace</span>
<span className="font-label-caps text-[10px] text-on-surface-variant font-medium px-2 py-0.5 rounded bg-surface-container">optional</span>
</div>
<div className="font-body-sm text-body-sm text-on-surface-variant font-mono text-xs md:text-right">
                  W3C traceparent (00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01)
                </div>
</div>
</div>
</div>

<details className="group bg-surface-container-lowest rounded-xl p-4 shadow-sm">
<summary className="cursor-pointer font-label-ui text-label-ui text-primary font-semibold flex items-center justify-between list-none">
<span className="flex items-center gap-2">
<span className="material-symbols-outlined text-[18px] group-open:rotate-90 transition-transform">chevron_right</span>
                View Full Payload Schema (JSON)
              </span>
<span className="font-code-base text-xs text-on-surface-variant font-normal">{"{"} agent_id, prompt, guardrail_config... {"}"}</span>
</summary>
<div className="mt-4 pt-3 bg-[#0F172A] rounded-lg p-4 font-code-base text-xs text-slate-300 overflow-x-auto">
<pre><code>{"{"}
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {"{"}
    "agent_id": {"{"} "type": "string", "example": "ag-boc-treasury-reconciler" {"}"},
    "prompt": {"{"} "type": "string", "maxLength": 16384 {"}"},
    "guardrail_config": {"{"}
      "type": "object",
      "properties": {"{"}
        "enforce_pii_redaction": {"{"} "type": "boolean", "default": true {"}"},
        "prompt_injection_threshold": {"{"} "type": "number", "minimum": 0.0, "maximum": 1.0, "default": 0.85 {"}"},
        "allowed_schema_models": {"{"} "type": "array", "items": {"{"} "type": "string" {"}"} {"}"}
      {"}"}
    {"}"},
    "timeout_seconds": {"{"} "type": "integer", "default": 60 {"}"}
  {"}"},
  "required": ["agent_id", "prompt"]
{"}"}</code></pre>
</div>
</details>
</section>

<section className="flex flex-col gap-4">
<div className="rounded-2xl bg-surface-container-lowest p-6 shadow-md relative overflow-hidden">
<div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-primary/5 blur-2xl pointer-events-none"></div>
<div className="flex flex-col gap-5">

<div className="flex flex-wrap items-center justify-between gap-3">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[18px]">terminal</span>
</div>
<div>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Live API Sandbox</h3>
<p className="font-body-sm text-xs text-on-surface-variant">Target: https://us-central1.agentforge.api/v2</p>
</div>
</div>
<div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-low">
<span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
<span className="font-label-caps text-[11px] text-tertiary font-semibold">Mock Runtime Active</span>
</div>
</div>

<div className="flex flex-col gap-2">
<label className="font-label-caps text-label-caps uppercase text-on-surface-variant font-medium">Prompt Payload</label>
<div className="flex flex-col sm:flex-row gap-2">
<input className="flex-1 bg-surface-container-low rounded-lg px-3.5 py-2 text-on-surface font-body-sm text-body-sm focus:outline-none focus:bg-surface-container transition-colors shadow-inner" id="sandbox-prompt" type="text" defaultValue="Scan transaction #849201 for PII and compute ledger delta."/>
<button className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-primary text-on-primary font-label-ui text-label-ui font-medium hover:bg-primary/95 active:scale-95 transition-all shadow-sm" onClick={() => {}}>
<span className="material-symbols-outlined text-[18px]">play_arrow</span>
<span>Send Request</span>
</button>
</div>
</div>

<div className="flex flex-col rounded-xl overflow-hidden bg-[#0B1120] text-slate-300 shadow-inner">
<div className="flex items-center justify-between px-4 py-2 bg-[#121A2D] text-xs font-code-base text-slate-400">
<span className="flex items-center gap-1.5">
<span className="w-2 h-2 rounded-full bg-emerald-500"></span>
<span>HTTP 200 OK</span>
</span>
<span id="sandbox-clock">284ms</span>
</div>
<div className="p-4 font-code-base text-xs leading-relaxed overflow-x-auto" id="sandbox-output">
<pre><code>{"{"}
  <span className="text-purple-400">"status"</span>: <span className="text-emerald-400">"success"</span>,
  <span className="text-purple-400">"trace_id"</span>: <span className="text-emerald-400">"tr-0192a8e4-b7c1-7efc"</span>,
  <span className="text-purple-400">"latency_ms"</span>: <span className="text-amber-400">284</span>,
  <span className="text-purple-400">"guardrails"</span>: {"{"}
    <span className="text-purple-400">"pii_detected"</span>: <span className="text-amber-400">false</span>,
    <span className="text-purple-400">"prompt_injection_score"</span>: <span className="text-amber-400">0.012</span>,
    <span className="text-purple-400">"action"</span>: <span className="text-emerald-400">"PASS"</span>
  {"}"},
  <span className="text-purple-400">"tokens_consumed"</span>: <span className="text-amber-400">142</span>
{"}"}</code></pre>
</div>
</div>

<div className="flex flex-wrap items-center justify-between gap-2 text-xs font-code-base text-on-surface-variant">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-tertiary text-[16px]">verified</span>
<span>3-Layer Verification: Pass</span>
</div>
<div className="flex items-center gap-4">
<span>Latency: 284ms</span>
<span>•</span>
<span>gVisor microVM Isolated</span>
</div>
</div>
</div>
</div>
</section>

<section className="flex flex-col gap-4 pb-8" id="terraform">
<div className="flex items-center justify-between">
<div>
<h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">GCP Terraform Module</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant">Deploy an isolated VPC, private Cloud Run swarm cluster, and Cloud Armor edge guardrails in 1 command.</p>
</div>
<a className="font-label-ui text-label-ui text-primary font-medium hover:underline flex items-center gap-1" href="https://github.com" rel="noreferrer" target="_blank">
              Registry <span className="material-symbols-outlined text-[14px]">open_in_new</span>
</a>
</div>
<div className="rounded-xl overflow-hidden shadow-sm bg-[#0F172A] text-slate-200">
<div className="flex items-center justify-between px-4 py-2 bg-[#172033] font-code-base text-xs text-slate-400">
<span>main.tf</span>
<span>HCL</span>
</div>
<pre className="p-4 font-code-base text-xs leading-relaxed overflow-x-auto text-slate-200"><code><span className="text-purple-400">module</span> <span className="text-emerald-400">"agentforge_us_central"</span> {"{"}
  source  = <span className="text-emerald-400">"terraform-google-modules/agentforge/google"</span>
  version = <span className="text-emerald-400">"~&gt; 2.4.0"</span>

  project_id         = var.gcp_project_id
  region             = <span className="text-emerald-400">"us-central1"</span>
  tenant_isolation   = <span className="text-amber-400">true</span>
  vpc_connector_name = <span className="text-emerald-400">"agent-forge-vpc"</span>
  otel_bigquery_sink = <span className="text-amber-400">true</span>
{"}"}</code></pre>
</div>
</section>
</div>
</div>
</div>
</div>
</main><div aria-hidden="true" data-snapdom-sandbox="true" id="snapdom-sandbox" style={{position: 'absolute', left: '-9999px', top: '-9999px', width: '0px', height: '0px', overflow: 'hidden'}}></div>
    </>
  );
}