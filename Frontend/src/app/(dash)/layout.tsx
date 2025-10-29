export default function DashLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen">
            {/* Sidebar, Header, etc. */}
            {children}
        </div>
    );
}
