import Navbar from "@/components/Navbar";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main
        id="conteudo-principal"
        role="main"
        tabIndex={-1}
        className="min-h-[60vh] pt-20 sm:pt-24 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        {children}
      </main>
    </>
  );
}
