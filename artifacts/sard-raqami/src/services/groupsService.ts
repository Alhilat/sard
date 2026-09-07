import { api, tokenStorage } from '@/lib/api';
import { Post } from './postsService';

function getActiveGroupAuthor() {
  const user = tokenStorage.getUser<any>();
  if (user && user.name) {
    return {
      id: user.id || 'usr-me',
      name: user.name,
      username: user.username || user.email?.split('@')[0] || 'user',
      avatar: user.avatar || '',
    };
  }
  return {
    id: 'usr-default',
    name: 'مستخدم سرد',
    username: 'user',
    avatar: '',
  };
}

export interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
  privacy: 'عام' | 'خاص' | string;
  avatar?: string;
  coverGradient?: string;
  accentColor?: string;
  members: number;
  posts: number;
  joined?: boolean;
  rules?: string[];
  created_at?: string;
  tagline?: string;
}

export interface GroupMember {
  id: string;
  name: string;
  username: string;
  role: 'مؤسس' | 'مشرف' | 'عضو متميز' | 'عضو نشط' | 'عضو';
  avatar?: string;
  joined_at: string;
}

// Rich initial Arabic communities
const initialArabicGroups: Group[] = [
  {
    id: 'g1',
    name: 'مجتمع مطوري البرمجيات العرب',
    tagline: 'منصة لتبادل المعرفة البرمجية وبناء حلول تقنية عربية رائدة',
    description: 'ملتقى يجمع نخبة المطورين والمهندسين العرب لتبادل الخبرات المعمارية، ونقاش أحدث التقنيات وأفضل ممارسات البرمجة وهندسة البرمجيات.',
    category: 'تقنية',
    privacy: 'عام',
    members: 5,
    posts: 2,
    joined: true,
    coverGradient: 'from-[#6B1B1B] via-[#8C2424] to-[#3B0E0E]',
    accentColor: '#8C2424',
    created_at: 'منذ عامين',
    rules: [
      'الاحترام المتبادل وتقديم النقد البرمجي البنّاء.',
      'طرح الأسئلة التقنية مدعومة بسياق المشكلة والحلول المجربة.',
      'دعم المشاريع مفتوحة المصدر والمحتوى التقني العربي الهادف.',
      'منع الإعلانات التجارية غير المصرح بها أو الرسائل العشوائية.',
    ],
  },
  {
    id: 'g2',
    name: 'رواد العمل التطوعي وصنّاع الأثر',
    tagline: 'مبادرات ميدانية ورقمية لخدمة المجتمع وبناء التكافل',
    description: 'مجتمع يربط المتطوعين والناشطين لتنسيق المبادرات المجتمعية، والمشاريع الخيرية، ونشر ثقافة العطاء والعمل التطوعي في العالم العربي.',
    category: 'تطوع',
    privacy: 'عام',
    members: 3,
    posts: 1,
    joined: true,
    coverGradient: 'from-[#1B4D3E] via-[#236854] to-[#123329]',
    accentColor: '#236854',
    created_at: 'منذ سنة ونصف',
    rules: [
      'الالتزام بالشفافية والعمل بروح الفريق الواحد.',
      'التركيز على المبادرات المرخصة والأنشطة ذات الأثر الملموس.',
      'مشاركة التقارير والتوثيق للمبادرات المنفذة لإلهام الآخرين.',
    ],
  },
  {
    id: 'g3',
    name: 'شبكة رواد الأعمال والمشاريع الناشئة',
    tagline: 'فضاء بناء الشركات، الشراكات الاستثمارية، والابتكار الريادي',
    description: 'فضاء مخصص لرواد الأعمال والمستثمرين لتبادل دراسات الجدوى، نقاش نماذج الأعمال، واستراتيجيات التوسع وتجاوز تحديات تأسيس الشركات الناشئة.',
    category: 'ريادة أعمال',
    privacy: 'عام',
    members: 2,
    posts: 0,
    joined: false,
    coverGradient: 'from-[#7A4B17] via-[#A06522] to-[#452707]',
    accentColor: '#A06522',
    created_at: 'منذ عام',
    rules: [
      'احترام الملكية الفكرية وسرية المعلومات الاستثمارية.',
      'مشاركة التجارب الريادية الواقعية بشفافية ومصداقية.',
      'الالتزام بآداب العرض الاستثماري والنقاش المهني الراقي.',
    ],
  },
  {
    id: 'g4',
    name: 'ملتقى التصميم وتجربة المستخدم (UX/UI)',
    tagline: 'حوارات التصميم الرقمي، التفاعل الإنساني، والهوية البصرية',
    description: 'مساحة للمصممين ومطوري الواجهات لتبادل التغذية البصرية، نقد تجارب الاستخدام، ومشاركة أنظمة التصميم العربية الحديثة.',
    category: 'تصميم',
    privacy: 'عام',
    members: 2,
    posts: 0,
    joined: false,
    coverGradient: 'from-[#2B3A67] via-[#3B5090] to-[#17203B]',
    accentColor: '#3B5090',
    created_at: 'منذ ٨ أشهر',
    rules: [
      'تقديم النقد الفني بطريقة إيجابية ومعللة.',
      'نسب الأعمال لأصحابها ومراعاة حقوق التصميم.',
      'مشاركة الملفات والمصادر القابلة لإعادة الاستخدام مع الزملاء.',
    ],
  },
  {
    id: 'g5',
    name: 'صالون السرد والأدب الرقمي',
    tagline: 'حيث يلتقي جمال الحرف وعمق المعنى في فضاء السرد العربي',
    description: 'صالون أدبي وثقافي يجمع الكتّاب، القرّاء، ومحبي الفنون السردية لنقاش الروايات، كتابة المقالات، وتطوير أساليب التعبير الأدبي.',
    category: 'ثقافة وسرد',
    privacy: 'خاص',
    members: 3,
    posts: 1,
    joined: true,
    coverGradient: 'from-[#5C243B] via-[#7B314F] to-[#361321]',
    accentColor: '#7B314F',
    created_at: 'منذ سنتين',
    rules: [
      'الحفاظ على سلامة اللغة العربية وجودة التعبير الفني.',
      'تقبل الرؤى النقدية المختلفة ومراعاة الذوق الأدبي الرفيع.',
      'الالتزام بنشر الإنتاج الأدبي الأصيل وتجنب الاقتباسات غير المنسوبة.',
    ],
  },
  {
    id: 'g6',
    name: 'مبادرة الاستدامة والبيئة الخضراء',
    tagline: 'أفكار وممارسات بيئية نحو مستقبل مستدام ومناخ أفضل',
    description: 'مجموعة مكرسة لتعزيز الوعي البيئي، ونقاش مبادرات التشجير، وإعادة التدوير، والحلول الصديقة للبيئة في مجتمعاتنا.',
    category: 'بيئة ومناخ',
    privacy: 'عام',
    members: 4180,
    posts: 98,
    joined: false,
    coverGradient: 'from-[#2D5A27] via-[#3B7A33] to-[#1A3816]',
    accentColor: '#3B7A33',
    created_at: 'منذ ٥ أشهر',
    rules: [
      'مشاركة المعلومات البيئية الموثوقة علمياً.',
      'التركيز على التطبيقات العملية القابلة للتنفيذ على مستوى الأفراد والمؤسسات.',
      'دعم المبادرات الوطنية للتشجير وحماية الموارد الطبيعية.',
    ],
  },
];

let currentGroups: Group[] = [...initialArabicGroups];

const groupPostsStore: Record<string, Post[]> = {
  g1: [
    {
      id: 'gp1',
      groupId: 'g1',
      author: { id: '2', name: 'سارة عبدالله الأحمد', username: 'sara.ahmad', avatar: '' },
      content: 'ما هي أفضل الممارسات التي تتبعونها في بناء أنظمة تصميم (Design Systems) قابلة للتوسع والتكيف مع الخطوط والاتجاه العربي (RTL) في المشاريع الضخمة؟ شاركونا خبراتكم!',
      likes: 36,
      comments: 8,
      shares: 5,
      timestamp: 'منذ ساعتين',
    },
    {
      id: 'gp2',
      groupId: 'g1',
      author: { id: '3', name: 'م. طارق بن خالد العتيبي', username: 'tariq.otaibi', avatar: '' },
      content: 'نصيحة تقنية مهمة: عند بناء استعلامات قواعد البيانات ذات الحمل العالي، احرص دائماً على فحص خطط التنفيذ (Execution Plans) وإنشاء الفهارس المناسبة على الحقول الأكثر طلباً لتقليل زمن الاستجابة.',
      likes: 54,
      comments: 14,
      shares: 12,
      timestamp: 'أمس الساعة ٤:٣٠ م',
    },
  ],
  g2: [
    {
      id: 'gp3',
      groupId: 'g2',
      author: { id: '1', name: 'أحمد محمد الزهراني', username: 'ahmed.zahrani', avatar: '' },
      content: 'بحمد الله نعلن عن فتح باب التسجيل في مبادرة "غراس الرياض" التطوعية للتشجير المقامة السبت القادم. نهدف لزراعة ٥٠٠ شتلة برية محلية. شاركونا في صناعة الأثر!',
      likes: 48,
      comments: 19,
      shares: 16,
      timestamp: 'منذ ٣ ساعات',
    },
  ],
  g5: [
    {
      id: 'gp4',
      groupId: 'g5',
      author: { id: '4', name: 'د. ليلى السليمان', username: 'layla.sulaiman', avatar: '' },
      content: 'في جلسة قراءة هذا الأسبوع، نناقش كتاب "عبقرية السرد في الأدب العربي". ما هو أكثر عمل روائي عربي أثر في تشكيل رؤيتكم للحياة والواقع؟ يسعدنا سماع ترشيحاتكم.',
      likes: 42,
      comments: 11,
      shares: 7,
      timestamp: 'منذ يومين',
    },
  ],
};

const groupMembersStore: Record<string, GroupMember[]> = {
  g1: [
    { id: '1', name: 'أحمد محمد الزهراني', username: 'ahmed.zahrani', role: 'مؤسس', joined_at: 'منذ سنتين' },
    { id: '2', name: 'سارة عبدالله الأحمد', username: 'sara.ahmad', role: 'مشرف', joined_at: 'منذ سنة ونصف' },
    { id: '3', name: 'م. طارق بن خالد العتيبي', username: 'tariq.otaibi', role: 'عضو متميز', joined_at: 'منذ سنة' },
    { id: '4', name: 'نورة سعد الربيعي', username: 'noura.rabiee', role: 'عضو نشط', joined_at: 'منذ ٦ أشهر' },
    { id: '5', name: 'فهد إبراهيم الدوسري', username: 'fahad.dossari', role: 'عضو', joined_at: 'منذ شهرين' },
  ],
  g2: [
    { id: '1', name: 'أحمد محمد الزهراني', username: 'ahmed.zahrani', role: 'مشرف', joined_at: 'منذ سنة ونصف' },
    { id: '6', name: 'ريم فيصل الحربي', username: 'reem.harbi', role: 'عضو متميز', joined_at: 'منذ سنة' },
    { id: '7', name: 'سلطان عبدالعزيز المقرن', username: 'sultan.muqrin', role: 'عضو نشط', joined_at: 'منذ ٨ أشهر' },
  ],
  g5: [
    { id: '4', name: 'د. ليلى السليمان', username: 'layla.sulaiman', role: 'مؤسس', joined_at: 'منذ سنتين' },
    { id: '8', name: 'عبدالله ناصر الشهري', username: 'abdullah.shehri', role: 'مشرف', joined_at: 'منذ سنة' },
    { id: '9', name: 'أمل بدر العيسى', username: 'amal.essa', role: 'عضو متميز', joined_at: 'منذ ٧ أشهر' },
  ],
};

export const groupsService = {
  getGroups: async (query?: { search?: string; category?: string }): Promise<Group[]> => {
    try {
      const res = await api.get<{ groups?: any[]; data?: any[] }>('/groups', query);
      if (Array.isArray(res)) return res;
      if (res?.groups && Array.isArray(res.groups)) return res.groups;
      if (res?.data && Array.isArray(res.data)) return res.data;
    } catch {
      // Fall back to local store
    }

    let result = [...currentGroups];
    if (query?.search) {
      const s = query.search.trim().toLowerCase();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(s) ||
          g.description.toLowerCase().includes(s) ||
          (g.tagline && g.tagline.toLowerCase().includes(s))
      );
    }
    if (query?.category && query.category !== 'الكل') {
      const cat = query.category;
      result = result.filter((g) => g.category.includes(cat) || cat.includes(g.category));
    }
    return result;
  },

  getGroupById: async (groupId: string): Promise<Group | undefined> => {
    try {
      const res = await api.get<Group>(`/groups/${groupId}`);
      if (res) return res;
    } catch {
      // fallback
    }
    return currentGroups.find((g) => g.id === groupId);
  },

  createGroup: async (data: {
    name: string;
    description: string;
    category: string;
    privacy: 'عام' | 'خاص';
    rules?: string[];
  }): Promise<Group> => {
    try {
      const res = await api.post<any>('/groups', {
        name: data.name,
        description: data.description,
        category: data.category,
        privacy: data.privacy,
        visibility: data.privacy === 'عام' ? 'public' : 'private',
        rules: data.rules,
      });
      const groupData = res?.group || res?.data || res;
      if (groupData && (groupData.id || groupData.groupId)) {
        const fullGroup: Group = {
          id: groupData.id || groupData.groupId,
          name: groupData.name || data.name,
          tagline: groupData.tagline || 'مجتمع جديد انضم إلى فضاء منصة سرد رقمي',
          description: groupData.description || data.description,
          category: groupData.category || data.category,
          privacy: groupData.privacy || data.privacy,
          members: groupData.members || 1,
          posts: groupData.posts || 0,
          joined: true,
          coverGradient: groupData.coverGradient || 'from-[#6B1B1B] via-[#8C2424] to-[#3B0E0E]',
          accentColor: groupData.accentColor || '#8C2424',
          rules: groupData.rules || data.rules || ['الاحترام المتبادل بين جميع الأعضاء ومراعاة آداب الحوار.'],
          created_at: 'الآن',
        };
        currentGroups.unshift(fullGroup);
        return fullGroup;
      }
    } catch {
      // fallback
    }

    const newGroup: Group = {
      id: `g-${Date.now()}`,
      name: data.name,
      tagline: 'مجتمع جديد انضم إلى فضاء منصة سرد رقمي',
      description: data.description,
      category: data.category,
      privacy: data.privacy,
      members: 1,
      posts: 0,
      joined: true,
      coverGradient: 'from-[#6B1B1B] via-[#8C2424] to-[#3B0E0E]',
      accentColor: '#8C2424',
      rules: data.rules && data.rules.length > 0 ? data.rules : [
        'الاحترام المتبادل بين جميع الأعضاء ومراعاة آداب الحوار.',
        'مشاركة المحتوى المرتبط بمجال واهتمامات المجتمع فقط.',
        'الحفاظ على خصوصية الأعضاء ومنع الإعلانات العشوائية.',
      ],
      created_at: 'الآن',
    };

    const author = getActiveGroupAuthor();

    currentGroups.unshift(newGroup);
    groupPostsStore[newGroup.id] = [];
    groupMembersStore[newGroup.id] = [
      { id: author.id, name: author.name, username: author.username, role: 'مؤسس', joined_at: 'الآن' },
    ];

    return newGroup;
  },

  toggleMembership: async (groupId: string, currentlyJoined: boolean): Promise<boolean> => {
    const targetState = !currentlyJoined;
    try {
      if (targetState) {
        await api.post(`/groups/${groupId}/join`);
      } else {
        await api.delete(`/groups/${groupId}/leave`);
      }
    } catch {
      // Fallback
    }

    currentGroups = currentGroups.map((g) => {
      if (g.id === groupId) {
        return {
          ...g,
          joined: targetState,
          members: targetState ? g.members + 1 : Math.max(1, g.members - 1),
        };
      }
      return g;
    });

    return targetState;
  },

  getGroupPosts: async (groupId: string): Promise<Post[]> => {
    try {
      const posts = await postsService.getPosts(groupId);
      if (Array.isArray(posts) && posts.length > 0) {
        groupPostsStore[groupId] = posts;
        return posts;
      }
    } catch {
      // fallback
    }
    return groupPostsStore[groupId] || [];
  },

  createGroupPost: async (groupId: string, content: string): Promise<Post> => {
    try {
      const newPost = await postsService.createPost({
        content,
        groupId,
      });
      if (newPost && newPost.id) {
        if (!groupPostsStore[groupId]) {
          groupPostsStore[groupId] = [];
        }
        groupPostsStore[groupId].unshift(newPost);
        currentGroups = currentGroups.map((g) => (g.id === groupId ? { ...g, posts: g.posts + 1 } : g));
        return newPost;
      }
    } catch {
      // fallback
    }

    const author = getActiveGroupAuthor();
    const newPost: Post = {
      id: `gp-${Date.now()}`,
      groupId,
      author: {
        id: author.id,
        name: author.name,
        username: author.username,
        avatar: author.avatar,
      },
      content,
      likes: 0,
      comments: 0,
      shares: 0,
      timestamp: 'الآن',
      isLiked: false,
    };

    if (!groupPostsStore[groupId]) {
      groupPostsStore[groupId] = [];
    }
    groupPostsStore[groupId].unshift(newPost);

    // Increment group post count
    currentGroups = currentGroups.map((g) => (g.id === groupId ? { ...g, posts: g.posts + 1 } : g));

    return newPost;
  },

  getGroupMembers: async (groupId: string): Promise<GroupMember[]> => {
    try {
      const res = await api.get<{ members?: GroupMember[]; data?: GroupMember[] }>(`/groups/${groupId}/members`);
      if (Array.isArray(res)) return res;
      if (res?.members && Array.isArray(res.members) && res.members.length > 0) return res.members;
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) return res.data;
    } catch {
      // fallback
    }
    const author = getActiveGroupAuthor();
    return (
      groupMembersStore[groupId] || [
        { id: author.id, name: author.name, username: author.username, role: 'عضو نشط', joined_at: 'منذ قليل' },
      ]
    );
  },
};
