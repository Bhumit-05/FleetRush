// src/components/AuthForm.js
'use client';
import { useState } from 'react';

export default function AuthForm({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const res = await fetch(`http://localhost:4000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      onAuthSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl">
      <h2 className="text-2xl font-bold text-center text-white mb-6">
        {isLogin ? 'LOG IN TO BATTLE' : 'CREATE COMMANDER ACCOUNT'}
      </h2>

      {error && (
        <div className="p-3 mb-4 text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Username
          </label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="Enter username"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 font-bold text-white uppercase tracking-wide bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-blue-800 rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all cursor-pointer"
        >
          {loading ? 'PROCESSING...' : isLogin ? 'ENTER LOBBY' : 'REGISTER ACCOUNT'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setError('');
          }}
          className="text-sm text-zinc-400 hover:text-white underline transition-colors cursor-pointer"
        >
          {isLogin ? "Don't have an account? Sign up" : 'Already registered? Log in'}
        </button>
      </div>
    </div>
  );
}