import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function PendingApproval() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="text-6xl mb-6">⏳</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Account Pending Approval</h1>
        <p className="text-gray-600 mb-2">
          Thanks for signing up, <strong>{user?.full_name || 'Bulldog'}</strong>!
        </p>
        <p className="text-gray-500 text-sm mb-8">
          Your account is awaiting approval from the class administrator.
          You'll receive an email at <strong>{user?.email}</strong> as soon as you're approved.
        </p>
        <div className="card p-6 text-left mb-6">
          <h2 className="font-semibold text-gray-800 mb-2">What happens next?</h2>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>1. An admin reviews your registration</li>
            <li>2. You'll get an email when approved</li>
            <li>3. Log back in to access the full hub</li>
          </ul>
        </div>
        <button onClick={handleLogout} className="btn-ghost text-gray-500">
          Log Out
        </button>
      </div>
    </div>
  );
}
