import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search, Send, Maximize2, Minimize2, Check, CheckCheck, Clock,
  Smile, ArrowRight, Circle, X,
  UserPlus, Users, Sparkles, Loader2, MessageSquare
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/layouts/AppLayout';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import {
  messagesService, ConversationItem, MessageItem, UserSearchResult
} from '@/services/messagesService';
import { websocketService } from '@/services/websocketService';
import { api } from '@/lib/api';

function isSameDay(d1?: number | string, d2?: number | string): boolean {
  if (!d1 || !d2) return false;
  const num1 = Number(d1);
  const num2 = Number(d2);
  if (isNaN(num1) || isNaN(num2)) return false;
  const date1 = new Date(num1 < 1e11 ? num1 * 1000 : num1);
  const date2 = new Date(num2 < 1e11 ? num2 * 1000 : num2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function formatMessageDateHeader(timestamp?: number | string): string {
  if (!timestamp) return 'اليوم';
  const num = Number(timestamp);
  const timeMs = num < 1e11 ? num * 1000 : num;
  const date = new Date(timeMs);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date.getTime(), today.getTime())) {
    return 'اليوم';
  }
  if (isSameDay(date.getTime(), yesterday.getTime())) {
    return 'أمس';
  }

  return date.toLocaleDateString('ar-SA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

const DEFAULT_FALLBACK_CONVERSATIONS: ConversationItem[] = [
  {
    id: 'conv1',
    user: { id: 'usr-sarah', name: 'سارة عبدالله الأحمد', online: true, role: 'مهندسة برمجيات' },
    lastMessage: 'شكراً جزيلاً على المساعدة والتعاون الرائع! 🙏',
    time: 'منذ ١٠ دقائق',
  },
  {
    id: 'conv2',
    user: { id: 'usr-tariq', name: 'م. طارق بن خالد العتيبي', online: false, role: 'مستشار بنيات برمجية' },
    lastMessage: 'أرسلت لك التوثيق الخاص بالمعمارية الجديدة، ألقِ نظرة عليه.',
    time: 'أمس',
  },
  {
    id: 'conv3',
    user: { id: 'org-ruwwad', name: 'منظمة رواد التطوع', online: true, role: 'مؤسسة معتمدة' },
    lastMessage: 'يسعدنا انضمامك إلى مبادرة التشجير القادمة في الرياض.',
    time: 'منذ يومين',
  },
];

export default function Messages() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [conversationsList, setConversationsList] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [messagesStore, setMessagesStore] = useState<Record<string, MessageItem[]>>({});
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

  const [searchedUsers, setSearchedUsers] = useState<UserSearchResult[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [modalUserResults, setModalUserResults] = useState<UserSearchResult[]>([]);
  const [isModalSearching, setIsModalSearching] = useState(false);

  // Live WebSocket typing status per conversation
  const [isPartnerTyping, setIsPartnerTyping] = useState<Record<string, boolean>>({});
  const typingTimerRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load initial conversations from backend & handle direct user query param
  useEffect(() => {
    let isMounted = true;
    const fetchConversations = async () => {
      setIsLoadingConversations(true);
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const targetUserId = searchParams.get('user') || searchParams.get('userId');

        const convs = await messagesService.getConversations();
        if (!isMounted) return;

        let activeId = '';
        let finalConvs = convs && convs.length > 0 ? convs : DEFAULT_FALLBACK_CONVERSATIONS;

        // If targetUserId query param is given, find or create conversation with this user
        if (targetUserId && targetUserId !== currentUser?.id) {
          const existing = finalConvs.find((c) => c.user.id === targetUserId);
          if (existing) {
            activeId = existing.id;
            setShowMobileChat(true);
          } else {
            try {
              const newConv = await messagesService.startConversation(targetUserId);
              if (newConv && isMounted) {
                finalConvs = [newConv, ...finalConvs.filter((c) => c.id !== newConv.id)];
                activeId = newConv.id;
                setShowMobileChat(true);
              }
            } catch (err) {
              console.error('Error starting conversation for query user:', err);
            }
          }
        }

        setConversationsList(finalConvs);
        if (activeId) {
          setActiveConvId(activeId);
        } else if (finalConvs.length > 0) {
          setActiveConvId(finalConvs[0].id);
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
        setConversationsList(DEFAULT_FALLBACK_CONVERSATIONS);
        setActiveConvId(DEFAULT_FALLBACK_CONVERSATIONS[0].id);
      } finally {
        if (isMounted) setIsLoadingConversations(false);
      }
    };

    fetchConversations();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  // Clear unread message notifications when entering Messages
  useEffect(() => {
    api.patch('/notifications/mark-type-read', { type: 'message' })
      .then(() => {
        window.dispatchEvent(new Event('notifications:refresh'));
      })
      .catch(() => {});
  }, []);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConvId) return;
    let isMounted = true;

    const fetchMessages = async () => {
      try {
        const msgs = await messagesService.getMessages(activeConvId);
        if (!isMounted) return;
        setMessagesStore((prev) => ({
          ...prev,
          [activeConvId]: msgs,
        }));
        // Notify AppLayout to refresh notification count since opening conversation marks notifications read in backend
        window.dispatchEvent(new Event('notifications:refresh'));
      } catch (err) {
        console.error('Failed to load messages for active conv:', err);
      }
    };

    fetchMessages();

    return () => {
      isMounted = false;
    };
  }, [activeConvId]);

  // Real-Time WebSocket Engine (0ms Latency, Zero Polling Overhead)
  useEffect(() => {
    // 1. Listen for instant incoming direct messages
    const unsubNewMsg = websocketService.on('message:new', (payload: any) => {
      const { conversationId, message } = payload;
      if (!conversationId || !message) return;

      // Append message to store
      setMessagesStore((prev) => {
        const existing = prev[conversationId] || [];
        if (existing.some((m) => m.id === message.id)) return prev;
        return {
          ...prev,
          [conversationId]: [...existing, { ...message, sender: 'other' }],
        };
      });

      // Update conversation list preview & bring to top
      setConversationsList((prev) => {
        const found = prev.find((c) => c.id === conversationId);
        if (found) {
          const updated = {
            ...found,
            lastMessage: message.content,
            time: 'الآن',
          };
          return [updated, ...prev.filter((c) => c.id !== conversationId)];
        }
        // If not in list, fetch fresh list
        messagesService.getConversations().then((convs) => {
          if (convs && convs.length > 0) setConversationsList(convs);
        });
        return prev;
      });
    });

    // 2. Listen for messages sent from this user on other tabs/devices or WebSocket echo
    const unsubSentMsg = websocketService.on('message:sent', (payload: any) => {
      const { conversationId, message } = payload;
      if (!conversationId || !message) return;

      setMessagesStore((prev) => {
        const existing = prev[conversationId] || [];
        if (existing.some((m) => m.id === message.id)) return prev;

        // If this tab already has a matching optimistic message (temp- with same content), replace it cleanly
        const matchingTempIndex = existing.findIndex(
          (m) => m.id.startsWith('temp-') && m.content === message.content && m.sender === 'me'
        );

        if (matchingTempIndex !== -1) {
          const next = [...existing];
          next[matchingTempIndex] = { ...message, sender: 'me' };
          return {
            ...prev,
            [conversationId]: next,
          };
        }

        return {
          ...prev,
          [conversationId]: [...existing, { ...message, sender: 'me' }],
        };
      });
    });

    // 3. Listen for live presence updates (نشط الآن / offline)
    const unsubPresence = websocketService.on('presence:update', (payload: any) => {
      const { userId, online, statusText } = payload;
      if (!userId) return;

      setConversationsList((prev) =>
        prev.map((c) => {
          if (c.user.id === userId) {
            return {
              ...c,
              user: {
                ...c.user,
                online,
                statusText: statusText || (online ? 'نشط الآن' : 'غير متصل'),
              },
            };
          }
          return c;
        })
      );
    });

    // 4. Listen for real-time typing indicators
    const unsubTyping = websocketService.on('typing', (payload: any) => {
      const { conversationId, isTyping } = payload;
      if (conversationId) {
        setIsPartnerTyping((prev) => ({
          ...prev,
          [conversationId]: Boolean(isTyping),
        }));
      }
    });

    // 5. Graceful fallback polling (ONLY fires every 30s IF WebSocket is disconnected)
    const fallbackTimer = setInterval(async () => {
      if (!websocketService.isConnected() && activeConvId) {
        try {
          const [convs, msgs] = await Promise.all([
            messagesService.getConversations(),
            messagesService.getMessages(activeConvId),
          ]);
          if (convs && convs.length > 0) setConversationsList(convs);
          if (msgs) {
            setMessagesStore((prev) => ({
              ...prev,
              [activeConvId]: msgs,
            }));
          }
        } catch {}
      }
    }, 30000);

    return () => {
      unsubNewMsg();
      unsubSentMsg();
      unsubPresence();
      unsubTyping();
      clearInterval(fallbackTimer);
    };
  }, [activeConvId]);

  // Active conversation & strictly deduplicated message stream
  const activeConv =
    conversationsList.find((c) => c.id === activeConvId) || conversationsList[0] || null;
  const rawActiveMessages = activeConv ? messagesStore[activeConv.id] || [] : [];

  const activeMessages = useMemo(() => {
    const seenIds = new Set<string>();
    return rawActiveMessages.filter((msg) => {
      if (!msg || !msg.id) return false;
      if (seenIds.has(msg.id)) return false;
      seenIds.add(msg.id);
      return true;
    });
  }, [rawActiveMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const isSendingRef = useRef(false);

  // Debounced search by name in the sidebar
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchedUsers([]);
      setIsSearchingUsers(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const results = await messagesService.searchUsersByName(q);
        // Exclude current logged in user from results
        setSearchedUsers(results.filter((u) => u.id !== currentUser?.id));
      } catch {
        setSearchedUsers([]);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, currentUser?.id]);

  // Debounced search by name in the "New Chat" modal
  useEffect(() => {
    const q = modalSearchQuery.trim();
    const timer = setTimeout(async () => {
      setIsModalSearching(true);
      try {
        const results = await messagesService.searchUsersByName(q);
        setModalUserResults(results.filter((u) => u.id !== currentUser?.id));
      } catch {
        setModalUserResults([]);
      } finally {
        setIsModalSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [modalSearchQuery, currentUser?.id]);

  // Send message (guarded against rapid duplicate clicks)
  const handleSendMessage = async (e?: React.FormEvent, customContent?: string) => {
    if (e) e.preventDefault();
    const content = (customContent || inputText).trim();
    if (!content || !activeConv || isSendingRef.current) return;

    isSendingRef.current = true;
    setInputText('');

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: MessageItem = {
      id: tempId,
      conversation_id: activeConv.id,
      sender: 'me',
      sender_id: currentUser?.id,
      content,
      created_at: Date.now(),
      time: 'الآن',
      status: 'read',
    };

    // Optimistically show sent message immediately
    setMessagesStore((prev) => ({
      ...prev,
      [activeConv.id]: [...(prev[activeConv.id] || []), optimisticMsg],
    }));

    // Update conversation preview and bump to top
    setConversationsList((prev) => {
      const found = prev.find((c) => c.id === activeConv.id);
      if (found) {
        return [
          { ...found, lastMessage: content, time: 'الآن' },
          ...prev.filter((c) => c.id !== activeConv.id),
        ];
      }
      return prev;
    });

    // Clear typing state upon sending message
    if (activeConv && activeConv.user.id) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      websocketService.sendTyping(activeConv.id, activeConv.user.id, false);
    }

    try {
      // Save message via backend API
      const realMsg = await messagesService.sendMessage(activeConv.id, content);
      if (realMsg) {
        setMessagesStore((prev) => {
          const current = prev[activeConv.id] || [];
          // If realMsg.id is already in list (delivered first by WebSocket echo), remove tempId without duplicating!
          const alreadyHasReal = current.some((m) => m.id === realMsg.id);
          if (alreadyHasReal) {
            return {
              ...prev,
              [activeConv.id]: current.filter((m) => m.id !== tempId),
            };
          }
          // Otherwise replace tempId with realMsg
          return {
            ...prev,
            [activeConv.id]: current.map((m) =>
              m.id === tempId ? { ...realMsg, sender: 'me' } : m
            ),
          };
        });
      }
    } finally {
      isSendingRef.current = false;
    }
  };

  // Handle typing in chat input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);

    if (activeConv && activeConv.user.id) {
      websocketService.sendTyping(activeConv.id, activeConv.user.id, true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        websocketService.sendTyping(activeConv.id, activeConv.user.id, false);
      }, 2000);
    }
  };

  // Start chat with a searched user
  const handleStartChatWithUser = async (targetUser: UserSearchResult) => {
    try {
      const conv = await messagesService.startConversation(targetUser.id);
      if (conv) {
        setConversationsList((prev) => {
          const exists = prev.find((c) => c.id === conv.id);
          if (exists) return prev;
          return [conv, ...prev];
        });
        setActiveConvId(conv.id);
        setShowMobileChat(true);
        setSearchQuery('');
        setSearchedUsers([]);
        setIsNewChatModalOpen(false);

        toast({
          title: `بدء محادثة مع ${targetUser.name} ✨`,
          description: 'يمكنك الآن تبادل الرسائل المباشرة فوراً.',
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'تعذر بدء المحادثة مع المستخدم.',
      });
    }
  };

  // Filter existing conversations by search
  const filteredConversations = conversationsList.filter((conv) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      conv.user.name.toLowerCase().includes(q) ||
      conv.lastMessage.toLowerCase().includes(q) ||
      (conv.user.role && conv.user.role.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex h-[calc(100vh-8.25rem)] lg:h-[calc(100vh-4.1rem)] bg-background overflow-hidden" dir="rtl">
      {/* 1. Conversations Sidebar */}
      <aside
        className={`w-full md:w-80 lg:w-96 border-e border-border flex flex-col bg-card flex-shrink-0 transition-all duration-200 ${
          showMobileChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border/70 space-y-3 bg-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-base text-foreground font-display">
                المحادثات والرسائل
              </h1>
              <p className="text-[11px] text-muted-foreground">تواصل فوري مع أعضاء ومبدعي سرد</p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsNewChatModalOpen(true)}
              className="gap-1.5 h-8 text-xs font-bold bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 cursor-pointer"
              title="بدء محادثة جديدة"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>محادثة جديدة</span>
            </Button>
          </div>

          {/* Search Bar: Search by name across entire platform */}
          <div className="relative">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="ابحث بالاسم لبدء محادثة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 pe-9 h-9 text-xs bg-background border-border/80 focus-visible:ring-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute top-1/2 -translate-y-1/2 end-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Conversations or Live Search Results List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/40">
          {/* A. If user is searching by name: show users found on platform */}
          {searchQuery.trim() !== '' && (
            <div className="p-3 bg-primary/5 border-b border-primary/15">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-primary flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  أعضاء المنصة المطابقون للبحث بالاسم
                </span>
                {isSearchingUsers && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
              </div>

              {searchedUsers.length === 0 && !isSearchingUsers ? (
                <p className="text-[11px] text-muted-foreground py-1">
                  لا يوجد أعضاء مطابقون للاسم "{searchQuery}".
                </p>
              ) : (
                <div className="space-y-1.5">
                  {searchedUsers.map((target) => (
                    <div
                      key={target.id}
                      onClick={() => handleStartChatWithUser(target)}
                      className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/80 hover:border-primary/40 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar name={target.name} size="sm" />
                        <div className="truncate">
                          <p className="text-xs font-bold text-foreground truncate">{target.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {target.role || `@${target.username}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="h-7 text-[10px] font-bold gap-1 bg-primary text-primary-foreground rounded-lg px-2.5"
                      >
                        <Send className="w-2.5 h-2.5 rtl:rotate-180" />
                        <span>مراسلة</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* B. Conversations List */}
          {searchQuery.trim() !== '' && (
            <div className="px-4 py-2 text-[10px] font-bold text-muted-foreground bg-muted/30">
              المحادثات السابقة المطابقة:
            </div>
          )}

          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs space-y-2">
              <MessageSquare className="w-10 h-10 mx-auto opacity-30 text-primary" />
              <p className="font-bold text-foreground">لا توجد محادثات سابقة</p>
              <p className="text-[11px]">ابحث بالاسم أعلاه لبدء أول محادثة مع أي عضو في سرد.</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsNewChatModalOpen(true)}
                className="mt-2 text-xs font-bold gap-1.5 rounded-xl"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>البحث عن مستخدمين بالاسم</span>
              </Button>
            </div>
          ) : (
            <div className="px-2 py-1.5 space-y-1">
              {filteredConversations.map((conv) => {
                const isSelected = activeConv?.id === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setActiveConvId(conv.id);
                      setShowMobileChat(true);
                    }}
                    className={`p-3 rounded-2xl flex items-center gap-3 cursor-pointer transition-all duration-150 select-none ${
                      isSelected
                        ? 'bg-primary/10 text-foreground shadow-2xs border border-primary/25 ring-1 ring-primary/20'
                        : 'hover:bg-muted/60 text-foreground/85 border border-transparent'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <UserAvatar name={conv.user.name} size="md" />
                      {conv.user.online && (
                        <span
                          className="absolute bottom-0 end-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background ring-2 ring-emerald-500/20"
                          title="نشط الآن"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <p className="text-xs font-bold text-foreground truncate">
                          {conv.user.name}
                        </p>
                        <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                          {conv.time}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        {isPartnerTyping[conv.id] ? (
                          <p className="text-xs text-primary font-bold truncate flex items-center gap-1.5 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            يكتب الآن...
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground truncate leading-relaxed">
                            {conv.lastMessage || 'محادثة جديدة...'}
                          </p>
                        )}

                        {conv.user.online && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold shrink-0 flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                            نشط
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* 2. Chat Area (Full Screen Capable) */}
      <main
        className={`flex-1 flex flex-col bg-background min-w-0 transition-all duration-200 ${
          showMobileChat
            ? 'fixed inset-0 z-50 bg-background flex flex-col h-[100dvh] w-full overflow-hidden'
            : isFullScreen
            ? 'fixed inset-0 z-50 bg-background flex flex-col h-[100dvh] w-full overflow-hidden'
            : 'hidden md:flex'
        }`}
      >
        {!activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4 text-primary">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-foreground text-lg mb-1">
              مرحباً بك في رسائل ومحادثات سرد
            </h3>
            <p className="text-xs max-w-sm text-muted-foreground">
              اختر محادثة من القائمة للبدء في المراسلة الفورية، أو اضغط "محادثة جديدة" للبحث عن أي عضو في المنصة.
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-border/70 flex items-center justify-between px-4 sm:px-6 bg-card/60 backdrop-blur-xs flex-shrink-0">
              <div className="flex items-center gap-3">
                {/* Back Button (Mobile or Fullscreen) */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileChat(false);
                    setIsFullScreen(false);
                  }}
                  className={`${
                    showMobileChat || isFullScreen ? 'inline-flex' : 'md:hidden'
                  } p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer`}
                  title="العودة لقائمة المحادثات"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>

                <div className="relative">
                  <UserAvatar name={activeConv.user.name} size="md" />
                  {activeConv.user.online && (
                    <span
                      className="absolute bottom-0 end-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background ring-1 ring-emerald-500/30"
                      title="نشط الآن"
                    />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-foreground">{activeConv.user.name}</p>
                    {activeConv.user.role && (
                      <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 border-border text-muted-foreground hidden sm:inline-flex">
                        {activeConv.user.role}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    {isPartnerTyping[activeConv.id] ? (
                      <span className="text-primary font-bold flex items-center gap-1.5 animate-pulse">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                        يكتب الآن...
                      </span>
                    ) : (
                      <>
                        <Circle
                          className={`w-2 h-2 fill-current ${
                            activeConv.user.online
                              ? 'text-emerald-500 animate-pulse'
                              : 'text-muted-foreground/40'
                          }`}
                        />
                        <span className={activeConv.user.online ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>
                          {activeConv.user.statusText || (activeConv.user.online ? 'نشط الآن' : 'غير متصل')}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Quick Actions (Full Screen Toggle, Call Symbols Removed) */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsFullScreen((prev) => !prev)}
                  className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title={isFullScreen ? 'تصغير الشاشة' : 'محادثة في وضع الشاشة الكاملة'}
                >
                  {isFullScreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Messages Stream with Ambient Gradient & Date Divider Pills */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted/30 via-background to-muted/15">
              {activeMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground min-h-[300px]">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 text-primary shadow-xs">
                    <Send className="w-7 h-7 rtl:rotate-180" />
                  </div>
                  <p className="font-bold text-sm text-foreground mb-1">لا توجد رسائل سابقة</p>
                  <p className="text-xs max-w-xs text-muted-foreground mb-4">ابدأ المحادثة الآن بتبادل التحية أو طرح استفسارك.</p>
                  <div className="flex flex-wrap items-center justify-center gap-2 max-w-sm">
                    {['👋 مرحباً بك!', 'صباح الخير', 'شكراً على التواصل'].map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => handleSendMessage(undefined, prompt)}
                        className="px-3 py-1.5 rounded-full bg-card border border-border/80 text-xs font-semibold text-foreground hover:bg-primary hover:text-primary-foreground transition-all shadow-2xs cursor-pointer"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                activeMessages.map((msg, index) => {
                  const isMe = msg.sender === 'me';
                  const showDateDivider =
                    index === 0 ||
                    !isSameDay(msg.created_at, activeMessages[index - 1].created_at);
                  const isConsecutive =
                    index > 0 &&
                    activeMessages[index - 1].sender === msg.sender &&
                    isSameDay(msg.created_at, activeMessages[index - 1].created_at);

                  return (
                    <React.Fragment key={msg.id}>
                      {/* Date Divider Pill */}
                      {showDateDivider && (
                        <div className="flex items-center justify-center my-3.5 select-none">
                          <span className="px-3.5 py-1 rounded-full bg-muted/70 dark:bg-muted/40 border border-border/50 text-[11px] font-semibold text-muted-foreground shadow-2xs backdrop-blur-xs">
                            {formatMessageDateHeader(msg.created_at)}
                          </span>
                        </div>
                      )}

                      {/* Message Bubble Container */}
                      <div className={`flex items-end gap-2.5 ${isMe ? 'ms-auto flex-row-reverse' : 'me-auto'}`}>
                        {/* Avatar for Incoming Messages */}
                        {!isMe && (
                          <div className="shrink-0 mb-3.5">
                            {!isConsecutive ? (
                              <UserAvatar name={activeConv.user.name} size="sm" />
                            ) : (
                              <div className="w-8" />
                            )}
                          </div>
                        )}

                        {/* Bubble */}
                        <div className={`flex flex-col max-w-[85%] sm:max-w-md md:max-w-lg ${isMe ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`px-4 py-2.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words ${
                              isMe
                                ? 'bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground rounded-2xl rounded-ee-xs shadow-xs selection:bg-primary-foreground selection:text-primary'
                                : 'bg-card/95 dark:bg-card/85 border border-border/80 text-foreground rounded-2xl rounded-es-xs shadow-2xs backdrop-blur-xs'
                            }`}
                          >
                            {msg.content}
                          </div>

                          {/* Time & Delivery Status */}
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5 px-1 select-none">
                            <span>{msg.time || 'الآن'}</span>
                            {isMe && (
                              msg.id.startsWith('temp-') ? (
                                <span title="جارٍ الإرسال...">
                                  <Clock className="w-3 h-3 animate-spin text-muted-foreground/60 ms-0.5" />
                                </span>
                              ) : (
                                <span title="تم التسليم">
                                  <CheckCheck className="w-3.5 h-3.5 text-primary ms-0.5 inline" />
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}

              {/* Floating Live Typing Indicator Bubble in Stream */}
              {isPartnerTyping[activeConv.id] && (
                <div className="flex items-end gap-2.5 max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-200 ps-1 pt-1">
                  <UserAvatar name={activeConv.user.name} size="sm" />
                  <div className="bg-card/95 border border-border/80 rounded-2xl rounded-es-xs px-3.5 py-2.5 shadow-2xs flex items-center gap-2 backdrop-blur-xs">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                    </div>
                    <span className="text-[11px] text-muted-foreground font-semibold">
                      {activeConv.user.name.split(' ')[0]} يكتب...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Footer with Quick Emoji Reactions & Glassmorphic Container */}
            <div className="p-3 sm:p-4 border-t border-border/70 bg-card/80 backdrop-blur-md">
              {/* Quick reaction chips */}
              <div className="flex items-center gap-1.5 px-1 pb-2 overflow-x-auto select-none">
                <span className="text-[11px] text-muted-foreground font-medium me-1">تفاعل سريع:</span>
                {['👍', '❤️', '😊', '🎉', '🙏', '🔥'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSendMessage(undefined, emoji)}
                    className="w-7 h-7 rounded-full bg-muted/60 hover:bg-primary/10 hover:scale-115 active:scale-95 text-xs flex items-center justify-center transition-all cursor-pointer border border-border/40"
                    title={`إرسال ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="relative flex items-end gap-2 bg-muted/30 dark:bg-card/60 border border-border/80 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 rounded-2xl p-2 transition-all shadow-xs">
                <div className="flex items-center gap-0.5 text-muted-foreground pb-1">
                  <button
                    type="button"
                    onClick={() => setInputText((prev) => `${prev} 😊`)}
                    className="p-1.5 rounded-xl hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                    title="رمز تعبيري"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                </div>

                <textarea
                  rows={1}
                  placeholder="اكتب رسالتك هنا... (Enter للإرسال، Shift+Enter لسطر جديد)"
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="w-full bg-transparent resize-none border-0 focus:outline-hidden text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 py-1.5 px-1 max-h-32 leading-relaxed"
                />

                <Button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="rounded-xl h-9 px-3.5 sm:px-4 font-bold gap-1.5 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:hover:scale-100 mb-0.5"
                >
                  <Send className="w-3.5 h-3.5 rtl:rotate-180" />
                  <span className="text-xs hidden sm:inline">إرسال</span>
                </Button>
              </form>
            </div>
          </>
        )}
      </main>

      {/* 3. New Chat Modal: Search Any User by Name */}
      <Dialog open={isNewChatModalOpen} onOpenChange={setIsNewChatModalOpen}>
        <DialogContent className="sm:max-w-md p-6" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black font-display flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              <span>بدء محادثة جديدة بالبحث بالاسم</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              ابحث عن أي عضو أو كاتب أو منظمة في سرد بالاسم لبدء محادثة فورية معه.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="relative">
              <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="اكتب اسم العضو أو اسم المستخدم..."
                value={modalSearchQuery}
                onChange={(e) => setModalSearchQuery(e.target.value)}
                className="ps-9 h-10 text-xs bg-background border-border"
                autoFocus
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 divide-y divide-border/40">
              {isModalSearching ? (
                <div className="p-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>جاري البحث في قاعدة بيانات سرد...</span>
                </div>
              ) : modalUserResults.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground space-y-1">
                  <Users className="w-8 h-8 mx-auto opacity-30 text-primary" />
                  <p className="font-bold text-foreground">
                    {modalSearchQuery.trim() ? 'لم يتم العثور على أعضاء بهذا الاسم' : 'اكتب حرفين أو أكثر للبحث'}
                  </p>
                  <p className="text-[11px]">يمكنك البحث بالاسم الأول أو اسم العائلة أو اسم المستخدم.</p>
                </div>
              ) : (
                modalUserResults.map((targetUser) => (
                  <div
                    key={targetUser.id}
                    onClick={() => handleStartChatWithUser(targetUser)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/60 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar name={targetUser.name} size="md" />
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-foreground truncate">{targetUser.name}</p>
                          {targetUser.verified && (
                            <Badge className="text-[9px] h-4 px-1 bg-primary/10 text-primary border-0">
                              موثق
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {targetUser.role || `@${targetUser.username}`}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="h-8 text-xs font-bold gap-1 rounded-xl px-3 bg-primary text-primary-foreground cursor-pointer"
                    >
                      <Send className="w-3 h-3 rtl:rotate-180" />
                      <span>محادثة</span>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
