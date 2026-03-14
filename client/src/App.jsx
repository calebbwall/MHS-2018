import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Pages
import Landing          from './pages/Landing';
import Login            from './pages/Login';
import Register         from './pages/Register';
import PendingApproval  from './pages/PendingApproval';
import Directory        from './pages/Directory';
import Profile          from './pages/Profile';
import EditProfile      from './pages/EditProfile';
import Messages         from './pages/Messages';
import Conversation     from './pages/Conversation';
import Events           from './pages/Events';
import EventDetail      from './pages/EventDetail';
import ClassMap         from './pages/ClassMap';
import LostClassmates   from './pages/LostClassmates';

// Admin pages
import AdminDashboard     from './pages/admin/AdminDashboard';
import AdminUsers         from './pages/admin/AdminUsers';
import AdminEvents        from './pages/admin/AdminEvents';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.is_approved) return <Navigate to="/directory" replace />;
  if (user) return <Navigate to="/pending" replace />;
  return <Landing />;
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public */}
          <Route path="/"         element={<RootRedirect />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pending"  element={<PendingApproval />} />

          {/* Protected (approved users) */}
          <Route path="/directory"                         element={<ProtectedRoute><Directory /></ProtectedRoute>} />
          <Route path="/profile/edit"                      element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
          <Route path="/profile/:id"                       element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/messages/inbox"                    element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/messages/conversation/:userId"     element={<ProtectedRoute><Conversation /></ProtectedRoute>} />
          <Route path="/events"                            element={<ProtectedRoute><Events /></ProtectedRoute>} />
          <Route path="/events/:id"                        element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
          <Route path="/map"                               element={<ProtectedRoute><ClassMap /></ProtectedRoute>} />
          <Route path="/lost"                              element={<ProtectedRoute><LostClassmates /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin"               element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/users"         element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/events"        element={<AdminRoute><AdminEvents /></AdminRoute>} />
          <Route path="/admin/announcements" element={<AdminRoute><AdminAnnouncements /></AdminRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
