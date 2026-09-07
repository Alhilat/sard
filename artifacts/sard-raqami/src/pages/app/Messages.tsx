import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Send, Phone, Video, MoreVertical, CheckCheck,
  Smile, Paperclip, ArrowRight, Circle, Mic, Image as ImageIcon,
  Check, Info, X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/layouts/AppLayout';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface MessageItem {
  id: string;
  sender: 'me' | 'other';
  content: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
}

interface ConversationItem {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    online: boolean;
    role?: string;
  };
  lastMessage: string;
  time: string;
}

const INITIAL_CONVERSATIONS: ConversationItem[] = [
  {
    id: 'conv1',
    user: { id: '2', name: 'سارة عبدالله الأحمد', online: true, role: 'مهندسة برمجيات' },
    lastMessage: 'شكراً جزيلاً على المساعدة والتعاون الرائع! 🙏',
    time: 'منذ ١٠ دقائق',
  },
  {
    id: 'conv2',
    user: { id: '3', name: 'م. طارق بن خالد العتيبي', online: false, role: 'مستشار بنيات برمجية' },
    lastMessage: 'أرسلت لك التوثيق الخاص بالمعمارية الجديدة، ألقِ نظرة عليه.',
    time: 'أمس',
  },
  {
    id: 'conv3',
    user: { id: 'org1', name: 'منظمة رواد التطوع', online: true, role: 'مؤسسة معتمدة' },
    lastMessage: 'يسعدنا انضمامك إلى مبادرة التشجير القادمة في الرياض.',
    time: 'منذ يومين',
  },
  {
    id: 'conv4',
    user: { id: '4', name: 'د. ليلى السليمان', online: false, role: 'أستاذة الأدب والنقد' },
    lastMessage: 'ما رأيك في مسودة المقال الأدبي الجديد؟',
    time: 'منذ ٣ أيام',
  },
];

const INITIAL_MESSAGES_MAP: Record<string, MessageItem[]> = {
  conv1: [
    { id: 'm1', sender: 'me', content: 'أهلاً سارة، كيف تسير أمور تجهيز ورشة عمل الـ Design Systems؟', time: '١٠:٣٠ ص', status: 'read' },
    { id: 'm2', sender: 'other', content: 'مرحباً أحمد! تسير بشكل ممتاز، أتممنا تجهيز الشرائح التفاعلية وأمثلة الأكواد.', time: '١٠:٣٢ ص' },
    { id: 'm3', sender: 'me', content: 'رائع جداً! هل تحتاجين أي مساعدة في مراجعة مستودع الأكواد المفتوحة؟', time: '١٠:٣٥ ص', status: 'read' },
    { id: 'm4', sender: 'other', content: 'نعم يفضل مراجعة ملف التهيئة وإعدادات RTL قبل العرض المباشر.', time: '١٠:٣٦ ص' },
    { id: 'm5', sender: 'me', content: 'تمت المراجعة وكل شيء جاهز ومضبوط بدقة عالية.', time: '١٠:٣٧ ص', status: 'read' },
    { id: 'm6', sender: 'other', content: 'شكراً جزيلاً على المساعدة والتعاون الرائع! 🙏', time: '١٠:٣٨ ص' },
  ],
  conv2: [
    { id: 'm21', sender: 'other', content: 'السلام عليكم أحمد، كيف حالك؟', time: 'أمس ٤:١٥ م' },
    { id: 'm22', sender: 'me', content: 'وعليكم السلام مهندس طارق، حياك الله، الحمد لله بأفضل حال.', time: 'أمس ٤:٢٠ م', status: 'read' },
    { id: 'm23', sender: 'other', content: 'أرسلت لك التوثيق الخاص بالمعمارية الجديدة، ألقِ نظرة عليه.', time: 'أمس ٤:٢٥ م' },
  ],
  conv3: [
    { id: 'm31', sender: 'other', content: 'مرحباً بك في منظمة رواد التطوع! نشكرك على تفاعلك واهتمامك بالمبادرات المجتمعية.', time: 'منذ يومين' },
    { id: 'm32', sender: 'me', content: 'العفو، سعيد جداً بالمشاركة وخدمة المجتمع معكم.', time: 'منذ يومين', status: 'read' },
    { id: 'm33', sender: 'other', content: 'يسعدنا انضمامك إلى مبادرة التشجير القادمة في الرياض.', time: 'منذ يومين' },
  ],
  conv4: [
    { id: 'm41', sender: 'other', content: 'أهلاً بك أحمد، قرأت مشاركتك الأخيرة في صالون السرد وكانت غنية بالعمق والجمال.', time: 'منذ ٣ أيام' },
    { id: 'm42', sender: 'me', content: 'شهادة أعتز بها كثيراً دكتورة ليلى، شكراً لدعمك المستمر.', time: 'منذ ٣ أيام', status: 'read' },
    { id: 'm43', sender: 'other', content: 'ما رأيك في مسودة المقال الأدبي الجديد؟', time: 'منذ ٣ أيام' },
  ],
};

export default function Messages() {
  const { toast } = useToast();
  const [conversationsList, setConversationsList] = useState<ConversationItem[]>(INITIAL_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState<string>('conv1');
  const [messagesStore, setMessagesStore] = useState<Record<string, MessageItem[]>>(INITIAL_MESSAGES_MAP);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv =
    conversationsList.find((c) => c.id === activeConvId) || conversationsList[0];
  const activeMessages = messagesStore[activeConv.id] || [];

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  // Send message
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = inputText.trim();
    if (!content) return;

    const newMsg: MessageItem = {
      id: `msg-${Date.now()}`,
      sender: 'me',
      content,
      time: 'الآن',
      status: 'read',
    };

    // Update messages store
    setMessagesStore((prev) => ({
      ...prev,
      [activeConv.id]: [...(prev[activeConv.id] || []), newMsg],
    }));

    // Update conversation preview
    setConversationsList((prev) =>
      prev.map((c) =>
        c.id === activeConv.id
          ? { ...c, lastMessage: content, time: 'الآن' }
          : c
      )
    );

    setInputText('');

    // Persist to backend
    api.post(`/conversations/${activeConv.id}/messages`, { content }).catch(() => {});

    // Simulate genuine friendly reply if recipient is online
    if (activeConv.user.online) {
      setTimeout(() => {
        const replyMsg: MessageItem = {
          id: `reply-${Date.now()}`,
          sender: 'other',
          content: 'أهلاً بك! وصلتني رسالتك وسأوافيك بالتفاصيل قريباً 👍',
          time: 'الآن',
        };

        setMessagesStore((prev) => ({
          ...prev,
          [activeConv.id]: [...(prev[activeConv.id] || []), replyMsg],
        }));

        setConversationsList((prev) =>
          prev.map((c) =>
            c.id === activeConv.id
              ? { ...c, lastMessage: replyMsg.content, time: 'الآن' }
              : c
          )
        );
      }, 1200);
    }
  };

  // Filter conversations by search
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
      {/* 1. Conversations Sidebar (Hidden on mobile when chat is open) */}
      <aside
        className={`w-full md:w-80 lg:w-96 border-e border-border flex flex-col bg-card flex-shrink-0 transition-all duration-200 ${
          showMobileChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border/70 space-y-3 bg-muted/20">
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-base text-foreground font-display">
              المحادثات والرسائل
            </h1>
            <Badge variant="outline" className="text-[11px] text-muted-foreground font-normal">
              محادثات مباشرة
            </Badge>
          </div>

          {/* Search Bar with proper start alignment */}
          <div className="relative">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="ابحث في المحادثات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 h-9 text-xs bg-background border-border/80"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute top-1/2 -translate-y-1/2 end-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/40">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs space-y-1">
              <p className="font-bold text-foreground">لم يتم العثور على محادثات</p>
              <p>جرب البحث باسم شخص آخر.</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = activeConv.id === conv.id;
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
                      {conv.lastMessage}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* 2. Chat Area (Visible on desktop or when a mobile conversation is opened) */}
      <main
        className={`flex-1 flex flex-col bg-background min-w-0 transition-all duration-200 ${
          showMobileChat ? 'flex' : 'hidden md:flex'
        }`}
      >
        {/* Chat Header */}
        <div className="h-16 border-b border-border/70 flex items-center justify-between px-4 sm:px-6 bg-card/60 backdrop-blur-xs flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Back Button */}
            <button
              type="button"
              onClick={() => setShowMobileChat(false)}
              className="md:hidden p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
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

        {/* Messages Stream (Fixed Alignment: Outgoing vs Incoming) */}
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

                    {/* Message Meta & Delivery Status */}
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
            {/* Action Tools */}
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

            {/* Input Field */}
            <Input
              placeholder="اكتب رسالتك هنا..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="text-xs sm:text-sm h-11 bg-background border-border/80 focus-visible:ring-primary rounded-xl flex-1"
            />

            {/* Send Button */}
            <Button
              type="submit"
              disabled={!inputText.trim()}
              className="rounded-xl h-11 px-4 sm:px-5 font-bold gap-2 shrink-0 shadow-xs"
            >
              <Send className="w-4 h-4 rtl:rotate-180" />
              <span className="hidden sm:inline">إرسال</span>
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
