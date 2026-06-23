'use client';

export default function MatchmakerQueue({ onCancel }) {
  return (
    <div className="max-w-sm w-full">
      <div className="text-center space-y-4 p-8 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl">
        <div className="relative flex items-center justify-center w-16 h-16 mx-auto mb-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        <h2 className="text-xl font-bold tracking-wide uppercase text-emerald-400">Searching for Opponent</h2>
        <p className="text-sm text-zinc-400">Scanning real-time matching instances...</p>
      </div>
      
      <button
        onClick={onCancel}
        className="w-full mt-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold uppercase tracking-widest text-rose-400 hover:text-rose-300 rounded-lg transition-all cursor-pointer shadow-md">
        Cancel Search
      </button>
    </div>
  );
}