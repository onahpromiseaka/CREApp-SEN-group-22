import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { MessageSquare, Cpu, GraduationCap, Phone, FileText, MoreVertical, Users, Bell } from 'lucide-react';
import { useState, useContext } from 'react';
import { ThemeContext } from '../../App';
import { auth } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import SplashScreen from '../ui/SplashScreen';
import Logo from '../ui/Logo';

export default function MainLayout() {
  const [showMenu, setShowMenu] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useContext(ThemeContext);

  const isChatDetail = location.pathname.startsWith('/chats/');

  return (
    <SplashScreen>
      <div className={`flex flex-col h-[100dvh] font-sans ${theme === 'dark' ? 'dark' : ''}`}>
        {/* Header */}
        {!isChatDetail && (
          <header className="flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b dark:border-neutral-900 border-neutral-100 z-50 sticky top-0 shadow-sm">
            <div className="flex items-center gap-4">
              <Logo size={32} />
            </div>

            <div className="flex items-center gap-3">
              <button className="p-2.5 text-neutral-500 hover:text-black dark:hover:text-white rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all relative">
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-neutral-900 dark:bg-white rounded-full border-2 border-white dark:border-black" />
              </button>
              <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)} className="p-2.5 text-neutral-500 hover:text-black dark:hover:text-white rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all">
                  <MoreVertical size={20} />
                </button>
                
                <AnimatePresence>
                  {showMenu && (
                    <>
                      <div className="fixed inset-0" onClick={() => setShowMenu(false)} />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 mt-2 w-56 rounded-3xl shadow-2xl border dark:border-neutral-800 border-neutral-100 dark:bg-neutral-900 bg-white overflow-hidden z-[60] p-2"
                      >
                        {[
                          { label: 'Profile', path: '/profile' },
                          { label: 'History', path: '/history' },
                          { label: 'Settings', path: '/history', sub: ' (In Settings)' },
                        ].map((item) => (
                          <NavLink 
                            key={item.label} 
                            to={item.path} 
                            onClick={() => setShowMenu(false)}
                            className="flex items-center justify-between px-4 py-3 text-sm font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-2xl transition-colors"
                          >
                            {item.label}
                            {item.sub && <span className="text-[9px] opacity-40 uppercase ml-2">{item.sub}</span>}
                          </NavLink>
                        ))}
                        <button 
                          onClick={toggleTheme}
                          className="w-full text-left px-4 py-3 text-sm font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors rounded-2xl"
                        >
                          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                        </button>
                        <button 
                          onClick={() => auth.signOut()}
                          className="w-full text-left px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border-t dark:border-neutral-800 border-neutral-200 mt-1"
                        >
                          Logout
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0 md:max-w-3xl md:mx-auto md:w-full md:border-x dark:border-neutral-900 border-neutral-100 bg-white dark:bg-black">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

      {/* Bottom Nav */}
      {!isChatDetail && (
        <nav className="fixed bottom-0 left-0 right-0 h-16 dark:bg-black bg-white/80 backdrop-blur-xl border-t dark:border-neutral-900 border-neutral-100 flex items-center justify-around z-50 md:max-w-3xl md:mx-auto md:border-x">
          <NavItem to="/chats" icon={<MessageSquare size={22} />} label="Chats" />
          <NavItem to="/creai" icon={<Cpu size={22} />} label="CREAI" />
          <NavItem to="/learning" icon={<GraduationCap size={22} />} label="Learning" />
          <NavItem to="/calls" icon={<Phone size={22} />} label="Calls" />
          <NavItem to="/notes" icon={<FileText size={22} />} label="Notes" />
        </nav>
      )}
      </div>
    </SplashScreen>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        `flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
          isActive ? 'dark:text-white text-black' : 'text-neutral-500'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className={`p-1.5 rounded-2xl transition-all duration-300 ${isActive ? 'bg-neutral-100 dark:bg-neutral-800' : ''}`}>
            {icon}
          </div>
          <span className="text-[10px] font-medium mt-1 uppercase tracking-tighter">{label}</span>
        </>
      )}
    </NavLink>
  );
}
