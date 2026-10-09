import Link from 'next/link';
export default function Pricing() {
  return <div className="max-w-3xl w-full mx-auto px-6 py-16 text-on-surface"><h1 className="text-4xl font-semibold">Plans</h1><p className="text-on-surface-variant mt-4 leading-relaxed">Pricing and subscriptions are not part of this hackathon prototype. Explore the working website integrations and company admin tools.</p><Link href="/docs" className="inline-block text-primary underline mt-6">Integration guide</Link></div>;
}
