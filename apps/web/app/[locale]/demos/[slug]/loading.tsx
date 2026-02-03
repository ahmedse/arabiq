/**
 * Demo Page Loading State
 */

export default function DemoLoading() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Loading 3D Tour</h2>
        <p className="text-gray-400">Preparing immersive experience...</p>
      </div>
    </div>
  );
}
