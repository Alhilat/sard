import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Send, Phone, Video, CheckCheck,
  Smile, Paperclip, ArrowRight, Circle, X,
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
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

  // Search by name state
  const [searchedUsers, setSearchedUsers] = useState<UserSearchResult[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [modalUserResults, setModalUserResults] = useState<UserSearchResult[]>([]);
  const [isModalSearching, setIsModalSearching] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load initial conversations from backend
  useEffect(() => {
    let isMounted = true;
    const fetchConversations = async () => {
      setIsLoadingConversations(true);
      try {
        const convs = await messagesService.getConversations();
        if (!isMounted) return;
        if (convs && convs.length > 0) {
          setConversationsList(convs);
          setActiveConvId(convs[0].id);
        } else {
          // If no conversations exist yet, use friendly starter conversations
          setConversationsList(DEFAULT_FALLBACK_CONVERSATIONS);
          setActiveConvId(DEFAULT_FALLBACK_CONVERSATIONS[0].id);
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
      } catch (err) {
        console.error('Failed to load messages for active conv:', err);
      }
    };

    fetchMessages();

    return () => {
      isMounted = false;
    };
  }, [activeConvId]);

  // Real-time polling every 2.5 seconds for incoming messages & conversation updates
  useEffect(() => {
    if (!activeConvId) return;
    let isMounted = true;

    const pollTimer = setInterval(async () => {
      try {
        const [convs, msgs] = await Promise.all([
          messagesService.getConversations(),
          messagesService.getMessages(activeConvId),
        ]);
        if (!isMounted) return;

        if (convs && convs.length > 0) {
          setConversationsList((prev) => {
            // merge to preserve current selection
            return convs;
          });
        }

        setMessagesStore((prev) => {
          const current = prev[activeConvId] || [];
          if (
            msgs.length !== current.length ||
            (msgs.length > 0 && msgs[msgs.length - 1].id !== current[current.length - 1]?.id)
          ) {
            return {
              ...prev,
              [activeConvId]: msgs,
            };
          }
          return prev;
        });
      } catch {
        // silent polling error
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(pollTimer);
    };
  }, [activeConvId]);

  // Scroll to bottom on message updates
  const activeConv =
    conversationsList.find((c) => c.id === activeConvId) || conversationsList[0] || null;
  const activeMessages = activeConv ? messagesStore[activeConv.id] || [] : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

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

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = inputText.trim();
    if (!content || !activeConv) return;

    setInputText('');

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: MessageItem = {
      id: tempId,
      sender: 'me',
      content,
      time: 'الآن',
      status: 'read',
    };

    // Optimistically show sent message immediately
    setMessagesStore((prev) => ({
      ...prev,
      [activeConv.id]: [...(prev[activeConv.id] || []), optimisticMsg],
    }));

    // Update conversation preview
    setConversationsList((prev) =>
      prev.map((c) =>
        c.id === activeConv.id
          ? { ...c, lastMessage: content, time: 'الآن' }
          : c
      )
    );

    // Save message via backend API
    const realMsg = await messagesService.sendMessage(activeConv.id, content);
    if (realMsg) {
      setMessagesStore((prev) => ({
        ...prev,
        [activeConv.id]: (prev[activeConv.id] || []).map((m) =>
          m.id === tempId ? { ...realMsg, sender: 'me' } : m
        ),
      }));
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
    <div className="flex h-[calc(100vh-4.1rem)] bg-background overflow-hidden" dir="rtl">
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
            <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground bg-muted/30">
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
                className="mt-2 text-xs font-bold gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>البحث عن مستخدمين بالاسم</span>
              </Button>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = activeConv?.id === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setActiveConvId(conv.id);
                    setShowMobileChat(true);
                  }}
                  className={`flex items-start gap-3 p-3.5 cursor-pointer transition-colors select-none ${
                    isSelected
                      ? 'bg-primary/10 border-s-4 border-primary text-foreground'
                      : 'hover:bg-muted/50 text-foreground/90'
                  }`}
                >
                  <div className="relative flex-shrink-0 mt-0.5">
                    <UserAvatar name={conv.user.name} size="md" />
                    {conv.user.online && (
                      <span className="absolute bottom-0 end-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <p className="text-xs font-bold text-foreground truncate">
                        {conv.user.name}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {conv.time}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground truncate leading-relaxed">
                      {conv.lastMessage || 'محادثة جديدة...'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* 2. Chat Area */}
      <main
        className={`flex-1 flex flex-col bg-background min-w-0 transition-all duration-200 ${
          showMobileChat ? 'flex' : 'hidden md:flex'
        }`}
      >
        {!activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h2 className="text-lg font-black text-foreground font-display">مرحباً بك في المحادثات المباشرة</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                حدد محادثة من القائمة الجانبية أو ابحث عن أي عضو أو صانع محتوى بالاسم للتواصل معه فوراً.
              </p>
            </div>
            <Button
              onClick={() => setIsNewChatModalOpen(true)}
              className="gap-2 font-bold text-xs rounded-xl"
            >
              <UserPlus className="w-4 h-4" />
              <span>البحث عن مستخدمين بالاسم</span>
            </Button>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-border/70 flex items-center justify-between px-4 sm:px-6 bg-card/60 backdrop-blur-xs flex-shrink-0">
              <div className="flex items-center gap-3">
                {/* Mobile Back Button */}
                <button
                  type="button"
                  onClick={() => setShowMobileChat(false)}
                  className="md:hidden p-1.5 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"
                  title="العودة لقائمة المحادثات"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>

                <div className="relative">
                  <UserAvatar name={activeConv.user.name} size="md" />
                  {activeConv.user.online && (
                    <span className="absolute bottom-0 end-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
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
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Circle
                      className={`w-2 h-2 fill-current ${
                        activeConv.user.online ? 'text-emerald-500' : 'text-muted-foreground/50'
                      }`}
                    />
                    <span>{activeConv.user.online ? 'متصل الآن' : 'غير متصل'}</span>
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    toast({
                      title: 'المكالمة الصوتية',
                      description: `جاري الاتصال بـ ${activeConv.user.name}...`,
                    })
                  }
                  className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="اتصال صوتي"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    toast({
                      title: 'مكالمة الفيديو',
                      description: `جاري بدء اتصال مرئي مع ${activeConv.user.name}...`,
                    })
                  }
                  className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="اتصال فيديو"
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 bg-muted/15">
              {activeMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground min-h-[300px]">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 text-primary">
                    <Send className="w-6 h-6 rtl:rotate-180" />
                  </div>
                  <p className="font-bold text-sm text-foreground mb-1">لا توجد رسائل سابقة</p>
                  <p className="text-xs max-w-xs">ابدأ المحادثة الآن بتبادل التحية أو طرح استفسارك.</p>
                </div>
              ) : (
                activeMessages.map((msg) => {
                  const isMe = msg.sender === 'me';
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2.5 max-w-lg sm:max-w-xl ${
                        isMe ? 'ms-auto flex-row-reverse' : 'me-auto'
                      }`}
                    >
                      {/* Avatar for Incoming Messages */}
                      {!isMe && (
                        <div className="shrink-0 mb-1">
                          <UserAvatar name={activeConv.user.name} size="sm" />
                        </div>
                      )}

                      {/* Message Box */}
                      <div className={`space-y-1 ${isMe ? 'text-start' : 'text-start'}`}>
                        <div
                          className={`p-3 sm:p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs whitespace-pre-wrap ${
                            isMe
                              ? 'bg-primary text-primary-foreground rounded-ee-xs'
                              : 'bg-card border border-border/80 text-foreground rounded-es-xs'
                          }`}
                        >
                          {msg.content}
                        </div>

                        {/* Message Meta */}
                        <div
                          className={`flex items-center gap-1.5 text-[10px] text-muted-foreground px-1 ${
                            isMe ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <span>{msg.time}</span>
                          {isMe && (
                            <CheckCheck className="w-3.5 h-3.5 text-primary inline" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Footer */}
            <div className="p-3.5 sm:p-4 border-t border-border/70 bg-card">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 text-muted-foreground">
                  <button
                    type="button"
                    onClick={() =>
                      toast({
                        title: 'إرفاق وسائط',
                        description: 'يمكنك إرفاق المستندات والصور هنا.',
                      })
                    }
                    className="p-2 rounded-xl hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                    title="إرفاق ملف"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputText((prev) => `${prev} 👍`)}
                    className="p-2 rounded-xl hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                    title="إضافة رمز تعبيري"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                </div>

                <Input
                  placeholder="اكتب رسالتك هنا..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="text-xs sm:text-sm h-11 bg-background border-border/80 focus-visible:ring-primary rounded-xl flex-1"
                />

                <Button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="rounded-xl h-11 px-4 sm:px-5 font-bold gap-2 shrink-0 shadow-xs cursor-pointer"
                >
                  <Send className="w-4 h-4 rtl:rotate-180" />
                  <span className="hidden sm:inline">إرسال</span>
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
