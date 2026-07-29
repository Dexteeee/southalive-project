export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-paper text-ink">
            <h1 className="text-6xl font-display mb-4">404</h1>
            <p className="text-xl mb-8">Page Not Found</p>
            <a href="/" className="px-4 py-2 bg-brand text-ink rounded hover:bg-yellow-400 transition">
                Go Home
            </a>
        </div>
    );
}
