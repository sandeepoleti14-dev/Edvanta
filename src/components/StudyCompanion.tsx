import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, MessageSquare, RotateCcw, Send, Sparkles, X } from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';
import { CompanionAction, CompanionMood } from '../../shared/types';

function VoltMascotSvg({ mood, size = 44 }: { mood: CompanionMood; size?: number }) {
  const animClass =
    mood === 'thinking'
      ? 'volt-anim-thinking'
      : mood === 'celebrating'
      ? 'volt-anim-celebrating'
      : mood === 'encouraging'
      ? 'volt-anim-encouraging'
      : 'volt-anim-idle';

  const visorAccent =
    mood === 'celebrating'
      ? '#16A34A'
      : mood === 'encouraging'
      ? '#D97706'
      : mood === 'thinking'
      ? '#8B6CFF'
      : '#526BFF';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {mood === 'celebrating' && (
        <span
          aria-hidden="true"
          className="volt-sparkle-pop absolute -top-2 -right-1 text-[#D97706] pointer-events-none"
        >
          <Sparkles className="h-4 w-4" />
        </span>
      )}
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        className={animClass}
        aria-hidden="true"
      >
        {/* Antenna */}
        <line x1="32" y1="7" x2="32" y2="15" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
        <circle cx="32" cy="6" r="4" fill={visorAccent} />

        {/* Orbital ring */}
        <ellipse
          cx="32"
          cy="35"
          rx="26"
          ry="10"
          fill="none"
          stroke={visorAccent}
          strokeOpacity="0.28"
          strokeWidth="2"
          transform="rotate(-14 32 35)"
        />

        {/* Bot head */}
        <rect x="13" y="15" width="38" height="33" rx="11" fill="#101827" stroke="#334155" strokeWidth="2" />

        {/* Side ear terminals */}
        <rect x="8" y="26" width="5" height="11" rx="2.5" fill="#475569" />
        <rect x="51" y="26" width="5" height="11" rx="2.5" fill="#475569" />

        {/* Visor */}
        <rect x="18" y="21" width="28" height="16" rx="6" fill="#0F172A" stroke={visorAccent} strokeWidth="1.75" />

        {/* Expressive eyes */}
        {mood === 'celebrating' ? (
          <>
            <path d="M22 29 Q25 24 28 29" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M36 29 Q39 24 42 29" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" />
          </>
        ) : mood === 'thinking' ? (
          <>
            <circle cx="25" cy="28" r="2.6" fill="#A78BFA" />
            <line x1="35" y1="28" x2="41" y2="28" stroke="#A78BFA" strokeWidth="2.4" strokeLinecap="round" />
          </>
        ) : mood === 'encouraging' ? (
          <>
            <circle cx="25" cy="29" r="2.5" fill="#FBBF24" />
            <circle cx="39" cy="29" r="2.5" fill="#FBBF24" />
          </>
        ) : (
          <>
            <circle cx="25" cy="29" r="2.8" fill="#60A5FA" />
            <circle cx="39" cy="29" r="2.8" fill="#60A5FA" />
          </>
        )}

        {/* Mouth / Energy bar */}
        {mood === 'celebrating' ? (
          <path d="M27 41 Q32 45 37 41" fill="none" stroke="#34D399" strokeWidth="2.2" strokeLinecap="round" />
        ) : mood === 'encouraging' ? (
          <path d="M27 42 Q32 44 37 42" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
        ) : (
          <line x1="27" y1="42" x2="37" y2="42" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        )}

        {/* Base thrusters */}
        <rect x="23" y="48" width="18" height="5" rx="2.5" fill="#334155" />
        <polygon points="28,53 36,53 32,59" fill={visorAccent} fillOpacity="0.8" />
      </svg>
    </div>
  );
}

const MOOD_LABELS: Record<CompanionMood, string> = {
  idle: 'Ready to help',
  thinking: 'Thinking...',
  celebrating: 'Awesome progress!',
  encouraging: 'Keep going, you got this!',
};

const DEFAULT_PROMPTS = [
  'What should I study next?',
  'Check my badges & streak',
  'Solve I for 12V and 4 ohms',
];

export function StudyCompanion() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    isOpen,
    setIsOpen,
    mood,
    reactionNote,
    activeConceptName,
    messages,
    sending,
    dismissReactionNote,
    sendMessage,
    clearChat,
  } = useCompanion();

  const [draft, setDraft] = useState('');
  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen && scrollEndRef.current) {
      scrollEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages.length, sending]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    const text = draft;
    setDraft('');
    await sendMessage(text, location.pathname);
  };

  const handleActionClick = (action: CompanionAction) => {
    if (action.type === 'navigate' && action.targetPath) {
      navigate(action.targetPath);
    } else if (action.type === 'prompt' && action.promptText) {
      sendMessage(action.promptText, location.pathname);
    }
  };

  const latestCompanionMsg = [...messages].reverse().find((m) => m.sender === 'companion');
  const activePrompts =
    latestCompanionMsg?.suggestedReplies && latestCompanionMsg.suggestedReplies.length > 0
      ? latestCompanionMsg.suggestedReplies
      : DEFAULT_PROMPTS;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-3 pointer-events-none">
      {/* Live Reaction Speech Bubble when Drawer is Closed */}
      {!isOpen && reactionNote && (
        <div
          role="status"
          className="pointer-events-auto max-w-[280px] rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg flex items-start gap-2.5 text-xs text-[#101827]"
        >
          <div className="flex-1 leading-relaxed">{reactionNote}</div>
          <button
            type="button"
            onClick={dismissReactionNote}
            aria-label="Dismiss companion message"
            className="text-slate-400 hover:text-slate-700 shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Expandable Companion Chat Drawer */}
      {isOpen && (
        <section
          aria-label="Volt Study Companion Chat"
          className="pointer-events-auto w-[min(390px,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white shadow-xl flex flex-col overflow-hidden"
          style={{ maxHeight: 'min(520px, calc(100vh - 6.5rem))' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 bg-[#101827] px-4 py-3 text-white">
            <div className="flex items-center gap-3 min-w-0">
              <div className="rounded-lg bg-slate-800/80 p-1 shrink-0">
                <VoltMascotSvg mood={mood} size={38} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-sm font-semibold text-white">Volt Study Companion</h2>
                </div>
                <p className="text-xs text-slate-300 truncate">
                  {MOOD_LABELS[mood]}
                  {activeConceptName ? ` · ${activeConceptName}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={clearChat}
                aria-label="Reset companion conversation"
                title="Reset conversation"
                className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close study companion"
                className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F5F7FC]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#526BFF] text-white'
                      : 'bg-white border border-slate-200 text-[#101827]'
                  }`}
                >
                  <p>{msg.text}</p>
                  {msg.sender === 'companion' && msg.actions && msg.actions.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {msg.actions.map((action, idx) => (
                        <button
                          key={`${msg.id}-act-${idx}`}
                          type="button"
                          onClick={() => handleActionClick(action)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#526BFF]/30 bg-[#526BFF]/8 hover:bg-[#526BFF] hover:text-white px-2.5 py-1.5 text-xs font-medium text-[#526BFF] transition-colors"
                        >
                          <span>{action.label}</span>
                          <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-xl bg-white border border-slate-200 px-3.5 py-2.5 text-xs text-slate-500">
                  Volt is checking your workspace &amp; Electricity notes...
                </div>
              </div>
            )}
            <div ref={scrollEndRef} />
          </div>

          {/* Dynamic Follow-Up Prompts */}
          <div className="border-t border-slate-100 bg-white px-3 pt-2.5 pb-1.5 flex flex-wrap items-center gap-1.5">
            {activePrompts.map((q) => (
              <button
                key={q}
                type="button"
                disabled={sending}
                onClick={() => sendMessage(q, location.pathname)}
                className="rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-3 flex items-center gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask Volt about formulas or circuits..."
              aria-label="Ask Volt a Physics question"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs sm:text-sm text-[#101827] focus:border-[#526BFF] focus:outline-none focus:ring-2 focus:ring-[#526BFF]/20"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              aria-label="Send message to Volt"
              className="rounded-lg bg-[#526BFF] hover:bg-[#4158E6] p-2.5 text-white transition-colors disabled:opacity-50 shrink-0"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </section>
      )}

      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Minimize Volt Study Companion' : 'Open Volt Study Companion'}
        className="pointer-events-auto flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 shadow-lg transition-colors"
      >
        <VoltMascotSvg mood={mood} size={36} />
        <div className="text-left pr-1">
          <p className="font-display text-xs font-semibold text-[#101827] flex items-center gap-1.5">
            <span>Ask Volt</span>
            <MessageSquare className="h-3.5 w-3.5 text-[#526BFF]" aria-hidden="true" />
          </p>
          <p className="text-[11px] text-slate-500 leading-tight">{MOOD_LABELS[mood]}</p>
        </div>
      </button>
    </div>
  );
}
