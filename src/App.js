import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminLogin from './Components/Jsxfules/AdminLogin';
import AdminLayout from './Layouts/AdminLayout';
import DefaultLayout from './Layouts/DefaultLayout';
import Footer from './Components/Jsxfules/Footer';
import AdminGuard from './Components/Jsxfules/AdminGuard';
import UserGuard from './Components/Jsxfules/UserGuard';
import ScroolToTop from './Components/Jsxfules/ScroolToTop';


export default function App() {
  return (
    <Router>
      <ScroolToTop />
      <Routes>
        <Route path="/ItsmeAdmin/login" element={
          <UserGuard>
            <AdminLogin />
          </UserGuard>
        } />
        
        {/* ✅ Protect Admin Layout */}
        <Route
          path="/ItsmeAdmin/*"
          element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }
        />

        {/* ✅ Normal User Layout - exclude admin routes */}
        <Route path="/*" element={
          <UserGuard>
            <DefaultLayout />
          </UserGuard>
        } />
      </Routes>

      
    </Router>
  );
}
