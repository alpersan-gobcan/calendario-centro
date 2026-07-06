import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Calendario del Centro",
  description: "Gestor de reservas y efemérides",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-slate-50 text-slate-800 antialiased min-h-screen flex flex-col`}>
        <header className="bg-white shadow-sm sticky top-0 z-50 print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/logo.png" alt="Logo del Centro" width={48} height={48} className="object-contain" />
              <h1 className="text-2xl font-bold text-slate-700 hover:text-blue-600 transition-colors hidden sm:block">Calendario Escolar</h1>
            </Link>
            <nav className="flex gap-2 sm:gap-4">
              <Link href="/" className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-base sm:text-lg font-bold bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">Inicio</Link>
              <Link href="/reservar" className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-base sm:text-lg font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">Reservar</Link>
              <Link href="/admin" className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-base sm:text-lg font-bold text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">Admin</Link>
            </nav>
          </div>
        </header>
        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {children}
        </main>
        <footer className="bg-white border-t border-slate-200 py-6 mt-auto print:hidden">
          <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
            © {new Date().getFullYear()} Calendario del Centro.
          </div>
        </footer>
      </body>
    </html>
  );
}
