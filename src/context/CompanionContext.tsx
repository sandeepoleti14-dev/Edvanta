import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CompanionAction, CompanionChatMessage, CompanionMood } from '../../shared/types';
import { apiFetch } from '../lib/api';

const HIDDEN_STORAGE_KEY = 'edvanta_volt_hidden';

export interface CompanionTierInfo {
  tier: number;
  title: string;
  unlockHint: string;
}

interface CompanionContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isHidden: boolean;
  setIsHidden: (hidden: boolean) => void;
  mood: CompanionMood;
  reactionNote: string | null;
  activeConceptName: string | undefined;
  setActiveConceptName: (name: string | undefined) => void;
  companionTier: CompanionTierInfo;
  setCompanionTier: (tier: CompanionTierInfo) => void;
  messages: CompanionChatMessage[];
  sending: boolean;
  triggerReaction: (mood: CompanionMood, note?: string, durationMs?: number) => void;
  dismissReactionNote: () => void;
  sendMessage: (text: string, currentPage?: string) => Promise<void>;
  clearChat: () => void;
}

const CompanionContext = createContext<CompanionContextValue | undefined>(undefined);

const INITIAL_MESSAGE: CompanionChatMessage = {
  id: 'welcome-volt',
  sender: 'companion',
  text: "Hi! I'm Volt, your adaptive EDVANTA study companion. Ask me about Class 10 Electricity formulas, solve a numerical, check your streak & badges, or jump right into any learning activity!",
  timestamp: new Date().toISOString(),
  source: 'fallback',
  mood: 'welcome',
  actions: [
    { label: 'Learning & Journey', type: 'navigate', targetPath: '/student/modules' },
    { label: 'Adaptive Practice', type: 'navigate', targetPath: '/student/practice' },
  ],
  suggestedReplies: [
    'What should I study next?',
    'Check my badges & streak',
    'Solve I for 12V and 4 ohms',
  ],
};

function readHiddenPref(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(HIDDEN_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function CompanionProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHiddenState] = useState<boolean>(() => readHiddenPref());
  const [mood, setMood] = useState<CompanionMood>('idle');
  const [reactionNote, setReactionNote] = useState<string | null>(null);
  const [activeConceptName, setActiveConceptName] = useState<string | undefined>(undefined);
  const [companionTier, setCompanionTier] = useState<CompanionTierInfo>({
    tier: 1,
    title: 'Scout Spark',
    unlockHint: 'Reach Level 3 to evolve Volt to Neural Guide.',
  });
  const [messages, setMessages] = useState<CompanionChatMessage[]>([INITIAL_MESSAGE]);
  const [sending, setSending] = useState(false);

  const moodTimerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (moodTimerRef.current !== null) {
      window.clearTimeout(moodTimerRef.current);
      moodTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearTimer();
  }, []);

  const setIsHidden = useCallback((hidden: boolean) => {
    setIsHiddenState(hidden);
    if (hidden) {
      setIsOpen(false);
    }
    try {
      window.localStorage.setItem(HIDDEN_STORAGE_KEY, hidden ? '1' : '0');
    } catch {
      // ignore storage errors
    }
  }, []);

  const triggerReaction = useCallback((nextMood: CompanionMood, note?: string, durationMs = 4200) => {
    clearTimer();
    setMood(nextMood);
    if (note) {
      setReactionNote(note);
    }
    if (nextMood !== 'idle' && durationMs > 0) {
      moodTimerRef.current = window.setTimeout(() => {
        setMood('idle');
        setReactionNote(null);
        moodTimerRef.current = null;
      }, durationMs);
    }
  }, []);

  const dismissReactionNote = useCallback(() => {
    setReactionNote(null);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([{ ...INITIAL_MESSAGE, timestamp: new Date().toISOString() }]);
    setMood('idle');
  }, []);

  const sendMessage = useCallback(
    async (rawText: string, currentPage?: string) => {
      const text = rawText.trim();
      if (!text || sending) return;

      const userMsg: CompanionChatMessage = {
        id: `u-${Date.now()}`,
        sender: 'user',
        text,
        timestamp: new Date().toISOString(),
      };

      const historySnapshot = [...messages, userMsg].slice(-6).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      setMessages((prev) => [...prev, userMsg]);
      setSending(true);
      clearTimer();
      setMood('thinking');

      try {
        const res = await apiFetch<{
          reply: string;
          source: 'gemini' | 'fallback';
          mood?: CompanionMood;
          actions?: CompanionAction[];
          suggestedReplies?: string[];
        }>('/api/student/companion/chat', {
          method: 'POST',
          body: JSON.stringify({
            message: text,
            currentPage,
            activeConceptName,
            history: historySnapshot,
          }),
        });

        const botMood: CompanionMood = res.mood ?? 'idle';
        const botMsg: CompanionChatMessage = {
          id: `c-${Date.now()}`,
          sender: 'companion',
          text: res.reply,
          timestamp: new Date().toISOString(),
          source: res.source,
          mood: botMood,
          actions: Array.isArray(res.actions) ? res.actions : [],
          suggestedReplies: Array.isArray(res.suggestedReplies) ? res.suggestedReplies : [],
        };
        setMessages((prev) => [...prev, botMsg]);
        triggerReaction(botMood === 'idle' ? 'celebrating' : botMood, undefined, 2400);
      } catch (err) {
        const errText = err instanceof Error ? err.message : 'Unable to reach Volt right now.';
        setMessages((prev) => [
          ...prev,
          {
            id: `c-err-${Date.now()}`,
            sender: 'companion',
            text: `I hit a quick circuit snag: ${errText}. Try asking again in a moment!`,
            timestamp: new Date().toISOString(),
            source: 'fallback',
            mood: 'encouraging',
          },
        ]);
        triggerReaction('encouraging', undefined, 2200);
      } finally {
        setSending(false);
      }
    },
    [activeConceptName, messages, sending, triggerReaction]
  );

  return (
    <CompanionContext.Provider
      value={{
        isOpen,
        setIsOpen,
        isHidden,
        setIsHidden,
        mood,
        reactionNote,
        activeConceptName,
        setActiveConceptName,
        companionTier,
        setCompanionTier,
        messages,
        sending,
        triggerReaction,
        dismissReactionNote,
        sendMessage,
        clearChat,
      }}
    >
      {children}
    </CompanionContext.Provider>
  );
}

export function useCompanion() {
  const ctx = useContext(CompanionContext);
  if (!ctx) throw new Error('useCompanion must be used within CompanionProvider');
  return ctx;
}
