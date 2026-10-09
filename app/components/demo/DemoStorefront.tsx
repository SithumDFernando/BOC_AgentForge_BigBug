'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../AuthProvider';
import { demoCompanies, DemoCompany } from '@/lib/demo-config';
import ChatPanel from './ChatPanel';

const shoes = [
  { name: 'Coast Runner', category: 'Running', price: 12900, color: '#39665c', background: '#e1e7de', description: 'A breathable mesh upper, cushioned footbed and flexible sole for your everyday stride.', sizes: '39–45' },
  { name: 'City Stride', category: 'Everyday', price: 9900, color: '#e8e4da', background: '#eae5da', description: 'Clean lines and a padded collar. Your easygoing companion from commute to weekend.', sizes: '36–44' },
  { name: 'Cloud Walk', category: 'Walking', price: 11500, color: '#a6a29a', background: '#e4e2de', description: 'Soft underfoot, relaxed on the outside. A comfortable option for busy days.', sizes: '37–44' },
  { name: 'Trail Rise', category: 'Outdoor', price: 15900, color: '#6f7755', background: '#e3e3d4', description: 'Outdoor-inspired grip and a reinforced toe for casual exploring.', sizes: '40–45' },
  { name: 'Weekend Canvas', category: 'Everyday', price: 7500, color: '#2c4057', background: '#dfe4e8', description: 'Classic canvas, a lace-up fit and all the freedom of an unplanned afternoon.', sizes: '36–43' },
  { name: 'Island Slide', category: 'Sandals', price: 4900, color: '#b87459', background: '#efe0d6', description: 'Slip into something simple. A broad strap and contoured footbed for relaxed days.', sizes: '36–44' },
];
const electronics = [
  { name: 'NovaBook 14', price: 189900, icon: '▱', description: 'A fictional 14-inch laptop for your everyday workspace.' },
  { name: 'Nova Air', price: 24900, icon: 'Ω', description: 'Wireless headphones for a little more focus.' },
  { name: 'Desk Dock', price: 12900, icon: '▰', description: 'Keep your everyday connections in one place.' },
];
const shoePhotos = ['1542291026-7eec264c27ff', '1549298916-b41d501d3772', '1600185365926-3a2ce3cdb9eb', '1562183241-b937e95585b6', '1525966222134-fcfa99b8ae77', '1603487742131-4160ec999306'];
function Shoe({ color = shoes[0].color, hero = false }: { color?: string; sandal?: boolean; hero?: boolean }) {
  const index = Math.max(0, shoes.findIndex(shoe => shoe.color === color));
  return <Image unoptimized src={`https://images.unsplash.com/photo-${shoePhotos[index]}?auto=format&fit=crop&w=${hero ? 1200 : 700}&q=85`} alt={`Sample footwear photography for ${shoes[index].name}`} width={hero ? 1200 : 700} height={hero ? 1200 : 525} className={`shoe-photo${hero ? ' hero-shoe-photo' : ''}`} loading={hero ? 'eager' : 'lazy'} />;
}
export default function DemoStorefront({ company, enabled }: { company: DemoCompany; enabled: boolean }) {
  const configuration = demoCompanies[company];
  const { user, refreshSession } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('All');
  const [product, setProduct] = useState<(typeof shoes)[number] | null>(null);
  const opening = useRef(false);
  const isCustomer = user?.role === 'user' && user?.tenantId === configuration.tenantId;
  async function selectCustomer(id: string) {
    setSwitching(true); setError('');
    try { const res = await fetch('/api/demo/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company, customerId: id }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error); await refreshSession(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to select account.'); }
    finally { setSwitching(false); }
  }
  async function openAssistant() {
    setOpen(true);
    if (isCustomer || opening.current) return;
    opening.current = true;
    try { await selectCustomer(configuration.customers[0].id); }
    finally { opening.current = false; }
  }
  const accounts = <div className="demo-account"><span>Demo customer</span>{enabled ? <select aria-label="Select demo customer" disabled={busy || switching} value={isCustomer ? user.userId : ''} onChange={e => void selectCustomer(e.target.value)}><option value="" disabled>Select a customer</option>{configuration.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select> : <span>Support unavailable</span>}</div>;
  const panel = isCustomer ? <ChatPanel key={user.userId} company={company} customerId={user.userId} onBusy={setBusy} onClose={company === 'walkwave' ? () => setOpen(false) : undefined} /> : company === 'walkwave' ? <section className="chat-signin" aria-label="Walkwave assistant"><h3>Walkwave Assistant</h3>{error ? <><p role="alert">{error}</p><button className="store-button" onClick={() => void openAssistant()}>Try again</button></> : <p role="status">Opening your assistant…</p>}</section> : <section className="chat-signin" aria-label={`${configuration.name} assistant`}><h3>Your own orders.<br />Your own assistant.</h3>{enabled ? <><p>Choose a customer to check an order, ask about policies, or request an email right here.</p><label htmlFor={`${company}-chat-customer`}>Demo customer</label><select id={`${company}-chat-customer`} disabled={switching} value="" onChange={e => void selectCustomer(e.target.value)}><option value="" disabled>Select a customer</option>{configuration.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>{switching && <p role="status">Opening your assistant…</p>}{error && <p role="alert">{error}</p>}</> : <p>Our demo assistant is temporarily unavailable. Please try again later.</p>}</section>;
  if (company === 'nova') return <div className="nova-site demo-site">
    <div className="demo-banner">Fictional company · Enterprise API integration <Link href="/walkwave">Try Walkwave’s chat widget ↗</Link></div>
    <header className="store-nav"><Link className="nova-logo" href="/nova"><span>N</span> NOVA<span className="logo-sub">ELECTRONICS</span></Link><nav><a href="#nova-collection">Collection</a><a href="#nova-support">Customer care</a></nav>{accounts}</header>
    {error && <p role="alert" className="demo-error">{error}</p>}
    <main><section className="nova-hero"><span className="eyebrow">TECH THAT FITS YOUR WORLD</span><h1>Good technology.<br /><em>Better support.</em></h1><p>Meet your next everyday essentials. And a personal concierge that’s always one question away.</p><a href="#nova-support" className="store-button">Meet your concierge ↗</a><div className="nova-orbit" aria-hidden="true"><div className="laptop-art"><div className="laptop-screen"><span>N</span></div><div className="laptop-base" /></div><span className="device-caption">NOVABOOK 14 · A FRESH PERSPECTIVE</span></div></section>
      <section id="nova-collection" className="store-section"><div className="section-heading"><div><span className="eyebrow">THE EVERYDAY COLLECTION</span><h2>Less friction. More possibility.</h2></div><span>Sample catalogue · Prices in LKR</span></div><div className="nova-products">{electronics.map(p => <article key={p.name}><div className="device-icon" aria-hidden="true">{p.icon}</div><h3>{p.name}</h3><p>{p.description}</p><strong>LKR {p.price.toLocaleString('en-US')}</strong><a href="#nova-support">Ask the concierge ↗</a></article>)}</div></section>
      <section id="nova-support" className="nova-support store-section"><div><span className="eyebrow">CUSTOMER CARE, REIMAGINED</span><h2>Your answers.<br />In our own interface.</h2><p>This is Nova’s custom support experience. It connects to AgentForge through the enterprise API to answer policy questions and retrieve your personal order.</p><ul><li>14-day returns for eligible unused items</li><li>Delivery: LKR 450 · 3–5 business days after dispatch</li><li>Support: Monday–Friday, 9 a.m.–5 p.m.</li></ul><a href="/demo/Nova_Electronics_Policies.pdf" download>Download sample policy PDF ↓</a></div>{panel}</section>
    </main><footer className="store-footer"><strong>NOVA ELECTRONICS</strong><span>Fictional products and orders. No purchases or payments.</span><Link href="/walkwave">Walkwave widget demo ↗</Link></footer>
  </div>;
  return <div className="walkwave-site demo-site">
    <div className="demo-banner">Sri Lankan style. Every step, your way. <Link href="/nova">Explore the enterprise demo ↗</Link></div>
    <header className="store-nav"><Link href="/walkwave" className="walkwave-logo">walkwave<span>®</span></Link><nav><a href="#collection">Collection</a><a href="#our-story">Our story</a><a href="#policies">Delivery & returns</a></nav></header>
    {error && <p role="alert" className="demo-error">{error}</p>}
    <main><section className="walkwave-hero"><div className="hero-copy"><span className="eyebrow">MADE FOR YOUR EVERYDAY</span><h1>Find your<br />everyday <em>stride.</em></h1><p>From Colombo commutes to weekend wanderings. Meet comfortable styles for wherever your day takes you.</p><div className="hero-actions"><a className="store-button" href="#collection">Find your pair ↗</a><button onClick={() => void openAssistant()}>Track my order →</button></div><div className="hero-note"><span>01 / THE EVERYDAY EDIT</span><span>Thoughtful styles. Easy steps.</span></div></div><div className="hero-product"><span className="product-stamp">WALK YOUR<br />OWN WAY.</span><Shoe hero /><div className="hero-product-caption"><span>COAST RUNNER<br /><small>Everyday comfort / LKR 12,900</small></span><a href="#collection" aria-label="Explore Coast Runner">↗</a></div></div></section>
      <div className="store-benefits"><span>↗ Delivery across Sri Lanka</span><span>↔ 30-day eligible returns</span><span>◉ Personal order assistance</span></div>
      <section id="collection" className="store-section"><div className="section-heading"><div><span className="eyebrow">YOUR NEXT FAVOURITE PAIR</span><h2>A style for every kind of day.</h2></div><span>06 styles / All prices in LKR</span></div><div className="category-tabs" role="group" aria-label="Filter shoes">{['All', 'Everyday', 'Running', 'Walking', 'Outdoor', 'Sandals'].map(c => <button key={c} aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</button>)}</div><div className="shoe-grid">{shoes.filter(p => category === 'All' || p.category === category).map(p => <article key={p.name}><button className="product-image" style={{ background: p.background }} aria-label={`View ${p.name}`} onClick={() => setProduct(p)}><span>{p.category}</span><Shoe color={p.color} sandal={p.category === 'Sandals'} /><i>↗</i></button><div className="product-info"><div><h3>{p.name}</h3><p>EU {p.sizes} · Sample availability</p></div><strong>LKR {p.price.toLocaleString('en-US')}</strong></div></article>)}</div></section>
      <section id="our-story" className="brand-story"><span className="eyebrow">FROM HERE. FOR EVERYWHERE.</span><h2>Life moves.<br /><em>Move with it.</em></h2><p>Walkwave makes finding your next everyday pair simple. From morning walks and busy commutes to weekend plans, discover comfortable styles, useful size choices, and straightforward delivery across Sri Lanka.</p><button onClick={() => void openAssistant()}>Say hello to our assistant ↗</button><span className="story-watermark" aria-hidden="true">w.</span></section>
      <section id="policies" className="store-section policy-section"><div><span className="eyebrow">NO GUESSWORK NEEDED</span><h2>A little peace of mind<br />with every pair.</h2><a href="/demo/Walkwave_Policies.pdf" download>Download our sample policy PDF ↓</a></div><div className="policy-faq">{[['How does delivery work?', 'Colombo district: LKR 350, estimated 2–3 business days after dispatch. Other supported Sri Lankan areas: LKR 500, estimated 3–5 business days. Free standard delivery for merchandise subtotals of LKR 15,000 or more.'], ['Can I return or exchange my shoes?', 'Request a return or size exchange within 30 days of delivery. Shoes must be unused, with original packaging and tags. Exchanges are subject to stock.'], ['How do I check my order?', 'Open the assistant and ask about your order. It checks your own order records, including status, tracking reference, and delivery estimate.'], ['Can I get an email update?', 'Ask the assistant to email your shipping update. Include your email address in the request, or use the prepared demo inbox. The assistant sends your actual order information.']].map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>
    </main><footer className="store-footer"><strong className="walkwave-logo">walkwave</strong><span>Fictional Sri Lankan shoe company · Demo storefront · No checkout</span><Link href="/nova">Enterprise API demo ↗</Link></footer>
    {open && <div className="widget-panel">{panel}</div>}<button className="widget-launcher" aria-label={open ? 'Close Walkwave assistant' : 'Open Walkwave assistant'} aria-expanded={open} onClick={() => { if (open) setOpen(false); else void openAssistant(); }}>{open ? '×' : <><span>w.</span><i /></>}</button>
    {product && <div className="product-overlay" onClick={() => setProduct(null)}><section role="dialog" aria-modal="true" aria-label={product.name} className="product-modal" onClick={e => e.stopPropagation()}><button autoFocus aria-label="Close product details" onClick={() => setProduct(null)}>×</button><div style={{ background: product.background }}><Shoe color={product.color} /></div><span className="eyebrow">{product.category}</span><h2>{product.name}</h2><strong>LKR {product.price.toLocaleString('en-US')}</strong><p>{product.description}</p><p>EU sizes {product.sizes}. Sample catalogue — no purchase is processed.</p><button className="store-button" onClick={() => { setProduct(null); void openAssistant(); }}>Ask our assistant ↗</button></section></div>}
  </div>;
}
