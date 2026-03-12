import { create } from "zustand";

type Message = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
};

type ChatState = {
  messages: Record<string, Message[]>;
  hasLoaded: Record<string, boolean>;

  setMessages: (conversationId: string, msgs: Message[]) => void;
  addMessage: (conversationId: string, msg: Message) => void;
  markLoaded: (conversationId: string) => void;
};

export const useChatStore = create<ChatState>((set) => ({
  messages: {},
  hasLoaded: {},

  setMessages: (conversationId, msgs) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: msgs,
      },
    })),

  addMessage: (conversationId, msg) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [
          ...(state.messages[conversationId] || []),
          msg,
        ],
      },
    })),

  markLoaded: (conversationId) =>
    set((state) => ({
      hasLoaded: {
        ...state.hasLoaded,
        [conversationId]: true,
      },
    })),
}));