import Link from 'next/link';

export default function LoginSelectionPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-6 bg-surface">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-display-sm font-bold text-on-surface tracking-tight mb-4">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">AgentForge</span>
        </h1>
        <p className="text-body-lg text-on-surface-variant max-w-lg mx-auto">
          Please select your account type to proceed to the appropriate login portal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
        {/* End User Portal */}
        <Link href="/portal/login" className="group block">
          <div className="h-full bg-surface-container-lowest border border-outline-variant/30 p-8 rounded-3xl shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 shadow-sm group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[28px]">account_circle</span>
            </div>
            <h2 className="text-headline-sm font-semibold text-on-surface mb-3">End User Portal</h2>
            <p className="text-body-md text-on-surface-variant mb-6">
              Access your company's secure AI agent to ask questions, check policies, and resolve HR/IT requests.
            </p>
            <div className="flex items-center text-primary font-label-ui font-semibold gap-1 group-hover:gap-2 transition-all">
              <span>Go to Portal</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </div>
          </div>
        </Link>

        {/* Business Admin Portal */}
        <Link href="/admin/login" className="group block">
          <div className="h-full bg-surface-container-lowest border border-outline-variant/30 p-8 rounded-3xl shadow-sm hover:shadow-xl hover:border-secondary/30 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="w-14 h-14 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center mb-6 shadow-sm group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[28px]">admin_panel_settings</span>
            </div>
            <h2 className="text-headline-sm font-semibold text-on-surface mb-3">Tenant Admin</h2>
            <p className="text-body-md text-on-surface-variant mb-6">
              Manage your company's users, upload Knowledge Base documents, and monitor AI analytics & billing.
            </p>
            <div className="flex items-center text-secondary font-label-ui font-semibold gap-1 group-hover:gap-2 transition-all">
              <span>Admin Login</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </div>
          </div>
        </Link>

        {/* Platform Ops Portal */}
        <Link href="/ops/login" className="group block">
          <div className="h-full bg-surface-container-lowest border border-outline-variant/30 p-8 rounded-3xl shadow-sm hover:shadow-xl hover:border-tertiary/30 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="w-14 h-14 rounded-2xl bg-tertiary/10 text-tertiary flex items-center justify-center mb-6 shadow-sm group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[28px]">terminal</span>
            </div>
            <h2 className="text-headline-sm font-semibold text-on-surface mb-3">Platform Ops</h2>
            <p className="text-body-md text-on-surface-variant mb-6">
              Global system monitoring, multi-tenant fleet management, and deep architectural telemetry.
            </p>
            <div className="flex items-center text-tertiary font-label-ui font-semibold gap-1 group-hover:gap-2 transition-all">
              <span>Ops Login</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
