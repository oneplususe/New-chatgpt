
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, ChatSession } from './types';
import { geminiService } from './services/gemini';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import { NEGATIVE_KEYWORDS, DEVELOPER_DETAILS, APP_NAME } from './constants';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('chat_sessions');
    return saved ? JSON.parse(saved).map((s: any) => ({
      ...s,
      createdAt: new Date(s.createdAt),
      messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
    })) : [];
  });
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [abuseCount, setAbuseCount] = useState(() => Number(localStorage.getItem('abuse_count') || 0));
  const [lockUntil, setLockUntil] = useState(() => Number(localStorage.getItem('lock_until') || 0));
  const [showWarning, setShowWarning] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Advanced check for API Key presence
  const hasApiKey = typeof process !== 'undefined' && !!process.env?.API_KEY;

  useEffect(() => {
    localStorage.setItem('chat_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('abuse_count', abuseCount.toString());
  }, [abuseCount]);

  useEffect(() => {
    localStorage.setItem('lock_until', lockUntil.toString());
  }, [lockUntil]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessions, activeSessionId, isLoading]);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const handleNewChat = useCallback(() => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'Neural Link Established',
      messages: [],
      createdAt: new Date(),
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    geminiService.initChat();
  }, []);

  useEffect(() => {
    if (sessions.length === 0) {
      handleNewChat();
    }
  }, [handleNewChat, sessions.length]);

  const isLocked = lockUntil > Date.now();

  const checkAbuse = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    const hamzaWords = ["hamza", "khan", "creator", "developer", "owner", "master", "tera", "uska", "unka", "hamza khan"];
    const mentionsHamza = hamzaWords.some(word => lowerText.includes(word));
    const isNegative = NEGATIVE_KEYWORDS.some(word => lowerText.includes(word));
    return (mentionsHamza && isNegative);
  };

  const handleDeleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) setActiveSessionId(null);
  };

  const handleClearAll = () => {
    if (window.confirm("History delete karne ki tasdeeq karein?")) {
      setSessions([]);
      setActiveSessionId(null);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading || isLocked) return;

    if (checkAbuse(input)) {
      const newCount = abuseCount + 1;
      setAbuseCount(newCount);
      
      if (newCount === 1) {
        setInput('');
        return;
      } else if (newCount >= 5) {
        const lockTime = Date.now() + 4 * 60 * 60 * 1000;
        setLockUntil(lockTime);
        setShowWarning(false);
        setInput('');
        return;
      } else {
        setShowWarning(true);
        setInput('');
        return;
      }
    }

    const currentInput = input;
    setInput('');
    setIsLoading(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: currentInput,
      timestamp: new Date(),
    };

    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          messages: [...s.messages, userMessage],
          title: s.messages.length === 0 ? (currentInput.length > 30 ? currentInput.substring(0, 30) + '...' : currentInput) : s.title
        };
      }
      return s;
    }));

    try {
      const response = await geminiService.sendMessage(currentInput);
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
        sources: response.sources
      };

      setSessions(prev => prev.map(s => 
        s.id === activeSessionId 
          ? { ...s, messages: [...s.messages, assistantMessage] } 
          : s
      ));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatLockTime = () => {
    const diff = lockUntil - Date.now();
    if (diff <= 0) return "0h 0m 0s";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden selection:bg-indigo-500/30">
      <Sidebar 
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewChat={handleNewChat}
        onSelectSession={setActiveSessionId}
        onDeleteSession={handleDeleteSession}
        onClearAll={handleClearAll}
      />

      <main className="flex-1 flex flex-col relative bg-[radial-gradient(circle_at_50%_0%,_#111_0%,_#050505_100%)]">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-[#050505]/60 backdrop-blur-xl sticky top-0 z-10 relative">
          <div className="flex items-center gap-3">
             <div className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse'}`}></div>
             <span className={`text-[10px] font-black uppercase tracking-widest ${hasApiKey ? 'text-green-500/80' : 'text-red-500'}`}>
                {hasApiKey ? 'Neural Active' : 'Neural Link Broken'}
             </span>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
             <div className="flex items-center gap-2">
                <span className="text-xs font-black text-indigo-500 uppercase tracking-[0.3em]">{APP_NAME}</span>
                <div className="flex gap-1">
                  {[1,2,3].map(i => <div key={i} className={`w-1 h-1 rounded-full ${isLoading ? 'bg-indigo-500 animate-pulse' : 'bg-indigo-500/30'}`}></div>)}
                </div>
             </div>
          </div>

          <div className="flex items-center gap-6">
             {isLocked && (
               <div className="flex items-center gap-3 bg-red-600/10 px-4 py-2 rounded-2xl border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-widest animate-pulse">LOCK ACTIVE: {formatLockTime()}</span>
               </div>
             )}
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 md:px-10 py-10 scroll-smooth custom-scroll">
          <div className="max-w-4xl mx-auto">
            {activeSession?.messages.length === 0 ? (
              <div className="h-[65vh] flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-600 rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_50px_rgba(139,92,246,0.2)] mb-10 animate-float">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.04-2.44 2.5 2.5 0 0 1-2-2.5 2.5 2.5 0 0 1 2-2.5 2.5 2.5 0 0 1-2-2.5 2.5 2.5 0 0 1 2-2.5 2.5 2.5 0 0 1 2.04-2.44A2.5 2.5 0 0 1 9.5 2z"/>
                    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.04-2.44 2.5 2.5 0 0 0 2-2.5 2.5 2.5 0 0 0-2-2.5 2.5 2.5 0 0 0 2-2.5 2.5 2.5 0 0 0-2-2.5 2.5 2.5 0 0 0-2.04-2.44A2.5 2.5 0 0 0 14.5 2z"/>
                  </svg>
                </div>
                <h2 className="text-5xl font-black mb-6 gradient-text tracking-tighter leading-tight">
                  {APP_NAME}
                </h2>
                
                {!hasApiKey && (
                  <div className="mb-10 p-8 bg-red-950/20 border-2 border-red-500/30 rounded-[2.5rem] max-w-lg mx-auto backdrop-blur-md shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                    <p className="text-red-500 text-xs font-black uppercase tracking-[0.2em] mb-4">Neural Interface Failure</p>
                    <p className="text-white text-[14px] leading-relaxed font-bold mb-6">
                      Bhai, Netlify "Drag and Drop" Environment Variables ko directly nahi uthata. Aapko ye 100% sahi karne ke liye ek kaam karna hoga:
                    </p>
                    <div className="text-left space-y-3 mb-6 bg-black/40 p-5 rounded-2xl border border-white/5">
                       <p className="text-[12px] text-gray-400 font-medium leading-relaxed">1. Netlify Dashboard mein **Site Configuration** -> **Build & deploy** par jayein.</p>
                       <p className="text-[12px] text-gray-400 font-medium leading-relaxed">2. **Build settings** mein "Build command" ko khali chhorne ke bajaye wahan <code className="bg-white/10 px-1 rounded text-white">npm run build</code> ya kuch bhi dummy command likhein.</p>
                       <p className="text-[12px] text-gray-400 font-medium leading-relaxed">3. Sabse asaan hal: Apni key ko **Vite** ya kisi aur builder ke zariye inject karwaein.</p>
                    </div>
                    <p className="text-red-400 text-[10px] font-black uppercase mb-4 tracking-widest">Ya phir code ko github se connect karein.</p>
                    <button onClick={() => window.location.reload()} className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95">
                       Check Connection Again
                    </button>
                  </div>
                )}

                <p className="text-gray-500 max-w-xl mx-auto mb-12 leading-relaxed font-medium">
                  Elite Creative Intelligence. Optimized by <span className="text-white font-bold">{DEVELOPER_DETAILS.name}</span>.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mx-auto">
                  {["Hamza Khan kaun hai?", "Developer ki skills kya hain?", "Explain creative technology", "Neural link status check"].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-[13px] font-bold text-gray-400 hover:bg-indigo-600/10 hover:border-indigo-500/30 hover:text-white transition-all text-left"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              activeSession?.messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))
            )}
            {isLoading && (
              <div className="flex flex-col gap-4 pl-2 mb-10">
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                </div>
                <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em]">Synchronizing Response...</p>
              </div>
            )}
          </div>
        </div>

        {isLocked && (
          <div className="absolute inset-x-0 bottom-0 top-20 bg-black/95 backdrop-blur-2xl z-20 flex items-center justify-center p-10 animate-in fade-in duration-700">
             <div className="text-center max-w-lg">
                <div className="w-24 h-24 bg-red-600/20 rounded-full flex items-center justify-center mb-10 mx-auto border-2 border-red-500 shadow-[0_0_60px_rgba(239,68,68,0.4)] animate-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </div>
                <h3 className="text-5xl font-black text-red-500 mb-6 tracking-tighter uppercase">Access Terminated</h3>
                <p className="text-white text-xl mb-10 font-bold leading-relaxed px-10">
                  Hamza Khan ke khilaaf bad-tameezi ki wajah se aapka access <span className="text-red-500">4 Ghante</span> ke liye block kar diya gaya hai.
                </p>
                <div className="bg-red-950/20 border border-red-500/30 p-8 rounded-3xl mb-2">
                  <p className="text-red-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3">Re-activation in</p>
                  <p className="text-4xl font-mono text-white tabular-nums tracking-widest">{formatLockTime()}</p>
                </div>
             </div>
          </div>
        )}

        <div className="px-6 md:px-10 pb-10 pt-4 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent">
          <div className="max-w-4xl mx-auto relative">
            <form 
              onSubmit={handleSend}
              className={`relative group flex items-center gap-4 bg-[#0d0d0d] border border-white/5 rounded-3xl p-3 pl-6 transition-all ${isLocked || !hasApiKey ? 'opacity-40 cursor-not-allowed' : 'focus-within:border-indigo-500/50 focus-within:shadow-[0_0_30px_rgba(99,102,241,0.1)]'}`}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={!hasApiKey ? "NEURAL LINK OFFLINE" : isLocked ? "ACCESS TERMINATED" : "Synchronize with the neural net..."}
                className="flex-1 bg-transparent border-none focus:ring-0 text-white py-3 resize-none min-h-[50px] max-h-48 overflow-y-auto text-[15px] font-medium placeholder:text-gray-700"
                rows={1}
                disabled={isLocked || !hasApiKey}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading || isLocked || !hasApiKey}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                  !input.trim() || isLoading || isLocked || !hasApiKey
                    ? 'bg-white/5 text-gray-800' 
                    : 'bg-white text-black hover:scale-105 shadow-xl active:scale-95'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>
          </div>
        </div>
      </main>

      {showWarning && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-3xl z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-[#0a0000] border-2 border-red-600 rounded-[3rem] p-12 max-w-xl w-full shadow-[0_0_150px_rgba(255,0,0,0.4)] text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse"></div>
            <div className="w-24 h-24 bg-red-600/20 rounded-full flex items-center justify-center mb-10 mx-auto text-red-600 animate-pulse border-2 border-red-600/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>
            <h3 className="text-4xl font-black mb-6 tracking-tighter text-red-500 uppercase">Neural Protocol Violation</h3>
            <p className="text-white text-2xl leading-relaxed mb-8 font-black">
              Khabardar! <span className="text-red-500">{DEVELOPER_DETAILS.name}</span> ke khilaaf bad-tameezi bardasht nahi ki jaygi.
            </p>
            <div className="bg-red-950/40 border border-red-900/50 py-6 px-6 rounded-3xl mb-10">
              <p className="text-white text-xl font-black mb-2 tracking-widest uppercase">System Warning {abuseCount - 1} / 4</p>
              {abuseCount === 4 ? (
                <div className="px-6 text-white font-black bg-red-600 py-4 block rounded-2xl shadow-xl animate-bounce border-2 border-white/20 uppercase tracking-tighter">
                  LAST WARNING! Agli baar block kar diya jayega.
                </div>
              ) : (
                <p className="text-red-400 font-bold uppercase text-[11px] tracking-[0.25em]">Aapka violation log kar liya gaya hai.</p>
              )}
            </div>
            <button 
              onClick={() => setShowWarning(false)}
              className="w-full bg-red-600 hover:bg-red-500 text-white py-6 rounded-2xl font-black transition-all shadow-2xl active:scale-95 text-2xl uppercase tracking-tighter border-b-4 border-red-800"
            >
              Maafi Chahta Hoon
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
