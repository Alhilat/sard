import React, { useState, useEffect } from 'react';
import {
  Users, Lock, Globe, Search, Plus, Sparkles, MessageSquare,
  ArrowLeft, CheckCircle2, BookOpen, Briefcase, HeartHandshake,
  Palette, Leaf, Cpu, Compass
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { groupsService, Group } from '@/services/groupsService';
import CreateGroupModal from '@/components/groups/CreateGroupModal';
import GroupDetailView from '@/components/groups/GroupDetailView';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = [
  { id: 'الكل', label: 'جميع المجالات', icon: Sparkles },
  { id: 'تقنية', label: 'تقنية وابتكار', icon: Cpu },
  { id: 'تطوع', label: 'عمل تطوعي', icon: HeartHandshake },
  { id: 'ريادة أعمال', label: 'ريادة أعمال', icon: Briefcase },
  { id: 'ثقافة وسرد', label: 'ثقافة وسرد', icon: BookOpen },
  { id: 'تصميم', label: 'تصميم وفنون', icon: Palette },
  { id: 'بيئة ومناخ', label: 'بيئة واستدامة', icon: Leaf },
];

export default function Groups() {
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load groups on mount and when filter changes
  useEffect(() => {
    setIsLoading(true);
    groupsService
      .getGroups({ search, category: selectedCategory })
      .then((data) => {
        setGroups(data);
        setIsLoading(false);
      });
  }, [search, selectedCategory]);

  const handleToggleJoin = async (e: React.MouseEvent, group: Group) => {
    e.stopPropagation(); // Avoid opening card
    const targetState = !group.joined;

    // Optimistic UI update
    setGroups((prev) =>
      prev.map((g) =>
        g.id === group.id
          ? {
              ...g,
              joined: targetState,
              members: targetState ? g.members + 1 : Math.max(1, g.members - 1),
            }
          : g
      )
    );

    await groupsService.toggleMembership(group.id, !!group.joined);
    toast({
      title: targetState ? 'تم الانضمام بنجاح!' : 'تمت مغادرة المجتمع',
      description: targetState
        ? `أنت الآن عضو في "${group.name}". يمكنك المشاركة في النقاشات.`
        : `تم إلغاء انضمامك إلى "${group.name}".`,
    });
  };

  const handleGroupCreated = (newGroup: Group) => {
    setGroups((prev) => [newGroup, ...prev]);
    setSelectedGroup(newGroup); // Open new group right away
  };

  // If a group is selected, show its full dedicated view
  if (selectedGroup) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto" dir="rtl">
        <GroupDetailView
          group={selectedGroup}
          onBack={() => setSelectedGroup(null)}
          onMembershipChanged={(groupId, joined) => {
            setGroups((prev) =>
              prev.map((g) =>
                g.id === groupId
                  ? {
                      ...g,
                      joined,
                      members: joined ? g.members + 1 : Math.max(1, g.members - 1),
                    }
                  : g
              )
            );
          }}
        />
      </div>
    );
  }

  const myGroups = groups.filter((g) => g.joined);
  const discoverGroups = groups.filter((g) => !g.joined);

  function GroupCard({ group }: { group: Group }) {
    return (
      <Card
        onClick={() => setSelectedGroup(group)}
        className="border-card-border/90 hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group overflow-hidden bg-card/90"
      >
        {/* Decorative Arabesque Mini Cover */}
        <div
          className={`h-24 w-full relative bg-gradient-to-r ${
            group.coverGradient || 'from-[#6B1B1B] via-[#8C2424] to-[#3B0E0E]'
          }`}
        >
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, #ffffff 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />
          <div className="absolute top-2.5 start-3 flex items-center gap-1.5">
            {group.privacy === 'خاص' ? (
              <Badge
                variant="outline"
                className="text-[10px] h-5 gap-1 bg-black/40 text-amber-300 border-amber-300/40 backdrop-blur-xs font-semibold"
              >
                <Lock className="w-2.5 h-2.5" /> خاص
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-[10px] h-5 gap-1 bg-black/40 text-white border-white/30 backdrop-blur-xs font-semibold"
              >
                <Globe className="w-2.5 h-2.5" /> عام
              </Badge>
            )}
            <Badge
              variant="secondary"
              className="text-[10px] h-5 bg-white/90 text-primary font-bold shadow-2xs"
            >
              {group.category}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between -mt-7 relative">
          <div>
            {/* Monogram Avatar & Title */}
            <div className="flex items-end gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-card border-2 border-background text-primary shadow-sm flex items-center justify-center shrink-0 font-bold text-lg font-display group-hover:scale-105 transition-transform">
                {group.name[0]}
              </div>
              <div className="flex-1 min-w-0 pb-0.5">
                <h3 className="font-bold text-sm truncate text-foreground group-hover:text-primary transition-colors">
                  {group.name}
                </h3>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {group.privacy === 'خاص' ? 'مجتمع خاص بدعوة' : 'مجتمع متاح للجميع'}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-4">
              {group.tagline || group.description}
            </p>
          </div>

          {/* Card Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border/60">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
              <MessageSquare className="w-3 h-3 text-primary" />
              حوارات ونقاشات
            </span>

            <Button
              size="sm"
              variant={group.joined ? 'outline' : 'default'}
              className={`h-8 px-3 text-xs font-bold gap-1 shadow-2xs ${
                group.joined
                  ? 'border-border text-muted-foreground hover:text-destructive hover:border-destructive/40'
                  : ''
              }`}
              onClick={(e) => handleToggleJoin(e, group)}
            >
              {group.joined ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>عضو</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>انضمام</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6" dir="rtl">
      {/* Header (Arabic Brand Identity) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4" />
            <span>مجتمعات سرد الرقمية</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-foreground">
            فضاءات المعرفة والتفاعل
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            انضم إلى مجتمعات متخصصة، وتبادل الخبرات والرؤى مع نخبة المبدعين والمطورين والرواد.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="gap-2 font-bold shrink-0 self-start sm:self-auto shadow-xs h-10 px-4"
        >
          <Plus className="w-4 h-4" />
          <span>تأسيس مجتمع جديد</span>
        </Button>
      </div>

      {/* Search & Category Filter */}
      <div className="space-y-3.5">
        {/* Search Bar - Mirrored start icon for RTL */}
        <div className="relative">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="ابحث في المجتمعات بالاسم، المجال، أو الكلمات المفتاحية..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-10 h-11 text-xs sm:text-sm bg-card border-border/80 focus-visible:ring-primary shadow-2xs"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                type="button"
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-5">
        <TabsList className="bg-muted/80 p-1 rounded-xl">
          <TabsTrigger value="all" className="font-bold text-xs gap-1.5 px-3.5 py-1.5">
            جميع المجتمعات ({groups.length.toLocaleString('ar-SA')})
          </TabsTrigger>
          <TabsTrigger value="my" className="font-bold text-xs gap-1.5 px-3.5 py-1.5">
            مجتمعاتي ({myGroups.length.toLocaleString('ar-SA')})
          </TabsTrigger>
          <TabsTrigger value="discover" className="font-bold text-xs gap-1.5 px-3.5 py-1.5">
            استكشف الجديد ({discoverGroups.length.toLocaleString('ar-SA')})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: All Groups */}
        <TabsContent value="all">
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground text-sm space-y-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p>جاري تحميل المجتمعات...</p>
            </div>
          ) : groups.length === 0 ? (
            <Card className="border-card-border text-center py-16 text-muted-foreground p-6 space-y-3 bg-card">
              <Users className="w-12 h-12 mx-auto opacity-30 text-primary" />
              <p className="font-bold text-foreground text-base">لم يتم العثور على نتائج مطابقة</p>
              <p className="text-xs max-w-sm mx-auto leading-relaxed">
                جرب البحث بكلمات مختلفة أو اختر مجالاً آخر من شريط التصنيفات أعلاه.
              </p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {groups.map((g) => (
                <GroupCard key={g.id} group={g} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: My Groups */}
        <TabsContent value="my">
          {myGroups.length === 0 ? (
            <Card className="border-card-border text-center py-16 text-muted-foreground p-6 space-y-3 bg-card">
              <Users className="w-12 h-12 mx-auto opacity-30 text-primary" />
              <p className="font-bold text-foreground text-base">لم تنضم لأي مجتمع حتى الآن</p>
              <p className="text-xs max-w-sm mx-auto leading-relaxed">
                استكشف المجتمعات المتاحة وانضم إلى ما يلائم اهتماماتك لتتابع النقاشات وتشارك في صناعة المحتوى.
              </p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {myGroups.map((g) => (
                <GroupCard key={g.id} group={g} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Discover */}
        <TabsContent value="discover">
          {discoverGroups.length === 0 ? (
            <Card className="border-card-border text-center py-16 text-muted-foreground p-6 space-y-3 bg-card">
              <CheckCircle2 className="w-12 h-12 mx-auto opacity-40 text-emerald-600" />
              <p className="font-bold text-foreground text-base">أنت منضم بالفعل لجميع المجتمعات المتاحة!</p>
              <p className="text-xs max-w-sm mx-auto leading-relaxed">
                تابع التفاعل في مجتمعاتك أو بادر بتأسيس مجتمع جديد يقود فكرة أو مبادرة ملهمة.
              </p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {discoverGroups.map((g) => (
                <GroupCard key={g.id} group={g} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onGroupCreated={handleGroupCreated}
      />
    </div>
  );
}
