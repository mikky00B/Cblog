import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Category } from './pages/Category';
import { Web3Category } from './pages/Web3Category';
import { Article } from './pages/Article';
import { Search } from './pages/Search';
import { NotFound } from './pages/NotFound';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminPosts } from './pages/admin/AdminPosts';
import { PostEditor } from './pages/admin/PostEditor';
import { ProtectedAdmin } from './pages/admin/ProtectedAdmin';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminMedia } from './pages/admin/AdminMedia';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />
        <Route
          path="/category"
          element={
            <Layout>
              <Category />
            </Layout>
          }
        />
        <Route
          path="/category/:slug"
          element={
            <Layout>
              <Category />
            </Layout>
          }
        />
        <Route
          path="/web3"
          element={
            <Layout>
              <Web3Category />
            </Layout>
          }
        />
        <Route
          path="/article"
          element={
            <Layout>
              <Article />
            </Layout>
          }
        />
        <Route
          path="/article/:slug"
          element={
            <Layout>
              <Article />
            </Layout>
          }
        />
        <Route
          path="/search"
          element={
            <Layout>
              <Search />
            </Layout>
          }
        />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<ProtectedAdmin />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="posts" element={<AdminPosts />} />
            <Route path="posts/new" element={<PostEditor />} />
            <Route path="posts/:id/edit" element={<PostEditor />} />
            <Route path="media" element={<AdminMedia />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Route>
        <Route
          path="*"
          element={
            <Layout>
              <NotFound />
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
