import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function RecentHistory({ limit = 10, title = "Recently Played" }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const { data, error } = await supabase
          .from('listening_history')
          .select('*')
          .order('played_at', { ascending: false })
          .limit(limit);

        if (error) throw error;
        setHistory(data || []);
      } catch (error) {
        console.error('Error fetching history:', error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [limit]);

  if (loading) return <p className="text-zinc-500 text-sm">Loading tracks...</p>;

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl">
      <h3 className="text-white font-semibold text-lg mb-4">{title}</h3>
      {history.length === 0 ? (
        <p className="text-zinc-500 text-sm">No tracks played yet. Start streaming!</p>
      ) : (
        <ul className="space-y-3">
          {history.map((track) => (
            <li key={track.id || track.created_at} className="flex justify-between items-center text-zinc-300 hover:text-white transition">
              <div>
                <p className="font-medium text-sm text-white">{track.title}</p>
                <p className="text-xs text-zinc-400">{track.artist}</p>
              </div>
              <span className="text-xs text-zinc-600">
                {new Date(track.played_at || track.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}