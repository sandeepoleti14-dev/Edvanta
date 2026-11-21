import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Award,
  EyeOff,
  Flame,
  MessageSquare,
  Minimize2,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';
import { CompanionAction, CompanionMood } from '../../shared/types';

export function ByteMascotSvg({
  mood,
  size = 44,
  tier = 1,
}: {
  mood: CompanionMood;
  size?: number;
  tier?: number;
}) {
  const animClass =
    mood === 'thinking'
      ? 'byte-anim-thinking'
      : mood === 'welcome'
      ? 'byte-anim-welcome'
      : mood === 'celebrating' || mood === 'achievement' || mood === 'streak' || mood === 'mastered'
      ? 'byte-anim-celebrating'
      : mood === 'encouraging'
      ? 'byte-anim-encouraging'
      : 'byte-anim-idle';

  const visorAccent =
    mood === 'celebrating' || mood === 'mastered'
      ? '#27C991'
      : mood === 'achievement' || mood === 'streak'
      ? '#F6B94A'
      : mood === 'encouraging'
      ? '#F6B94A'
      : mood === 'thinking'
      ? '#7055F7'
      : mood === 'welcome'
      ? '#35C9D8'
      : '#477BFF';

  const isJoyful =
    mood === 'celebrating' ||
    mood === 'achievement' ||
    mood === 'streak' ||
    mood === 'mastered' ||
    mood === 'welcome';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {(mood === 'celebrating' || mood === 'mastered') && (
        <span
          aria-hidden="true"
          className="byte-sparkle-pop absolute -top-2 -right-1 text-[#27C991] pointer-events-none"
        >
          <Sparkles className="h-4 w-4" />
        </span>
      )}
      {mood === 'achievement' && (
        <span
          aria-hidden="true"
          className="byte-sparkle-pop absolute -top-2 -right-1 text-[#F6B94A] pointer-events-none"
        >
          <Award className="h-4 w-4" />
        </span>
      )}
      {mood === 'streak' && (
        <span
          aria-hidden="true"
          className="byte-sparkle-pop absolute -top-2 -right-1 text-[#F6B94A] pointer-events-none"
        >
          <Flame className="h-4 w-4" />
        </span>
      )}
      <svg viewBox="0 0 64 64" width={size} height={size} className={animClass} aria-hidden="true">
        <defs>
          <linearGradient id="byte-edvanta-ring" x1="8" y1="45" x2="56" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7055F7" />
            <stop offset="50%" stopColor="#477BFF" />
            <stop offset="100%" stopColor="#35C9D8" />
          </linearGradient>
        </defs>

        {/* Tier 3+ Outer Resonance Halo */}
        {tier >= 3 && (
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="#35C9D8"
            strokeOpacity="0.3"
            strokeWidth="1.4"
            strokeDasharray="4 4"
          />
        )}

        {/* Antenna */}
        <line x1="32" y1="7" x2="32" y2="15" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
        <circle cx="32" cy="6" r={tier >= 4 ? 4.5 : 4} fill={visorAccent} />

        {/* Orbital ring in EDVANTA violet-blue-cyan */}
        <ellipse
          cx="32"
          cy="35"
          rx="26"
          ry="10"
          fill="none"
          stroke="url(#byte-edvanta-ring)"
          strokeOpacity={tier >= 2 ? '0.75' : '0.45'}
          strokeWidth={tier >= 2 ? '2.5' : '2'}
          transform="rotate(-14 32 35)"
        />

        {/* Bot head chassis */}
        <rect
          x="13"
          y="15"
          width="38"
          height="33"
          rx="11"
          fill="#14172B"
          stroke="#7055F7"
          strokeOpacity="0.65"
          strokeWidth="2"
        />

        {/* Side ear terminals */}
        <rect x="8" y="26" width="5" height="11" rx="2.5" fill="#7055F7" />
        <rect x="51" y="26" width="5" height="11" rx="2.5" fill="#35C9D8" />

        {/* Visor */}
        <rect x="18" y="21" width="28" height="16" rx="6" fill="#0B0E1C" stroke={visorAccent} strokeWidth="1.75" />

        {/* Expressive eyes */}
        {isJoyful ? (
          <>
            <path d="M22 29 Q25 24 28 29" fill="none" stroke={visorAccent} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M36 29 Q39 24 42 29" fill="none" stroke={visorAccent} strokeWidth="2.5" strokeLinecap="round" />
          </>
        ) : mood === 'thinking' ? (
          <>
            <circle cx="25" cy="28" r="2.6" fill="#7055F7" />
            <line x1="35" y1="28" x2="41" y2="28" stroke="#35C9D8" strokeWidth="2.4" strokeLinecap="round" />
          </>
        ) : mood === 'encouraging' ? (
          <>
            <circle cx="25" cy="29" r="2.5" fill="#F6B94A" />
            <circle cx="39" cy="29" r="2.5" fill="#F6B94A" />
          </>
        ) : (
          <>
            <circle cx="25" cy="29" r="2.8" fill="#477BFF" />
            <circle cx="39" cy="29" r="2.8" fill="#35C9D8" />
          </>
        )}

        {/* Mouth / Energy bar */}
        {isJoyful ? (
          <path d="M27 41 Q32 45 37 41" fill="none" stroke={visorAccent} strokeWidth="2.2" strokeLinecap="round" />
        ) : mood === 'encouraging' ? (
          <path d="M27 42 Q32 44 37 42" fill="none" stroke="#F6B94A" strokeWidth="2" strokeLinecap="round" />
        ) : (
          <line x1="27" y1="42" x2="37" y2="42" stroke="#7055F7" strokeWidth="2" strokeLinecap="round" />
        )}

        {/* Base thrusters */}
        <rect x="23" y="48" width="18" height="5" rx="2.5" fill="#212640" />
        <polygon points="28,53 36,53 32,59" fill={visorAccent} fillOpacity="0.88" />
      </svg>
    </div>
  );
}

const MOOD_LABELS: Record<CompanionMood, string> = {
  idle: 'Ready to help',
  welcome: 'Welcome back!',
  thinking: 'Thinking...',
  celebrating: 'Awesome answer!',
  encouraging: 'Keep going, you got this!',
  achievement: 'Achievement unlocked!',
  streak: 'Streak milestone!',
  mastered: 'Concept mastered!',
};

const DEFAULT_PROMPTS = [
  'What should I study next?',
  'Check my badges & streak',
  'Explain binary search complexity',
];

export function StudyCompanion() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    isOpen,
    setIsOpen,
    isHidden,
    setIsHidden,
    mood,
    reactionNote,
    activeConceptName,
    companionTier,
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

  if (isHidden) {
    return null;
  }

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
      void sendMessage(action.promptText, location.pathname);
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
          className="pointer-events-auto max-w-[295px] rounded-2xl border border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#181B2E] px-4 py-3 shadow-[var(--shadow-float)] flex items-start gap-2.5 text-xs text-[#14172B] dark:text-[#F4F6FF]"
        >
          <div className="flex-1 leading-relaxed font-friendly font-semibold">{reactionNote}</div>
          <button
            type="button"
            onClick={dismissReactionNote}
            aria-label="Dismiss companion message"
            className="text-[#6E7696] hover:text-[#14172B] dark:hover:text-white shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Expandable Companion Chat Drawer */}
      {isOpen && (
        <section
          aria-label="Byte Java DSA Study Companion Chat"
          className="pointer-events-auto w-[min(400px,calc(100vw-2rem))] rounded-2xl border border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#181B2E] shadow-[var(--shadow-float)] flex flex-col overflow-hidden"
          style={{ maxHeight: 'min(540px, calc(100vh - 6.5rem))' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 bg-[#14172B] dark:bg-[#0D1020] px-4 py-3 text-white border-b border-[#2B3150]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="rounded-xl bg-[#212640] p-1 shrink-0">
                <ByteMascotSvg mood={mood} size={38} tier={companionTier.tier} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-sm font-semibold text-white truncate">
                    Byte · {companionTier.title}
                  </h2>
                </div>
                <p className="text-xs text-[#B4BDD9] truncate font-friendly">
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
                className="rounded-lg p-1.5 text-[#B4BDD9] hover:bg-[#212640] hover:text-white transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsHidden(true)}
                aria-label="Hide study companion"
                title="Hide Byte (can re-enable in header or Settings)"
                className="rounded-lg p-1.5 text-[#B4BDD9] hover:bg-[#212640] hover:text-white transition-colors"
              >
                <EyeOff className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Minimize study companion"
                title="Minimize"
                className="rounded-lg p-1.5 text-[#B4BDD9] hover:bg-[#212640] hover:text-white transition-colors"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F6F7FC] dark:bg-[#111322]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#7055F7] text-white'
                      : 'bg-white dark:bg-[#181B2E] border border-[#E2E6F3] dark:border-[#2B3150] text-[#14172B] dark:text-[#F4F6FF] font-friendly'
                  }`}
                >
                  <p>{msg.text}</p>
                  {msg.sender === 'companion' && msg.actions && msg.actions.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-[#E2E6F3] dark:border-[#2B3150] flex flex-wrap gap-1.5 font-sans">
                      {msg.actions.map((action, idx) => (
                        <button
                          key={`${msg.id}-act-${idx}`}
                          type="button"
                          onClick={() => handleActionClick(action)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#7055F7]/30 bg-[#7055F7]/10 hover:bg-[#7055F7] hover:text-white px-2.5 py-1.5 text-xs font-medium text-[#7055F7] dark:text-[#A493FF] transition-colors"
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
                <div className="rounded-2xl bg-white dark:bg-[#181B2E] border border-[#E2E6F3] dark:border-[#2B3150] px-3.5 py-2.5 text-xs text-[#4E5674] dark:text-[#B4BDD9] font-friendly">
                  Byte is checking your workspace &amp; Java DSA notes...
                </div>
              </div>
            )}
            <div ref={scrollEndRef} />
          </div>

          {/* Dynamic Follow-Up Prompts */}
          <div className="border-t border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#181B2E] px-3 pt-2.5 pb-1.5 flex flex-wrap items-center gap-1.5">
            {activePrompts.map((q) => (
              <button
                key={q}
                type="button"
                disabled={sending}
                onClick={() => sendMessage(q, location.pathname)}
                className="rounded-lg border border-[#E2E6F3] dark:border-[#2B3150] bg-[#EEF1FA]/70 dark:bg-[#212640] hover:bg-[#E2E6F3] dark:hover:bg-[#272D4B] px-2.5 py-1 text-[11px] font-medium text-[#4E5674] dark:text-[#B4BDD9] transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#181B2E] p-3 flex items-center gap-2"
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask Byte about Java DSA..."
              aria-label="Ask Byte a Java DSA question"
              className="flex-1 rounded-xl border border-[#CBD3E8] dark:border-[#3C456D] bg-white dark:bg-[#111322] px-3 py-2 text-xs sm:text-sm text-[#14172B] dark:text-[#F4F6FF] placeholder:text-[#6E7696] focus:border-[#7055F7] focus:outline-none focus:ring-2 focus:ring-[#7055F7]/20"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              aria-label="Send message to Byte"
              className="rounded-xl bg-[#7055F7] hover:bg-[#5D42E6] p-2.5 text-white transition-colors disabled:opacity-50 shrink-0"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </section>
      )}

      {/* Floating Toggle Button + Quick Hide */}
      <div className="pointer-events-auto flex items-center gap-1.5">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsHidden(true)}
            aria-label="Hide Byte companion"
            title="Hide Byte"
            className="rounded-xl border border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#181B2E] hover:bg-[#EEF1FA] dark:hover:bg-[#212640] p-2.5 text-[#6E7696] hover:text-[#14172B] dark:hover:text-white shadow-[var(--shadow-card)] transition-colors"
          >
            <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Minimize Byte Study Companion' : 'Open Byte Study Companion'}
          className="flex items-center gap-2.5 rounded-2xl border border-[#E2E6F3] dark:border-[#2B3150] bg-white dark:bg-[#181B2E] hover:bg-[#F2F4FB] dark:hover:bg-[#212640] px-3 py-2 shadow-[var(--shadow-float)] transition-colors"
        >
          <ByteMascotSvg mood={mood} size={36} tier={companionTier.tier} />
          <div className="text-left pr-1">
            <p className="font-display text-xs font-semibold text-[#14172B] dark:text-[#F4F6FF] flex items-center gap-1.5 whitespace-nowrap">
              <span>Ask Byte</span>
              <MessageSquare className="h-3.5 w-3.5 text-[#7055F7]" aria-hidden="true" />
            </p>
            <p className="text-[11px] text-[#4E5674] dark:text-[#B4BDD9] leading-tight font-friendly whitespace-nowrap">
              {MOOD_LABELS[mood]}
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
