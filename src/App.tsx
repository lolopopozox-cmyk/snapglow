import { useEffect } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

import Home from './pages/Home';
import Discover from './pages/Discover';
import Feed from './pages/Feed';
import Trending from './pages/Trending';
import Create from './pages/Create';
import CardPage from './pages/CardPage';
import Profile from './pages/Profile';
import PostPage from './pages/PostPage';
import Battles from './pages/Battles';
import BattleNew from './pages/BattleNew';
import BattlePage from './pages/BattlePage';
import BattleResults from './pages/BattleResults';
import Leaderboards from './pages/Leaderboards';
import HallOfFame from './pages/HallOfFame';
import Search from './pages/Search';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Guidelines from './pages/Guidelines';
import SignIn from './pages/SignIn';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:font-bold"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<SiteLayout />}>
            {/* 1  */}<Route index element={<Home />} />
            {/* 2  */}<Route path="discover" element={<Discover />} />
            {/* 3  */}<Route path="feed" element={<Feed />} />
            {/* 4  */}<Route path="trending" element={<Trending />} />
            {/* 5  */}<Route path="create" element={<Create />} />
            {/* 6  */}<Route path="cards/:id" element={<CardPage />} />
            {/* 7  */}<Route path="u/:username" element={<Profile />} />
            {/* 8  */}<Route path="posts/:id" element={<PostPage />} />
            {/* 9  */}<Route path="battles" element={<Battles />} />
            {/* 10 */}<Route path="battles/new" element={<BattleNew />} />
            {/* 11 */}<Route path="battles/:id" element={<BattlePage />} />
            {/* 12 */}<Route path="battles/:id/results" element={<BattleResults />} />
            {/* 13–19 */}<Route path="leaderboards" element={<Navigate to="/leaderboards/daily" replace />} />
            <Route path="leaderboards/:kind" element={<Leaderboards />} />
            {/* 20 */}<Route path="hall-of-fame" element={<HallOfFame />} />
            {/* 21 */}<Route path="search" element={<Search />} />
            {/* 22 */}<Route path="contact" element={<Contact />} />
            {/* 23 */}<Route path="privacy" element={<Privacy />} />
            {/* 24 */}<Route path="terms" element={<Terms />} />
            {/* 25 */}<Route path="guidelines" element={<Guidelines />} />
            {/* 26 */}<Route path="signin" element={<SignIn />} />
            {/* 27 */}<Route path="dashboard" element={<Dashboard />} />
            {/* 28 */}<Route path="admin" element={<Admin />} />
            {/* 29 */}<Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
