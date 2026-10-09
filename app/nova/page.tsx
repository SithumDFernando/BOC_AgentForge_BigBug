import DemoStorefront from '../components/demo/DemoStorefront';
import { demoEnabled } from '@/lib/demo-config';
import '../components/demo/demo.css';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Nova Electronics — Enterprise API demo' };
export default function Nova() { return <DemoStorefront company="nova" enabled={demoEnabled()} />; }
