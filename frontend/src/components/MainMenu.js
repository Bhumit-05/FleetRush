'use client';

export default function MainMenu({ user, onEnterQueue }) {
  return (
    <div className="text-center space-y-6 max-w-sm w-full p-6 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">WELCOME, {user.username.toUpperCase()}</h1>
        <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Combat Statistics</p>
      </div>

      <div className="grid grid-cols-2 gap-4 bg-zinc-950 p-4 border border-zinc-800 rounded-lg">
        <div className="text-center">
          <span className="block text-2xl font-black text-emerald-400">{user.wins}</span>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Victories</span>
        </div>
        <div className="text-center">
          <span className="block text-2xl font-black text-rose-400">{user.losses}</span>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Defeats</span>
        </div>
      </div>

      <button
        onClick={onEnterQueue}
        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 font-bold uppercase tracking-widest text-sm rounded-lg shadow-lg hover:shadow-emerald-500/10 transition-all cursor-pointer">
        FIND ONLINE MATCH
      </button>
    </div>
  );
}