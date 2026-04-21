import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

// Pages & Components (will create next)
import AuthPage from './pages/AuthPage';
import MainLayout from './components/layout/MainLayout';
import ChatList from './pages/ChatList';
import ChatDetail from './pages/ChatDetail';
import CREAIPage from './pages/CREAIPage';
import LearningPage from './pages/LearningPage';
import CallLogsPage from './pages/CallLogsPage';
import NotesPage from './pages/NotesPage';
import ProfilePage from './pages/ProfilePage';
import HistoryPage from './pages/HistoryPage';

export const ThemeContext = createContext({
  theme: 'dark' as 'light' | 'dark',
  toggleTheme: () => {},
});

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        if (userDoc.exists()) {
          const userTheme = userDoc.data().theme || 'dark';
          setTheme(userTheme);
        }
        setUser(u);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), { theme: newTheme });
    }
  };

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-black text-white font-sans animate-pulse">CRE CONNECT</div>;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={theme === 'dark' ? 'dark' : ''}>
        <div className="min-h-screen transition-colors duration-300 dark:bg-black dark:text-neutral-200 bg-white text-neutral-900 font-sans">
          <BrowserRouter>
            <Routes>
              {!user ? (
                <>
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="*" element={<Navigate to="/auth" />} />
                </>
              ) : (
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Navigate to="/chats" />} />
                  <Route path="/chats" element={<ChatList />} />
                  <Route path="/chats/:id" element={<ChatDetail />} />
                  <Route path="/creai" element={<CREAIPage />} />
                  <Route path="/learning" element={<LearningPage />} />
                  <Route path="/calls" element={<CallLogsPage />} />
                  <Route path="/notes" element={<NotesPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="*" element={<Navigate to="/chats" />} />
                </Route>
              )}
            </Routes>
          </BrowserRouter>
        </div>
      </div>
    </ThemeContext.Provider>
  );
}
