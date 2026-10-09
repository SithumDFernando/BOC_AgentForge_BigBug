import DemoStorefront from '../components/demo/DemoStorefront';
import { demoEnabled } from '@/lib/demo-config';
import '../components/demo/demo.css';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Walkwave — Every step, your way' };
export default function Walkwave() { return <DemoStorefront company="walkwave" enabled={demoEnabled()} />; }
