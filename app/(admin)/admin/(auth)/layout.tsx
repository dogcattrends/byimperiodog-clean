import type { Metadata } from "next";

export const metadata: Metadata = {
 title: "Admin | Login",
 robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
 return (
 <div className="min-h-screen bg-[rgb(var(--admin-bg))] text-[rgb(var(--admin-text))]">
 <div className="mx-auto flex min-h-screen max-w-md items-center px-4 py-12 sm:px-6 lg:px-8">
 <div className="w-full">{children}</div>
 </div>
 </div>
 );
}
