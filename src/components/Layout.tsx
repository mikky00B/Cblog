import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Moon, Menu } from 'lucide-react';

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleSearchClick = () => {
    navigate('/search');
  };

  return (
    <div className="bg-background text-on-background font-body-md antialiased min-h-screen flex flex-col selection:bg-surface-variant selection:text-on-surface-variant">
      {/* Top Navbar */}
      <header className="bg-background border-b border-outline-variant w-full sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-stack-sm max-w-container-max mx-auto">
          <Link to="/" className="font-display-lg-mobile md:font-display-lg tracking-tighter text-primary hover:opacity-80 transition-opacity">
            Clevermike Studio
          </Link>
          <nav className="hidden md:flex items-center gap-stack-md">
            <Link to="/engineering" className={`font-body-md hover:text-primary transition-colors duration-200 ${pathname === '/engineering' ? 'text-primary font-bold border-b-2 border-primary pb-1' : 'text-secondary'}`}>Engineering</Link>
            <Link to="/category" className={`font-body-md hover:text-primary transition-colors duration-200 ${pathname === '/category' ? 'text-primary font-bold border-b-2 border-primary pb-1' : 'text-secondary'}`}>Backend</Link>
            <Link to="/frontend" className={`font-body-md hover:text-primary transition-colors duration-200 ${pathname === '/frontend' ? 'text-primary font-bold border-b-2 border-primary pb-1' : 'text-secondary'}`}>Frontend</Link>
            <Link to="/devops" className={`font-body-md hover:text-primary transition-colors duration-200 ${pathname === '/devops' ? 'text-primary font-bold border-b-2 border-primary pb-1' : 'text-secondary'}`}>DevOps</Link>
            <Link to="/web3" className={`font-body-md hover:text-primary transition-colors duration-200 ${pathname === '/web3' ? 'text-primary font-bold border-b-2 border-primary pb-1' : 'text-secondary'}`}>Web3</Link>
            <Link to="/notes" className={`font-body-md hover:text-primary transition-colors duration-200 ${pathname === '/notes' ? 'text-primary font-bold border-b-2 border-primary pb-1' : 'text-secondary'}`}>Notes</Link>
          </nav>
          <div className="flex items-center gap-stack-sm">
            <button onClick={handleSearchClick} className="text-primary hover:opacity-80 transition-opacity p-unit">
              <Search className="w-5 h-5" />
            </button>
            <button className="text-primary hover:opacity-80 transition-opacity p-unit hidden md:block">
              <Moon className="w-5 h-5" />
            </button>
            <button className="text-primary hover:opacity-80 transition-opacity p-unit md:hidden">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav Pills (Only on home/smaller views) */}
      <div className="md:hidden flex overflow-x-auto gap-unit px-margin-mobile py-stack-sm border-b border-outline-variant hide-scrollbar bg-background sticky top-[69px] z-40">
        <Link to="/engineering" className="px-3 py-1.5 border border-outline-variant rounded-full font-label-caps text-label-caps text-secondary whitespace-nowrap bg-surface-variant text-on-surface-variant">Engineering</Link>
        <Link to="/category" className="px-3 py-1.5 border border-outline-variant rounded-full font-label-caps text-label-caps text-secondary whitespace-nowrap">Backend</Link>
        <Link to="/frontend" className="px-3 py-1.5 border border-outline-variant rounded-full font-label-caps text-label-caps text-secondary whitespace-nowrap">Frontend</Link>
        <Link to="/devops" className="px-3 py-1.5 border border-outline-variant rounded-full font-label-caps text-label-caps text-secondary whitespace-nowrap">DevOps</Link>
        <Link to="/web3" className="px-3 py-1.5 border border-outline-variant rounded-full font-label-caps text-label-caps text-secondary whitespace-nowrap">Web3</Link>
      </div>

      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-background border-t border-outline-variant mt-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-stack-lg max-w-container-max mx-auto">
          <div className="mb-stack-md md:mb-0 text-center md:text-left">
            <div className="font-display-lg-mobile md:font-headline-sm text-primary tracking-tighter">
              Clevermike Studio
            </div>
            <div className="text-secondary font-body-md mt-2">
              © 2024 Clevermike Studio. Built for the modern architect.
            </div>
          </div>
          <nav className="flex gap-stack-md">
            <Link to="/rss" className="text-secondary font-label-caps text-label-caps hover:text-primary transition-colors duration-200">RSS Feed</Link>
            <Link to="/archive" className="text-secondary font-label-caps text-label-caps hover:text-primary transition-colors duration-200">Archive</Link>
            <Link to="/privacy" className="text-secondary font-label-caps text-label-caps hover:text-primary transition-colors duration-200">Privacy</Link>
            <Link to="/terms" className="text-secondary font-label-caps text-label-caps hover:text-primary transition-colors duration-200">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
