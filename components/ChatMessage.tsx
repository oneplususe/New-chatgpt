
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex w-full mb-10 ${isAssistant ? 'justify-start' : 'justify-end animate-in fade-in slide-in-from-bottom-4 duration-500'}`}>
      <div className={`flex max-w-[95%] md:max-w-[80%] ${isAssistant ? 'flex-row' : 'flex-row-reverse'} gap-5`}>
        <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs shadow-xl transition-all duration-300 ${
          isAssistant 
            ? 'bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white border border-white/20' 
            : 'bg-white/5 text-white/50 border border-white/10'
        }`}>
          {isAssistant ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          )}
        </div>
        
        <div className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'} w-full`}>
          <div className={`p-6 rounded-3xl text-[15px] leading-relaxed shadow-2xl transition-all w-fit ${
            isAssistant 
              ? 'bg-[#111111] text-slate-200 border border-white/5 rounded-tl-none' 
              : 'bg-violet-600/10 text-white border border-violet-500/20 rounded-tr-none'
          }`}>
            <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/5">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>

            {isAssistant && message.sources && message.sources.length > 0 && (
              <div className="mt-6 pt-4 border-t border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-violet-400 mb-3">Verified Sources</p>
                <div className="flex flex-wrap gap-2">
                  {message.sources.map((source, i) => (
                    <a 
                      key={i} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[11px] bg-white/5 hover:bg-white/10 border border-white/5 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-all flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                      <span className="max-w-[150px] truncate">{source.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          <span className="text-[10px] text-gray-700 mt-2 font-black uppercase tracking-widest px-1">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
