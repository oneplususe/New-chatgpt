
import React from 'react';
import { ChatSession } from '../types';
import { DEVELOPER_DETAILS, APP_NAME } from '../constants';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onClearAll: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, 
  activeSessionId, 
  onNewChat, 
  onSelectSession, 
  onDeleteSession,
  onClearAll 
}) => {
  return (
    <div className="w-80 bg-[#080808] border-r border-white/5 h-full flex flex-col p-6 overflow-hidden">
      <div className="flex items-center gap-4 mb-10 group cursor-default">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center font-black text-white shadow-2xl group-hover:scale-110 transition-transform duration-500">
          <span className="text-xl">H</span>
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tighter text-white leading-none">{APP_NAME}</h1>
          <p className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.2em] leading-none mt-1">Elite Intelligence</p>
        </div>
      </div>

      <button 
        onClick={onNewChat}
        className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-white text-black hover:bg-indigo-100 transition-all font-bold text-sm mb-4 shadow-xl active:scale-[0.98]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        New Session
      </button>

      <button 
        onClick={onClearAll}
        className="flex items-center justify-center gap-3 w-full py-3 rounded-2xl border border-red-900/30 text-red-500 hover:bg-red-500/10 transition-all font-bold text-[11px] uppercase tracking-widest mb-6 active:scale-[0.98]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
        Clear All History
      </button>

      <div className="flex-1 overflow-y-auto space-y-2 -mx-2 px-2 custom-scroll">
        <div className="flex items-center justify-between mb-2 px-2">
          <h3 className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Logs</h3>
          <span className="text-[10px] bg-white/5 text-gray-500 px-2 py-1 rounded-md font-bold">{sessions.length}</span>
        </div>
        {sessions.map((session) => (
          <div key={session.id} className="group relative">
            <button
              onClick={() => onSelectSession(session.id)}
              className={`w-full text-left p-4 pr-12 rounded-2xl text-[13px] transition-all relative overflow-hidden ${
                activeSessionId === session.id 
                  ? 'bg-gradient-to-r from-indigo-600/10 to-transparent border-l-4 border-indigo-500 text-white' 
                  : 'text-gray-500 hover:bg-white/5 border-l-4 border-transparent'
              }`}
            >
              <span className="truncate block font-semibold">{session.title}</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl text-gray-700 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-white/5">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/5 relative overflow-hidden group">
          <p className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.1em] mb-2">Developed By</p>
          <p className="text-sm font-bold text-white mb-0.5">{DEVELOPER_DETAILS.name}</p>
          <p className="text-[11px] text-gray-500 font-medium leading-tight">{DEVELOPER_DETAILS.role}</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
