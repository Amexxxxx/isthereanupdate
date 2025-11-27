"use client"

import { useState, useEffect, useCallback } from "react";
import { Search, RefreshCw, Terminal, X } from "lucide-react";
import { GameCard } from "./components/GameCard";
import { motion, AnimatePresence } from "framer-motion";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface Game {
  name: string;
  accentColor: string;
  version: string;
  lastUpdated: string;
  description: string;
  sources: { name: string; url: string }[];
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAiHovered, setIsAiHovered] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch('/api/games');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setGames(data);
    } catch (error) {
      console.error("Error fetching games:", error);
      // Fallback data if API fails
      setGames([
        {
          name: "Fortnite",
          accentColor: "blue",
          version: "Checking...",
          lastUpdated: "Pending",
          description: "Fetching latest data...",
          sources: [{ name: "fortnite.com", url: "#" }]
        },
        {
          name: "Valorant",
          accentColor: "red",
          version: "11.10",
          lastUpdated: "November 11, 2025",
          description: "The absolute latest current live game client version for Valorant...",
          sources: [{ name: "playvalorant.com", url: "#" }]
        },
        {
          name: "Rust",
          accentColor: "orange",
          version: "Checking...",
          lastUpdated: "Pending",
          description: "Fetching latest data...",
          sources: [{ name: "rust.facepunch.com", url: "#" }]
        },
        {
          name: "Apex Legends",
          accentColor: "red",
          version: "23.1.0",
          lastUpdated: "November 21, 2025",
          description: "Apex Legends latest patch...",
          sources: [{ name: "ea.com", url: "#" }]
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const handleForceUpdate = useCallback(async () => {
    setIsUpdating(true);
    setLogs(['Initiating update check...']);
    setShowLogs(true);
    try {
      const res = await fetch('/api/update');
      const data = await res.json();
      
      if (data.logs) {
        setLogs(prev => [...prev, ...data.logs]);
      }
      
      if (data.success) {
        setLogs(prev => [...prev, 'Update complete. Refreshing data...']);
        await fetchGames();
      } else {
        setLogs(prev => [...prev, `Error: ${data.error || 'Unknown error'}`]);
      }
    } catch (err) {
      console.error("Update failed:", err);
      setLogs(prev => [...prev, 'Network error occurred.']);
    } finally {
      setIsUpdating(false);
    }
  }, [fetchGames]);

  useEffect(() => {
    const hasChecked = localStorage.getItem('hasCheckedUpdates');
    if (!hasChecked) {
      handleForceUpdate();
      localStorage.setItem('hasCheckedUpdates', 'true');
    }
  }, [handleForceUpdate]);

  const filteredGames = games.filter(game => 
    game.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full bg-[#050505] flex flex-col items-center py-20 px-4 sm:px-6 lg:px-8 relative overflow-x-hidden">
      
      {/* Header Section */}
      <div className="text-center mb-12 max-w-3xl w-full">
        
        <div className="relative inline-block mb-4">
          <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight relative z-10">
            isthereanupdate
          </h1>
          {/* Hand-drawn underline animation */}
          <svg
            className="absolute -bottom-2 left-0 w-full h-4 pointer-events-none z-0 overflow-visible"
            viewBox="0 0 300 15"
            preserveAspectRatio="none"
          >
            <motion.path
              d="M 5 10 Q 150 20 295 5"
              fill="transparent"
              stroke="#ef4444" // Red color
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            />
          </svg>
        </div>
        
        <p className="text-zinc-400 text-lg mb-2">
          Real-time live patch tracking powered by{" "}
          <span 
            className="text-zinc-200 font-semibold cursor-help transition-colors hover:text-white"
            onMouseEnter={() => setIsAiHovered(true)}
            onMouseLeave={() => setIsAiHovered(false)}
          >
            ChatGPT
          </span>.
        </p>
        
        <p className="text-zinc-500 text-sm mb-8">
          Checking official sources for <span className="text-zinc-300 font-medium">Fortnite</span>, <span className="text-zinc-300 font-medium">Valorant</span>, <span className="text-zinc-300 font-medium">Rust</span>, and <span className="text-zinc-300 font-medium">Apex</span>.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-md mx-auto mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-zinc-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-white/5 text-zinc-300 placeholder-zinc-500 focus:outline-none focus:bg-white/10 focus:ring-1 focus:ring-white/20 focus:border-white/20 sm:text-sm transition-all duration-200"
            placeholder="Search for a game..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute inset-0 rounded-xl pointer-events-none ring-1 ring-white/10"></div>
        </div>

        {/* Force Update Button */}
        <div className="flex justify-center gap-4">
          <button
            onClick={handleForceUpdate}
            disabled={isUpdating}
            className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isUpdating ? 'animate-spin' : ''}`} />
            {isUpdating ? 'Scanning official sources...' : 'Force Update Check'}
          </button>
          
          {logs.length > 0 && (
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              <Terminal className="w-3 h-3" />
              {showLogs ? 'Hide Logs' : 'Show Logs'}
            </button>
          )}
        </div>

        {/* Logs Terminal */}
        <AnimatePresence>
          {showLogs && logs.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 overflow-hidden w-full max-w-md mx-auto"
            >
              <div className="bg-[#0A0A0A] border border-white/10 rounded-lg p-4 text-left font-mono text-xs text-zinc-400 shadow-xl">
                <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-2">
                  <span className="font-bold text-zinc-300">System Logs</span>
                  <button onClick={() => setShowLogs(false)} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto no-scrollbar">
                  {logs.map((log, i) => (
                    <div key={i} className="break-words">
                      <span className="text-zinc-600 mr-2">{`>`}</span>
                      {log}
                    </div>
                  ))}
                  {isUpdating && (
                    <div className="animate-pulse">
                      <span className="text-zinc-600 mr-2">{`>`}</span>
                      Processing...
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Grid Section - Reduced max-w from 6xl to 5xl for smaller cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-5xl">
        {loading ? (
          <div className="col-span-1 lg:col-span-2 text-center py-12">
            <p className="text-zinc-500 animate-pulse">Loading latest patch data...</p>
          </div>
        ) : (
          <>
            {filteredGames.map((game) => (
              <GameCard
                key={game.name}
                {...game}
              />
            ))}
            {filteredGames.length === 0 && (
              <div className="col-span-1 lg:col-span-2 text-center py-12">
                <p className="text-zinc-500">No games found matching "{searchQuery}"</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Waving Hand Animation */}
      <AnimatePresence>
        {isAiHovered && (
          <motion.div
            initial={{ y: "100%" }} // Start fully off-screen at the bottom
            animate={{ 
              y: 0, 
            }}
            exit={{ y: "100%" }} // Slide back down fully
            transition={{ 
              type: "spring", 
              stiffness: 180, // Slightly less stiff for a smoother slide
              damping: 20
            }}
            className="fixed -bottom-24 right-8 z-50 pointer-events-none" // Positioned at the bottom edge
            style={{ width: '400px', height: '400px' }} // Significantly bigger size
          >
            <DotLottieReact
              src="https://lottie.host/6601372b-b2c2-4d47-a3a8-c7eef0f87f08/qaYWaoAXX6.lottie"
              loop
              autoplay
            />
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
