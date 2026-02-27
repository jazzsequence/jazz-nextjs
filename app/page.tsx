export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="text-center text-white p-8">
        <h1 className="text-6xl font-bold mb-4">Jazz Next.js</h1>
        <p className="text-2xl mb-2">✅ Deployment Successful</p>
        <p className="text-lg opacity-90">
          Build: {new Date().toISOString()}
        </p>
        <p className="text-sm opacity-75 mt-4">
          Next.js 16.1.6 • React 19 • Node 24.13.0
        </p>
      </div>
    </div>
  );
}