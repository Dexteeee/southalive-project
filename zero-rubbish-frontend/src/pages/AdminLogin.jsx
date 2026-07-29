import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminLogin() {
    // Get the login function from the authentication context
    const { login } = useAuth();

    const navigate = useNavigate();
    // Get the location object to determine where the user was trying to go before being redirected to login
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // After login, return coordinator to wherever they were trying to go
    const from = location.state?.from?.pathname ?? '/admin/dashboard';

    async function handleSubmit(e) {
        // Prevent the default form submission behavior
        e.preventDefault();
        setError('');
        // Set loading state to true to indicate that the login process has started
        setLoading(true);

        // Simulate an API call for login
        try {
            // --- MOCK LOGIN ---
            // Replace this block with a real API call once API endpoint is ready:
            // const { data } = await apiClient.post('/auth/login', { email, password });
            // login(data.token, { name: data.name });
            
            // Simulate a delay to mimic an API call
            await new Promise((resolve) => setTimeout(resolve, 600));

            // For demonstration purposes, we are using a mock token and user data
            if (!email || !password) throw new Error('Please enter your email and password.');
            login('mock-jwt-token', { name: email });
            // --- END MOCK ---
            // Navigate to the page the user was trying to access before login, or to the dashboard if none
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            // Reset loading state to false after the login process is complete
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-paper flex items-center justify-center px-4">
            <div className="w-full max-w-sm bg-white border border-line rounded-md p-8">

                {/* Header */}
                <div className="mb-6">
                    <p className="text-xs text-ink/50 uppercase tracking-widest mb-1">South Alive</p>
                    <h1 className="text-xl font-display font-semibold text-ink">Coordinator login</h1>
                </div>

                {/* Form */}
                {/* The form submission is handled by the handleSubmit function defined above */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="email" className="text-sm font-medium text-ink">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="coordinator@southalive.org.nz"
                            className="rounded-sm border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-adopted/40"
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="password" className="text-sm font-medium text-ink">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="rounded-sm border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-adopted/40"
                            required
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-600">{error}</p>
                    )}

                    <button
                        type="submit"
                        // Disable the button while loading to prevent multiple submissions
                        disabled={loading}
                        className="mt-2 rounded-sm bg-brand text-ink font-medium py-2 text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Logging in...' : 'Log in'}
                    </button>
                </form>

            </div>
        </div>
    );
}