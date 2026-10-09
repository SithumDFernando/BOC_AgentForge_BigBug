"use client";
/* eslint-disable */
// @ts-nocheck
import { useState, useEffect } from 'react';

export default function AgentForgeArchitectureandPipeline() {
  const [filter, setFilter] = useState('all');
  const [healthData, setHealthData] = useState(null);

  useEffect(() => {
    fetch('/api/architecture')
      .then(r => r.json())
      .then(setHealthData)
      .catch(console.error);
  }, []);

  return (
    <>
      <main className="w-full pt-16 bg-surface"><div className="flex flex-col w-full">

<div className="relative w-full overflow-hidden">
<div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1100px] h-[480px] bg-gradient-to-b from-primary/10 via-secondary/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>
<div className="absolute top-80 right-0 w-96 h-96 bg-tertiary/5 rounded-full blur-3xl pointer-events-none -z-10"></div>

<section className="max-w-7xl mx-auto w-full px-margin-sm md:px-margin pt-10 pb-8">

<div className="flex flex-wrap items-center justify-between gap-space-sm mb-6">
<div className="flex items-center gap-space-xs font-label-caps text-label-caps text-on-surface-variant">
<a href="/" className="hover:text-primary transition-colors">Platform</a>
<span className="material-symbols-outlined text-[14px]">chevron_right</span>
<a href="/architecture" className="hover:text-primary transition-colors">Architecture</a>
<span className="material-symbols-outlined text-[14px]">chevron_right</span>
<span className="text-primary font-semibold">5-Layer Engine</span>
</div>
<div className="flex items-center gap-space-xs px-3 py-1 rounded-full bg-surface-container-lowest shadow-sm">
<span className="inline-block w-2 h-2 rounded-full bg-tertiary animate-ping"></span>
<span className="font-code-base text-code-base text-tertiary font-medium">us-central1 (Iowa) Multi-Zone Verified</span>
</div>
</div>

<div className="max-w-4xl flex flex-col gap-space-sm">
<h1 className="font-display-hero text-display-hero-mobile md:text-display-hero text-on-surface tracking-tight">
          Inside the 5-Layer Autonomous Agent Engine
        </h1>
<p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
          Cloud-native, zero-trust request orchestration built on a hybrid GCP + AWS + Pinecone infrastructure. Engineered for enterprise SLA determinism, cryptographic multi-tenant isolation, and sub-second reasoning spans.
        </p>
</div>

<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-space-sm mt-8">
<div className="flex flex-col p-space-md rounded-xl bg-surface-container-lowest shadow-sm">
<div className="flex items-center justify-between mb-1">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase">P50 Latency</span>
<span className="material-symbols-outlined text-tertiary text-[18px]">speed</span>
</div>
<span className="font-headline-sm text-headline-sm text-on-surface font-bold">542 ms</span>
<span className="font-code-base text-[11px] text-tertiary mt-1">End-to-end traversal</span>
</div>
<div className="flex flex-col p-space-md rounded-xl bg-surface-container-lowest shadow-sm">
<div className="flex items-center justify-between mb-1">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Managed Services</span>
<span className="material-symbols-outlined text-primary text-[18px]">cloud</span>
</div>
<span className="font-headline-sm text-headline-sm text-on-surface font-bold">Hybrid Cloud</span>
<span className="font-code-base text-[11px] text-on-surface-variant mt-1">GCP + AWS + Pinecone</span>
</div>
<div className="flex flex-col p-space-md rounded-xl bg-surface-container-lowest shadow-sm">
<div className="flex items-center justify-between mb-1">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Vector Boundary</span>
<span className="material-symbols-outlined text-secondary text-[18px]">lock</span>
</div>
<span className="font-headline-sm text-headline-sm text-on-surface font-bold">Isolated RAG</span>
<span className="font-code-base text-[11px] text-secondary mt-1">Per-tenant SHA-256 namespace</span>
</div>
<div className="flex flex-col p-space-md rounded-xl bg-surface-container-lowest shadow-sm">
<div className="flex items-center justify-between mb-1">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Operational Lift</span>
<span className="material-symbols-outlined text-tertiary text-[18px]">engineering</span>
</div>
<span className="font-headline-sm text-headline-sm text-on-surface font-bold">Zero DIY Infra</span>
<span className="font-code-base text-[11px] text-tertiary mt-1">100% Serverless Autonomic</span>
</div>
<div className="col-span-2 sm:col-span-1 flex flex-col p-space-md rounded-xl bg-surface-container-lowest shadow-sm">
<div className="flex items-center justify-between mb-1">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Specification</span>
<span className="material-symbols-outlined text-primary text-[18px]">verified</span>
</div>
<span className="font-headline-sm text-headline-sm text-primary font-bold">BOC 2.0 #5</span>
<span className="font-code-base text-[11px] text-on-surface-variant mt-1">Production Agent Scale</span>
</div>
</div>
</section>

<section className="max-w-7xl mx-auto w-full px-margin-sm md:px-margin py-12">
<div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-space-sm">
<div>
<div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed mb-2 font-label-caps text-label-caps uppercase tracking-wider font-semibold">
            Execution Flow
          </div>
<h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold">
            The Interactive 5-Layer Request Pipeline
          </h2>
<p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Select any pipeline stage to inspect system components, protocol parameters, and latency budgets.
          </p>
</div>

<div className="flex items-center gap-space-xs bg-surface-container p-1 rounded-xl shadow-inner">
<button className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-primary font-label-ui text-label-ui font-semibold shadow-sm transition-all flex items-center gap-1.5" id="btn-flow-live" onClick={() => {}}>
<span className="w-2 h-2 rounded-full bg-tertiary"></span> Nominal Flow
          </button>
<button className="px-3 py-1.5 rounded-lg text-on-surface-variant font-label-ui text-label-ui font-medium hover:text-on-surface transition-all flex items-center gap-1.5" id="btn-flow-failover" onClick={() => {}}>
<span className="w-2 h-2 rounded-full bg-secondary"></span> Fallback Chain (Gemini 3.6 → Lite)
          </button>
</div>
</div>

<div className="grid grid-cols-1 lg:grid-cols-5 gap-space-md mb-8">

<div className="group cursor-pointer rounded-2xl bg-surface-container-lowest p-space-md shadow-sm transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden" id="card-l1" onClick={() => {}}>
<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary"></div>
<div className="flex items-center justify-between mb-3">
<span className="font-code-base text-label-caps text-primary font-bold tracking-wider">01 // EDGE</span>
<span className="px-2 py-0.5 rounded text-[10px] font-code-base bg-surface-container text-on-surface-variant font-medium">HTTPS / mTLS</span>
</div>
<h3 className="font-headline-sm text-[17px] font-bold text-on-surface mb-1">Ingress &amp; Perimeter</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-4 line-clamp-2">Apigee Gateway token authorization &amp; Cloud Armor DDoS scrub.</p>
<div className="pt-3 flex items-center justify-between font-code-base text-[12px] text-tertiary">
<span>Quota Check</span>
<span className="font-bold">~14ms</span>
</div>
</div>

<div className="group cursor-pointer rounded-2xl bg-surface-container-lowest p-space-md shadow-sm transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden" id="card-l2" onClick={() => {}}>
<div className="absolute top-0 left-0 right-0 h-1 bg-primary"></div>
<div className="flex items-center justify-between mb-3">
<span className="font-code-base text-label-caps text-primary font-bold tracking-wider">02 // RUNTIME</span>
<span className="px-2 py-0.5 rounded text-[10px] font-code-base bg-surface-container text-on-surface-variant font-medium">HTTPS / Firebase</span>
</div>
<h3 className="font-headline-sm text-[17px] font-bold text-on-surface mb-1">Agent Orchestration</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-4 line-clamp-2">Cloud Run container instances hosting Next.js API routes; Firebase Firestore for session state and agent configs.</p>
<div className="pt-3 flex items-center justify-between font-code-base text-[12px] text-tertiary">
<span>API Route Handler</span>
<span className="font-bold">~10ms</span>
</div>
</div>

<div className="group cursor-pointer rounded-2xl bg-surface-container-lowest p-space-md shadow-sm transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden" id="card-l3" onClick={() => {}}>
<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary to-primary"></div>
<div className="flex items-center justify-between mb-3">
<span className="font-code-base text-label-caps text-secondary font-bold tracking-wider">03 // COGNITIVE</span>
<span className="px-2 py-0.5 rounded text-[10px] font-code-base bg-surface-container text-on-surface-variant font-medium">SSE Stream</span>
</div>
<h3 className="font-headline-sm text-[17px] font-bold text-on-surface mb-1">Cognitive &amp; RAG</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-4 line-clamp-2">Gemini 3.5 Flash inference with Pinecone per-tenant vector namespaces.</p>
<div className="pt-3 flex items-center justify-between font-code-base text-[12px] text-tertiary">
<span>Pinecone HNSW Retrieval</span>
<span className="font-bold">~380ms</span>
</div>
</div>

<div className="group cursor-pointer rounded-2xl bg-surface-container-lowest p-space-md shadow-sm transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden" id="card-l4" onClick={() => {}}>
<div className="absolute top-0 left-0 right-0 h-1 bg-tertiary"></div>
<div className="flex items-center justify-between mb-3">
<span className="font-code-base text-label-caps text-tertiary font-bold tracking-wider">04 // SANDBOX</span>
<span className="px-2 py-0.5 rounded text-[10px] font-code-base bg-surface-container text-on-surface-variant font-medium">In-Process JS</span>
</div>
<h3 className="font-headline-sm text-[17px] font-bold text-on-surface mb-1">Execution &amp; Safety</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-4 line-clamp-2">3-layer guardrail pipeline (L1 input, L2 output, L3 human escalation), PII scrubbing, injection detection, and refund threshold enforcement.</p>
<div className="pt-3 flex items-center justify-between font-code-base text-[12px] text-tertiary">
<span>Guardrail Scan</span>
<span className="font-bold">~85ms</span>
</div>
</div>

<div className="group cursor-pointer rounded-2xl bg-surface-container-lowest p-space-md shadow-sm transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden" id="card-l5" onClick={() => {}}>
<div className="absolute top-0 left-0 right-0 h-1 bg-surface-tint"></div>
<div className="flex items-center justify-between mb-3">
<span className="font-code-base text-label-caps text-on-surface-variant font-bold tracking-wider">05 // AUDIT</span>
<span className="px-2 py-0.5 rounded text-[10px] font-code-base bg-surface-container text-on-surface-variant font-medium">DynamoDB / Firebase</span>
</div>
<h3 className="font-headline-sm text-[17px] font-bold text-on-surface mb-1">Telemetry &amp; Audit</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-4 line-clamp-2">AWS DynamoDB immutable trace log, Firebase trace summaries, Cloud Logging decision steps.</p>
<div className="pt-3 flex items-center justify-between font-code-base text-[12px] text-tertiary">
<span>Async Write</span>
<span className="font-bold">&lt; 1ms</span>
</div>
</div>
</div>

<div className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-md transition-all" id="layer-inspector">

</div>
</section>

<div className="max-w-7xl mx-auto w-full px-margin-sm md:px-margin my-4">
<div className="rounded-2xl bg-surface-container-low p-space-lg shadow-sm">
<div className="flex flex-col md:flex-row items-center justify-between gap-space-md mb-6">
<div>
<span className="font-label-caps text-label-caps text-primary uppercase font-bold tracking-widest">Protocol &amp; Transit Flow</span>
<h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Asynchronous Ingestion &amp; Failover Topography</h3>
</div>
<div className="flex items-center gap-space-sm font-code-base text-code-base text-on-surface-variant">
<span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-primary rounded"></span> Active Ingress</span>
<span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-secondary rounded"></span> Dynamic Circuit</span>
<span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-tertiary rounded"></span> AWS SQS Escalation</span>
</div>
</div>

<div className="w-full overflow-x-auto">
<svg className="w-full min-w-[760px] h-48" fill="none" viewBox="0 0 960 180" xmlns="http://www.w3.org/2000/svg">

<line className="text-on-surface" stroke="currentColor" strokeDasharray="4 4" strokeOpacity="0.06" x1="0" x2="960" y1="45" y2="45"></line>
<line className="text-on-surface" stroke="currentColor" strokeDasharray="4 4" strokeOpacity="0.06" x1="0" x2="960" y1="90" y2="90"></line>
<line className="text-on-surface" stroke="currentColor" strokeDasharray="4 4" strokeOpacity="0.06" x1="0" x2="960" y1="135" y2="135"></line>

<path className="text-primary-container" d="M 60 90 L 240 90 L 440 90 L 660 90 L 880 90" stroke="currentColor" strokeLinecap="round" strokeOpacity="0.2" strokeWidth="4"></path>
<path d="M 60 90 L 240 90 L 440 90 L 660 90 L 880 90" stroke="#4F46E5" strokeDasharray="12 12" strokeLinecap="round" strokeWidth="2">
<animate attributeName="stroke-dashoffset" dur="2s" from="48" repeatCount="indefinite" to="0"></animate>
</path>

<path d="M 440 90 C 480 90, 500 35, 560 35 L 680 35" stroke="#712AE2" strokeDasharray="6 4" strokeLinecap="round" strokeWidth="2"></path>

<path d="M 660 90 C 700 90, 710 145, 760 145 L 860 145" stroke="#006D62" strokeDasharray="4 4" strokeLinecap="round" strokeWidth="2"></path>

<g transform="translate(60, 90)">
<circle fill="#FFFFFF" r="22" stroke="#4F46E5" strokeWidth="2"></circle>
<circle fill="#4F46E5" r="8"></circle>
<text className="font-code-base text-[11px] fill-current text-on-surface font-semibold" textAnchor="middle" x="0" y="38">Client Edge</text>
<text className="font-label-caps text-[9px] fill-current text-on-surface-variant" textAnchor="middle" x="0" y="52">Apigee / Armor</text>
</g>

<g transform="translate(240, 90)">
<circle fill="#FFFFFF" r="20" stroke="#4F46E5" strokeWidth="2"></circle>
<circle fill="#4F46E5" r="6"></circle>
<text className="font-code-base text-[11px] fill-current text-on-surface font-semibold" textAnchor="middle" x="0" y="38">Cloud Run Core</text>
<text className="font-label-caps text-[9px] fill-current text-on-surface-variant" textAnchor="middle" x="0" y="52">Memorystore Hits</text>
</g>

<g transform="translate(440, 90)">
<circle fill="#FFFFFF" r="24" stroke="#3525CD" strokeWidth="2"></circle>
<circle fill="#3525CD" r="9"></circle>
<text className="font-code-base text-[11px] fill-current text-on-surface font-semibold" textAnchor="middle" x="0" y="40">Gemini 3.5 Flash</text>
<text className="font-label-caps text-[9px] fill-current text-on-surface-variant" textAnchor="middle" x="0" y="54">Pinecone RAG</text>
</g>

<g transform="translate(680, 35)">
<rect fill="#FFFFFF" height="28" rx="6" stroke="#712AE2" strokeWidth="1.5" width="90" x="-45" y="-14"></rect>
<text className="font-code-base text-[10px] fill-current text-secondary font-bold" textAnchor="middle" x="0" y="4">Fallback Model</text>
<text className="font-label-caps text-[8px] fill-current text-on-surface-variant" textAnchor="middle" x="0" y="24">Gemini 3.6 Flash</text>
</g>

<g transform="translate(660, 90)">
<circle fill="#FFFFFF" r="20" stroke="#00534A" strokeWidth="2"></circle>
<circle fill="#00534A" r="6"></circle>
<text className="font-code-base text-[11px] fill-current text-on-surface font-semibold" textAnchor="middle" x="0" y="38">Sandbox Execution</text>
<text className="font-label-caps text-[9px] fill-current text-on-surface-variant" textAnchor="middle" x="0" y="52">gVisor Sandbox</text>
</g>

<g transform="translate(860, 145)">
<rect fill="#FFFFFF" height="24" rx="4" stroke="#006D62" strokeWidth="1.5" width="80" x="-40" y="-12"></rect>
<text className="font-code-base text-[10px] fill-current text-tertiary font-bold" textAnchor="middle" x="0" y="4">AWS SQS Queue</text>
<text className="font-label-caps text-[8px] fill-current text-on-surface-variant" textAnchor="middle" x="0" y="22">Human-in-Loop</text>
</g>

<g transform="translate(880, 90)">
<circle fill="#FFFFFF" r="20" stroke="#4D44E3" strokeWidth="2"></circle>
<circle fill="#4D44E3" r="6"></circle>
<text className="font-code-base text-[11px] fill-current text-on-surface font-semibold" textAnchor="middle" x="0" y="38">DynamoDB Audit</text>
<text className="font-label-caps text-[9px] fill-current text-on-surface-variant" textAnchor="middle" x="0" y="52">Immutable Trace Log</text>
</g>
</svg>
</div>
</div>
</div>

<section className="max-w-7xl mx-auto w-full px-margin-sm md:px-margin py-12">
<div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-space-sm">
<div>
<div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed mb-2 font-label-caps text-label-caps uppercase tracking-wider font-semibold">
            Infrastructure Grid
          </div>
<h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold">
            GCP Managed Topology &amp; Service Mapping
          </h2>
<p className="font-body-md text-body-md text-on-surface-variant mt-1">
            System services span GCP Cloud Run, Firebase Firestore, AWS DynamoDB, AWS SQS, and Pinecone — all fully managed with no self-hosted VMs or custom daemons.
          </p>
</div>
<div className="flex items-center gap-space-sm">
<span className="font-label-caps text-label-caps text-on-surface-variant">Filter Focus:</span>
<button className={`topo-btn px-2.5 py-1 rounded font-label-caps text-label-caps font-medium transition-colors ${filter === 'all' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface'}`} onClick={() => setFilter('all')}>All (6)</button>
<button className={`topo-btn px-2.5 py-1 rounded font-label-caps text-label-caps font-medium transition-colors ${filter === 'compute' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface'}`} onClick={() => setFilter('compute')}>Compute</button>
<button className={`topo-btn px-2.5 py-1 rounded font-label-caps text-label-caps font-medium transition-colors ${filter === 'data' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface'}`} onClick={() => setFilter('data')}>Data &amp; AI</button>
<button className={`topo-btn px-2.5 py-1 rounded font-label-caps text-label-caps font-medium transition-colors ${filter === 'security' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface'}`} onClick={() => setFilter('security')}>Security</button>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">

<div className={`topo-card flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm hover:shadow-md transition-all duration-200 ${filter !== 'all' && filter !== 'compute' ? 'hidden' : ''}`} data-category="compute">
<div>
<div className="flex items-center justify-between mb-4">
<div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[22px]">developer_board</span>
</div>
<span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-code-base text-[11px] font-medium">Compute Tier</span>
</div>
<h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-2">Cloud Run Microservices</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-6">
              Serverless container runtime managing autonomous loop executors. Scales to 0 on idle; dynamically bursts to 1,000 instances with concurrency fixed at 80 requests/container.
            </p>
</div>
<div className="pt-4 bg-surface-container-low -mx-space-lg -mb-space-lg p-space-md rounded-b-2xl flex flex-col gap-2">
<div className="flex items-center justify-between font-code-base text-[11px]">
<span className="text-on-surface-variant">Cold Start Penalty</span>
<span className="text-tertiary font-semibold">&lt; 320ms (Min-instances: 2)</span>
</div>
<div className="flex items-center justify-between font-code-base text-[11px]">
<span className="text-on-surface-variant">VPC Egress</span>
<span className="text-on-surface font-semibold">Direct VPC Connector</span>
</div>
</div>
</div>

<div className={`topo-card flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm hover:shadow-md transition-all duration-200 ${filter !== 'all' && filter !== 'compute' ? 'hidden' : ''}`} data-category="compute">
<div>
<div className="flex items-center justify-between mb-4">
<div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
<span className="material-symbols-outlined text-[22px]">alt_route</span>
</div>
<span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-code-base text-[11px] font-medium">Edge Proxy</span>
</div>
<h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-2">Apigee API Gateway</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-6">
              Enterprise policy enforcement layer verifying tenant OAuth2/JWT signatures, enforcing dynamic per-seat rate limits, and metering raw token consumption before ingress.
            </p>
</div>
<div className="pt-4 bg-surface-container-low -mx-space-lg -mb-space-lg p-space-md rounded-b-2xl flex flex-col gap-2">
<div className="flex items-center justify-between font-code-base text-[11px]">
<span className="text-on-surface-variant">Policy Execution</span>
<span className="text-tertiary font-semibold">~14ms P95</span>
</div>
<div className="flex items-center justify-between font-code-base text-[11px]">
<span className="text-on-surface-variant">DDoS Shield</span>
<span className="text-on-surface font-semibold">Cloud Armor Tier-1</span>
</div>
</div>
</div>

<div className={`topo-card flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm hover:shadow-md transition-all duration-200 ${filter !== 'all' && filter !== 'data' ? 'hidden' : ''}`} data-category="data">
<div>
<div className="flex items-center justify-between mb-4">
<div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary">
<span className="material-symbols-outlined text-[22px]">database</span>
</div>
<span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-code-base text-[11px] font-medium">State &amp; Cache</span>
</div>
<h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-2">Firebase Firestore &amp; State</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-6">
              Primary state layer: ACID-compliant Firebase Firestore manages session graphs, agent configs, escalations, and trace summaries. All reads and writes go through authenticated Next.js API routes.
            </p>
</div>
<div className="pt-4 bg-surface-container-low -mx-space-lg -mb-space-lg p-space-md rounded-b-2xl flex flex-col gap-2">
<div className="flex items-center justify-between font-code-base text-[11px]">
<span className="text-on-surface-variant">Firestore Writes</span>
<span className="text-tertiary font-semibold">Firestore Strong Consistency</span>
</div>
<div className="flex items-center justify-between font-code-base text-[11px]">
<span className="text-on-surface-variant">Storage Model</span>
<span className="text-on-surface font-semibold">Firebase + AWS DynamoDB</span>
</div>
</div>
</div>

<div className={`topo-card flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm hover:shadow-md transition-all duration-200 ${filter !== 'all' && filter !== 'data' ? 'hidden' : ''}`} data-category="data">
<div>
<div className="flex items-center justify-between mb-4">
<div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[22px]">psychology</span>
</div>
<span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-code-base text-[11px] font-medium">Cognitive Layer</span>
</div>
<h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-2">Gemini AI &amp; Pinecone RAG</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-6">
              Gemini 3.5 Flash multimodal reasoning coupled with Pinecone vector DB. Employs HNSW indexing partitioned into cryptographically isolated per-tenant namespaces.
            </p>
</div>
<div className="pt-4 bg-surface-container-low -mx-space-lg -mb-space-lg p-space-md rounded-b-2xl flex flex-col gap-2">
<div className="flex items-center justify-between font-code-base text-[11px]">
<span className="text-on-surface-variant">Recall Rate</span>
<span className="text-tertiary font-semibold">&gt; 98.6% @ Top-10</span>
</div>
<div className="flex items-center justify-between font-code-base text-[11px]">
<span className="text-on-surface-variant">Model Fallback</span>
<span className="text-on-surface font-semibold">Gemini 3.6 / Lite Fallback</span>
</div>
</div>
</div>

<div className={`topo-card flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm hover:shadow-md transition-all duration-200 ${filter !== 'all' && filter !== 'security' ? 'hidden' : ''}`} data-category="security">
<div>
<div className="flex items-center justify-between mb-4">
<div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
<span className="material-symbols-outlined text-[22px]">vpn_key</span>
</div>
<span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-code-base text-[11px] font-medium">KMS &amp; Auth</span>
</div>
<h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-2">Secret Manager &amp; Workload IAM</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-6">
              Tenant tool API keys and downstream enterprise credentials reside in Google Cloud Secret Manager with per-call automated rotation and customer-managed encryption keys (CMEK).
            </p>
</div>
<div className="pt-4 bg-surface-container-low -mx-space-lg -mb-space-lg p-space-md rounded-b-2xl flex flex-col gap-2">
<div className="flex items-center justify-between font-code-base text-[11px]">
<span className="text-on-surface-variant">Encryption Standard</span>
<span className="text-tertiary font-semibold">AES-256 GCM Hardware</span>
</div>
<div className="flex items-center justify-between font-code-base text-[11px]">
<span className="text-on-surface-variant">Service Access</span>
<span className="text-on-surface font-semibold">Workload Identity Fed.</span>
</div>
</div>
</div>

<div className={`topo-card flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm hover:shadow-md transition-all duration-200 ${filter !== 'all' && filter !== 'data' ? 'hidden' : ''}`} data-category="data">
<div>
<div className="flex items-center justify-between mb-4">
<div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary">
<span className="material-symbols-outlined text-[22px]">analytics</span>
</div>
<span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-code-base text-[11px] font-medium">Lakehouse &amp; SRE</span>
</div>
<h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-2">AWS DynamoDB &amp; Cloud Logging</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-6">
              Every agent decision, tool call, guardrail result, and latency span is written to AWS DynamoDB (audit) and Firebase trace_summaries, with step-level detail logged to GCP Cloud Logging.
            </p>
</div>
<div className="pt-4 bg-surface-container-low -mx-space-lg -mb-space-lg p-space-md rounded-b-2xl flex flex-col gap-2">
<div className="flex items-center justify-between font-code-base text-[11px]">
<span className="text-on-surface-variant">Write Latency</span>
<span className="text-tertiary font-semibold">&lt; 50ms DynamoDB Write</span>
</div>
<div className="flex items-center justify-between font-code-base text-[11px]">
<span className="text-on-surface-variant">Trace Propagation</span>
<span className="text-on-surface font-semibold">W3C TraceContext / Cloud Log</span>
</div>
</div>
</div>
</div>
</section>

<section className="max-w-7xl mx-auto w-full px-margin-sm md:px-margin py-12">
<div className="mb-10">
<div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed mb-2 font-label-caps text-label-caps uppercase tracking-wider font-semibold">
          Enterprise Assurance
        </div>
<h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold">
          High Availability &amp; Multi-Tenant Isolation
        </h2>
<p className="font-body-md text-body-md text-on-surface-variant mt-1 max-w-3xl">
          Architectural boundaries guarantee that cross-tenant contamination is mathematically impossible while meeting 99.9% uptime enterprise requirements.
        </p>
</div>

<div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">

<div className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col justify-between">
<div>
<div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
<span className="material-symbols-outlined text-[28px]">shield_lock</span>
</div>
<h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-3">
              Cryptographic Namespace Partitioning
            </h3>
<p className="font-body-md text-body-md text-on-surface-variant mb-6">
              Tenant documents are scoped inside Pinecone with per-tenant namespace isolation. At query time, filters enforce hard tenancy at the vector indexing layer — cross-tenant data leakage is structurally impossible.
            </p>
<ul className="flex flex-col gap-2 font-body-sm text-body-sm text-on-surface-variant mb-6">
<li className="flex items-start gap-2">
<span className="material-symbols-outlined text-tertiary text-[18px] shrink-0 mt-0.5">check_circle</span>
<span>Zero cross-tenant vector contamination</span>
</li>
<li className="flex items-start gap-2">
<span className="material-symbols-outlined text-tertiary text-[18px] shrink-0 mt-0.5">check_circle</span>
<span>Tenant-scoped KMS encryption keys</span>
</li>
<li className="flex items-start gap-2">
<span className="material-symbols-outlined text-tertiary text-[18px] shrink-0 mt-0.5">check_circle</span>
<span>Strict tenant isolation in DynamoDB audit logs</span>
</li>
</ul>
</div>
<div className="p-space-sm bg-surface-container rounded-xl font-code-base text-[11px] text-on-surface">
<span className="text-primary font-semibold">namespace:</span> <code>pinecone.index(tenantId)</code>
</div>
</div>

<div className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col justify-between">
<div>
<div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary mb-6">
<span className="material-symbols-outlined text-[28px]">tune</span>
</div>
<h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-3">
              Adaptive Token Budgeting
            </h3>
<p className="font-body-md text-body-md text-on-surface-variant mb-6">
              Token allocation engines run via Apigee spike arrest algorithms. Tenants enjoy guaranteed burst thresholds alongside hard monthly financial safeguards against runaways.
            </p>
<ul className="flex flex-col gap-2 font-body-sm text-body-sm text-on-surface-variant mb-6">
<li className="flex items-start gap-2">
<span className="material-symbols-outlined text-tertiary text-[18px] shrink-0 mt-0.5">check_circle</span>
<span>Dynamic sliding-window rate limits</span>
</li>
<li className="flex items-start gap-2">
<span className="material-symbols-outlined text-tertiary text-[18px] shrink-0 mt-0.5">check_circle</span>
<span>Loop detection &amp; execution depth aborts</span>
</li>
<li className="flex items-start gap-2">
<span className="material-symbols-outlined text-tertiary text-[18px] shrink-0 mt-0.5">check_circle</span>
<span>High-risk escalations published to AWS SQS queue</span>
</li>
</ul>
</div>
<div className="p-space-sm bg-surface-container rounded-xl font-code-base text-[11px] text-on-surface">
<span className="text-secondary font-semibold">refundLimit:</span> <code>configurable per tenant | blockInjections: true</code>
</div>
</div>

<div className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col justify-between">
<div>
<div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary mb-6">
<span className="material-symbols-outlined text-[28px]">cloud_sync</span>
</div>
<h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-3">
              Multi-AZ 99.9% Failover
            </h3>
<p className="font-body-md text-body-md text-on-surface-variant mb-6">
              Cloud Run replicas span availability zones in us-central1. Should Gemini 3.5 Flash encounter 503 or rate limiting, the fallback loop automatically retries gemini-3.6-flash then gemini-3.5-flash-lite.
            </p>
<ul className="flex flex-col gap-2 font-body-sm text-body-sm text-on-surface-variant mb-6">
<li className="flex items-start gap-2">
<span className="material-symbols-outlined text-tertiary text-[18px] shrink-0 mt-0.5">check_circle</span>
<span>Automated health check trippers</span>
</li>
<li className="flex items-start gap-2">
<span className="material-symbols-outlined text-tertiary text-[18px] shrink-0 mt-0.5">check_circle</span>
<span>Session state persisted in Firebase Firestore</span>
</li>
<li className="flex items-start gap-2">
<span className="material-symbols-outlined text-tertiary text-[18px] shrink-0 mt-0.5">check_circle</span>
<span>Active-active Cloud Run multi-region expansion</span>
</li>
</ul>
</div>
<div className="p-space-sm bg-surface-container rounded-xl font-code-base text-[11px] text-on-surface">
<span className="text-tertiary font-semibold">circuit:</span> <code>status: CLOSED | p99_sla: 99.95%</code>
</div>
</div>
</div>
</section>

<section className="max-w-7xl mx-auto w-full px-margin-sm md:px-margin pt-6 pb-20">
<div className="rounded-3xl bg-surface-container-low p-space-lg md:p-space-xl shadow-sm">
<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-space-md mb-8">
<div>
<h3 className="font-headline-md text-headline-md font-bold text-on-surface">Technical Reference Checklist</h3>
<p className="font-body-md text-body-md text-on-surface-variant mt-1">Verification parameters for enterprise security evaluations and cloud review boards.</p>
</div>
<a className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-on-primary font-label-ui text-label-ui font-semibold shadow hover:opacity-95 transition-all" href="/launch">
<span>Explore Runtime Telemetry</span>
<span className="material-symbols-outlined text-[16px]">arrow_forward</span>
</a>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-space-md font-code-base text-code-base">
<div className="p-space-md rounded-xl bg-surface-container-lowest flex items-center justify-between">
<span className="text-on-surface">Zero Trust Ingress Auth</span>
<span className="px-2 py-0.5 rounded bg-tertiary/10 text-tertiary font-bold text-[11px]">RS256 JWT Signed</span>
</div>
<div className="p-space-md rounded-xl bg-surface-container-lowest flex items-center justify-between">
<span className="text-on-surface">Orchestration Scaling Rule</span>
<span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[11px]">0 to 1,000 instances</span>
</div>
<div className="p-space-md rounded-xl bg-surface-container-lowest flex items-center justify-between">
<span className="text-on-surface">Data Transit Encryption</span>
<span className="px-2 py-0.5 rounded bg-tertiary/10 text-tertiary font-bold text-[11px]">TLS 1.3 / mTLS Mesh</span>
</div>
<div className="p-space-md rounded-xl bg-surface-container-lowest flex items-center justify-between">
<span className="text-on-surface">Sandboxing Technology</span>
<span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[11px]">gVisor / Ephemeral Run</span>
</div>
<div className="p-space-md rounded-xl bg-surface-container-lowest flex items-center justify-between">
<span className="text-on-surface">Disaster Recovery RPO / RTO</span>
<span className="px-2 py-0.5 rounded bg-tertiary/10 text-tertiary font-bold text-[11px]">RPO: 0s | RTO: &lt; 30s</span>
</div>
<div className="p-space-md rounded-xl bg-surface-container-lowest flex items-center justify-between">
<span className="text-on-surface">Compliance Certifications</span>
<span className="px-2 py-0.5 rounded bg-secondary/10 text-secondary font-bold text-[11px]">SOC2 Type II, HIPAA, ISO27001</span>
</div>
</div>
</div>
</section>
</div>
</div>

</main>
    </>
  );
}