import { api } from '@/lib/api';

export type ChatPermissionMode = 'all' | 'instructor_only' | 'muted';

export interface CourseInstructor {
  id: string;
  name: string;
  title: string;
  role: string;
  avatar?: string;
  bio: string;
  experience: string;
  rating: number;
  studentsTaught: number;
}

export interface CourseSyllabusItem {
  title: string;
  hours: number;
  lessons: string[];
}

export interface Course {
  id: string;
  title: string;
  tagline?: string;
  category: string;
  level: 'مبتدئ' | 'متوسط' | 'متقدم' | 'جميع المستويات' | string;
  duration: string;
  totalHours: number;
  lectures: number;
  students: number;
  rating: number;
  price: string;
  enrolled: boolean;
  progress: number;
  instructor: CourseInstructor;
  org: {
    id: string;
    name: string;
    avatar?: string;
  };
  description: string;
  syllabus: CourseSyllabusItem[];
  outcomes: string[];
  prerequisites: string[];
  certificate: string;
  coverGradient?: string;
}

export interface ChatMessage {
  id: string;
  courseId: string;
  senderId: string;
  senderName: string;
  senderRole: 'instructor' | 'student' | 'admin';
  senderAvatar?: string;
  content: string;
  timestamp: string;
  isAnnouncement?: boolean;
}

export interface CourseChatSettings {
  courseId: string;
  permissionMode: ChatPermissionMode;
  pinnedAnnouncement?: string;
  slowModeSeconds?: number;
}

// Initial courses mock data
const initialCourses: Course[] = [
  {
    id: 'c1',
    title: 'مقدمة في البرمجة وهندسة البرمجيات بلغة Python',
    tagline: 'تأسيس احترافي من الصفر حتى بناء التطبيقات وقواعد البيانات المتكاملة',
    category: 'برمجة',
    level: 'مبتدئ',
    duration: '٨ أسابيع',
    totalHours: 48,
    lectures: 24,
    students: 0,
    rating: 0,
    price: 'مجاني',
    enrolled: false,
    progress: 0,
    coverGradient: 'from-[#6B1B1B] via-[#8C2424] to-[#3B0E0E]',
    instructor: {
      id: 'inst-1',
      name: 'م. فيصل بن عبدالعزيز الراشد',
      title: 'كبير مهندسي البرمجيات ومستشار التقنية',
      role: 'معلم الدورة ومسؤول المنهج',
      bio: 'خبير برمجيات يتمتع بخبرة تزيد عن ١٢ عاماً في تطوير الأنظمة الموزعة وهندسة الحلول السحابية. درب العديد من الكفاءات في العالم العربي.',
      experience: '١٢ عاماً من الخبرة العملية',
      rating: 0,
      studentsTaught: 0,
    },
    org: { id: 'org2', name: 'أكاديمية سرد الرقمية', avatar: '' },
    description: 'دورة تطبيقية شاملة تركز على البناء المعرفي والعملي لمفاهيم البرمجة الحديثة باستخدام بايثون. ستتعلم أصول كتابة الكود النظيف، وهياكل البيانات، والتعامل مع المكتبات المتقدمة، وبناء مشاريع حقيقية تلائم سوق العمل التقني الحديث.',
    syllabus: [
      {
        title: 'الوحدة الأولى: المفاهيم الأساسية وبيئة التطوير',
        hours: 10,
        lessons: ['تهيئة بيئة العمل ومحرر الأكواد', 'المتغيرات وأنواع البيانات والجمل الشرطية', 'الحلقات التكرارية والدوال المعيارية'],
      },
      {
        title: 'الوحدة الثانية: هياكل البيانات والخوارزميات',
        hours: 14,
        lessons: ['القوائم والمجموعات والقواميس المتقدمة', 'التعامل مع الأخطاء والاستثناءات', 'كتابة الخوارزميات وتحليل كفاءة التعقيد'],
      },
      {
        title: 'الوحدة الثالثة: البرمجة كائنية التوجه (OOP)',
        hours: 12,
        lessons: ['الفئات والكائنات (Classes & Objects)', 'الوراثة وتعدد الأوجه والكبسلة', 'تطبيق عملي: نظام إدارة محتوى مصغر'],
      },
      {
        title: 'الوحدة الرابعة: قواعد البيانات ومشروع التخرج',
        hours: 12,
        lessons: ['الربط مع قواعد بيانات SQLite وPostgreSQL', 'بناء واجهة برمجية RESTful API', 'تسليم ومراجعة المشروع الختامي'],
      },
    ],
    outcomes: [
      'إتقان لغة Python والقدرة على كتابة أكواد برمجية نظيفة وقابلة للصيانة.',
      'بناء برمجيات تطبيقية والربط الفعلي مع قواعد البيانات.',
      'فهم عميق لمبادئ البرمجة كائنية التوجه (OOP) وهندسة البرمجيات.',
      'الحصول على شهادة إتمام معتمدة وإنجاز مشروع تخرج حقيقي لمحفظة أعمالك.',
    ],
    prerequisites: ['معرفة أساسية باستخدام الحاسوب والإنترنت', 'لا يشترط وجود أي خبرة سابقة بالبرمجة'],
    certificate: 'شهادة إتمام معتمدة من منصة سرد رقمي والجهة التعليمية',
  },
  {
    id: 'c2',
    title: 'أساسيات وتطبيقات الذكاء الاصطناعي التوليدي',
    tagline: 'اكتشف تقنيات التعلم الآلي وبناء حلول الذكاء الاصطناعي بطريقة عملية',
    category: 'تقنية',
    level: 'متوسط',
    duration: '١٢ أسبوعاً',
    totalHours: 60,
    lectures: 36,
    students: 0,
    rating: 0,
    price: '٢٩٩ ريال',
    enrolled: false,
    progress: 0,
    coverGradient: 'from-[#1B3B6F] via-[#28559A] to-[#122444]',
    instructor: {
      id: 'inst-2',
      name: 'د. نورة بنت فهد الهديب',
      title: 'أستاذة الذكاء الاصطناعي والتعلم الآلي المشارك',
      role: 'معلمة الدورة والمشرفة الأكاديمية',
      bio: 'باحثة في هندسة النماذج اللغوية الضخمة وتطبيقات الرؤية الحاسوبية، حاصلة على الدكتوراه في علوم الحاسب وقادت العديد من مبادرات الذكاء الاصطناعي الوطنية.',
      experience: '١٠ سنوات في البحث والتطوير التقني',
      rating: 0,
      studentsTaught: 0,
    },
    org: { id: 'org2', name: 'مركز الذكاء الاصطناعي والتقنيات الناشئة', avatar: '' },
    description: 'رحلة معرفية تطبيقية تأخذك إلى أعماق الذكاء الاصطناعي، بدءاً من فهم الرياضيات الكامنة خلف نماذج التعلم العميق وحتى تدريب النماذج وبناء تطبيقات تعتمد على الذكاء الاصطناعي التوليدي والواجهات البرمجية.',
    syllabus: [
      {
        title: 'الوحدة الأولى: مدخل إلى التعلم الآلي والبيانات',
        hours: 15,
        lessons: ['مفاهيم التعلم الخاضع للإشراف وغير الخاضع', 'معالجة البيانات وتنظيفها باستخدام Pandas', 'بناء أول نموذج تصنيف تنبؤي'],
      },
      {
        title: 'الوحدة الثانية: الشبكات العصبية العميقة (Deep Learning)',
        hours: 15,
        lessons: ['معمارية الشبكات العصبية ودوال التنشيط', 'تدريب النماذج وتفادي فرط التخصيص (Overfitting)', 'التعامل مع مكتبة PyTorch'],
      },
      {
        title: 'الوحدة الثالثة: النماذج اللغوية الكبيرة والذكاء التوليدي',
        hours: 15,
        lessons: ['بنية محولات الإنتباه (Transformers)', 'هندسة الأوامر (Prompt Engineering) المتقدمة', 'الربط البرمجي مع نماذج LLMs عبر APIs'],
      },
      {
        title: 'الوحدة الرابعة: بناء تطبيق معتمد على الذكاء الاصطناعي والمشروع',
        hours: 15,
        lessons: ['تطوير مساعد ذكي متكامل للمؤسسات', 'نشر النموذج على السحابة وربطه بواجهة مستخدم', 'مناقشة وتقييم المشروع النهائي'],
      },
    ],
    outcomes: [
      'فهم نظري وعملي شامل لخوارزميات التعلم الآلي والعميق.',
      'بناء وتطوير حلول تعتمد على الذكاء الاصطناعي التوليدي.',
      'القدرة على دمج واجهات الذكاء الاصطناعي في التطبيقات الواقعية.',
      'شهادة معتمدة ومشروع عملي نوعي.',
    ],
    prerequisites: ['إلمام بأساسيات لغة بايثون والمفاهيم الرياضية الأولية'],
    certificate: 'شهادة تخصص مهني معتمدة في الذكاء الاصطناعي التوليدي',
  },
  {
    id: 'c3',
    title: 'مهارات القيادة المؤسسية وصناعة التأثير',
    tagline: 'منهجية عملية لبناء فرق العمل عالية الأداء وإدارة التغيير الإيجابي',
    category: 'تطوير ذاتي',
    level: 'جميع المستويات',
    duration: '٦ أسابيع',
    totalHours: 36,
    lectures: 18,
    students: 0,
    rating: 0,
    price: 'مجاني',
    enrolled: false,
    progress: 0,
    coverGradient: 'from-[#1B4D3E] via-[#236854] to-[#123329]',
    instructor: {
      id: 'inst-3',
      name: 'أ. طلال بن سعد الخالدي',
      title: 'مستشار التطوير القيادي وبناء المؤسسات',
      role: 'معلم الدورة وميسر الجلسات',
      bio: 'مستشار تنفيذي معتمد ساهم في تطوير القيادات في كبرى المنظمات غير الربحية والشركات الحكومية والخاصة.',
      experience: '١٥ عاماً في الاستشارات القيادية',
      rating: 0,
      studentsTaught: 0,
    },
    org: { id: 'org1', name: 'معهد القيادة والتأثير', avatar: '' },
    description: 'تعلّم كيف تقود بثقة، وتبني بيئات عمل محفزة ومبتكرة. تركز الدورة على علم النفس القيادي، والتواصل الإقناعي، وفن التفاوض وحل النزاعات وإدارة التغيير المؤسسي.',
    syllabus: [
      {
        title: 'الوحدة الأولى: هوية القائد والذكاء العاطفي',
        hours: 12,
        lessons: ['استكشاف الأنماط القيادية ونقاط القوة', 'الذكاء العاطفي وإدارة الضغوط والمواقف الصعبة', 'بناء الثقة ومصداقية التأثير'],
      },
      {
        title: 'الوحدة الثانية: بناء وتحفيز الفرق عالية الأداء',
        hours: 12,
        lessons: ['آليات اختيار وتوزيع الأدوار في الفريق', 'التواصل الفعال وإدارة النزاعات البنّاءة', 'تمكين الأعضاء وتفويض المسؤوليات'],
      },
      {
        title: 'الوحدة الثالثة: إدارة التغيير وصناعة الرؤية الاستراتيجية',
        hours: 12,
        lessons: ['صياغة الأهداف الاستراتيجية ومؤشرات الأداء (OKRs)', 'قيادة التحول المؤسسي وتجاوز مقاومة التغيير', 'دراسات حالة لقيادات ملهمة'],
      },
    ],
    outcomes: [
      'امتلاك أدوات عملية لقيادة الفرق وتحقيق الأهداف بكفاءة عالية.',
      'تطوير الذكاء العاطفي والتواصل المؤثر مع مختلف الشخصيات.',
      'القدرة على توجيه الأزمات وإدارة التغيير في بيئات العمل المتغيرة.',
    ],
    prerequisites: ['الرغبة في تطوير الذات وتولي أدوار قيادية'],
    certificate: 'شهادة قيادية معتمدة وموثقة',
  },
  {
    id: 'c4',
    title: 'تصميم واجهات وتجربة المستخدم الاحترافية (UI/UX)',
    tagline: 'من فهم المستخدم والبحث التحليلي إلى تصميم النماذج التفاعلية المتقنة',
    category: 'تصميم',
    level: 'متوسط',
    duration: '١٠ أسابيع',
    totalHours: 50,
    lectures: 30,
    students: 0,
    rating: 0,
    price: '١٩٩ ريال',
    enrolled: false,
    progress: 0,
    coverGradient: 'from-[#5C243B] via-[#7B314F] to-[#361321]',
    instructor: {
      id: 'inst-4',
      name: 'م. ريان بن خالد العتيبي',
      title: 'مدير تجربة المستخدم ومصمم المنتجات الرقمية',
      role: 'معلم الدورة ومدرب التطبيق العملي',
      bio: 'مصمم منتجات رقمية بخبرة ٩ سنوات في تصميم تطبيقات حكومية ومالية رائدة، ومؤسس مجتمع مصممي واجهات الاستخدام العرب.',
      experience: '٩ سنوات في تصميم المنتجات الرقمية',
      rating: 0,
      studentsTaught: 0,
    },
    org: { id: 'org3', name: 'استوديو الابتكار الرقمي', avatar: '' },
    description: 'دورة تفاعلية تدربك على منهجية التصميم المرتكز على الإنسان (Human-Centered Design). ستتقن استخدام Figma، وبناء أنظمة التصميم (Design Systems) التي تدعم العربية RTL، وتجربة نماذج تفاعلية واختبار سهولة الاستخدام.',
    syllabus: [
      {
        title: 'الوحدة الأولى: أبحاث المستخدم وبناء شخصيات الاستخدام',
        hours: 14,
        lessons: ['منهجيات البحث النوعي والكمي', 'رسم رحلة المستخدم (User Journey Maps)', 'هندسة المعلومات وبناء شجرة التطبيق'],
      },
      {
        title: 'الوحدة الثانية: السلكيات (Wireframing) واحتراف Figma',
        hours: 18,
        lessons: ['رسم النماذج منخفضة وعالية الدقة', 'استخدام Auto-Layout والمكونات الذكية', 'بناء أنظمة التصميم المتوافقة مع RTL'],
      },
      {
        title: 'الوحدة الثالثة: النماذج التفاعلية واختبار قابلية الاستخدام',
        hours: 18,
        lessons: ['التحريك التفاعلي (Prototyping)', 'إجراء جلسات اختبار الاستخدام مع مستخدمين حقيقيين', 'تجهيز ملفات التصميم للتسليم للمطورين'],
      },
    ],
    outcomes: [
      'بناء نماذج تفاعلية كاملة للمواقع وتطبيقات الهواتف الذكية.',
      'احتراف أدوات Figma المتقدمة وأنظمة التصميم القابلة للتوسع.',
      'فهم معايير سهولة الاستخدام وتكييف الواجهات للغة العربية.',
    ],
    prerequisites: ['حاسوب يدعم تشغيل أداة Figma وحس جمالي وفضول نحو التصميم'],
    certificate: 'شهادة إتمام احترافية في تصميم تجربة وواجهات المستخدم',
  },
  {
    id: 'c5',
    title: 'ريادة الأعمال: من الفكرة إلى إطلاق المشروع والتمويل',
    tagline: 'دليلك الشامل لبناء نموذج العمل، التحقق من السوق، وجذب المستثمرين',
    category: 'ريادة أعمال',
    level: 'مبتدئ',
    duration: '٨ أسابيع',
    totalHours: 44,
    lectures: 22,
    students: 0,
    rating: 0,
    price: '١٤٩ ريال',
    enrolled: false,
    progress: 0,
    coverGradient: 'from-[#7A4B17] via-[#A06522] to-[#452707]',
    instructor: {
      id: 'inst-5',
      name: 'أ. هيفاء بنت منصور السديري',
      title: 'مستثمرة ملائكية وشريكة مؤسسة لصندوق رأس مال جريء',
      role: 'معلمة الدورة ومستشارة المشاريع',
      bio: 'رائدة أعمال ومستثمرة سابقة أسست شركتين ناشئتين ناجحتين، وتقدم استشارات استراتيجية للمشاريع الريادية في منطقة الخليج.',
      experience: '١٤ عاماً في منظومة ريادة الأعمال',
      rating: 0,
      studentsTaught: 0,
    },
    org: { id: 'org5', name: 'حاضنة الأعمال والابتكار', avatar: '' },
    description: 'تعلّم خطوات تأسيس الشركات الناشئة بأسلوب منهجي موثوق: بدءاً من دراسة حاجة السوق، وبناء نموذج العمل التجاري (Business Model Canvas)، وحتى إعداد العرض الاستثماري (Pitch Deck) ومقابلة المستثمرين.',
    syllabus: [
      {
        title: 'الوحدة الأولى: التحقق من الفكرة وحجم السوق',
        hours: 12,
        lessons: ['معايير اختيار الفكرة الريادية القابلة للتوسع', 'تحليل السوق والمنافسين وتحديد الشريحة المستهدفة', 'بناء واختبار النموذج الأولي الأدنى (MVP)'],
      },
      {
        title: 'الوحدة الثانية: نموذج العمل والنمو المالي',
        hours: 16,
        lessons: ['هيكلة نموذج الإيرادات والتكاليف', 'استراتيجيات التسويق والنمو واكتساب العملاء', 'بناء الخطة المالية التقديرية للسنوات الثلاث الأولى'],
      },
      {
        title: 'الوحدة الثالثة: جولات الاستثمار والتفاوض مع الصناديق',
        hours: 16,
        lessons: ['أنواع التمويل: التمويل الذاتي، المستثمرون الملائكيون، وصناديق الجريء', 'إعداد العرض الاستثماري المؤثر (Pitch Deck)', 'فهم بنود اتفاقية الاستثمار وتقييم الشركة'],
      },
    ],
    outcomes: [
      'القدرة على تحويل أي فكرة مبتكرة إلى خطة عمل قابلة للتنفيذ والاستثمار.',
      'بناء النموذج المالي الأولي والعرض التقديمي للمستثمرين.',
      'تجنب الأخطاء القاتلة التي تواجه الشركات الناشئة في بداياتها.',
    ],
    prerequisites: ['فكرة مشروع ناشئ أو شغف في عالم ريادة الأعمال والاستثمار'],
    certificate: 'شهادة ريادة أعمال معتمدة',
  },
];

let coursesState: Course[] = [...initialCourses];

// Group Chat Settings Store
const chatSettingsStore: Record<string, CourseChatSettings> = {
  c1: {
    courseId: 'c1',
    permissionMode: 'all',
    pinnedAnnouncement: 'مرحباً بكم جميعاً في مجتمع الدورة! المحاضرة المباشرة القادمة يوم الأربعاء الساعة ٨ مساءً، لا تنسوا مراجعة واجب الوحدة الثانية.',
  },
  c2: {
    courseId: 'c2',
    permissionMode: 'instructor_only',
    pinnedAnnouncement: 'قناة الدورة الرسمية للإعلانات والتوجيهات: سيتم نشر رابط جلسة الأسئلة والأجوبة هنا قبل الموعد بساعة.',
  },
  c3: {
    courseId: 'c3',
    permissionMode: 'all',
    pinnedAnnouncement: 'تم الانتهاء من مراجعة تقييمات التخرج، يمكنكم تحميل شهاداتكم الآن من صفحة الدورة.',
  },
  c4: {
    courseId: 'c4',
    permissionMode: 'all',
  },
  c5: {
    courseId: 'c5',
    permissionMode: 'all',
  },
};

// Course Chat Messages Store
const chatMessagesStore: Record<string, ChatMessage[]> = {
  c1: [
    {
      id: 'm1',
      courseId: 'c1',
      senderId: 'inst-1',
      senderName: 'م. فيصل بن عبدالعزيز الراشد',
      senderRole: 'instructor',
      content: 'أهلاً وسهلاً بجميع الطلاب المنضمين لدورة بايثون وهندسة البرمجيات! هذه المساحة مخصصة لتبادل الأسئلة، ومناقشة الحلول، والتنسيق للمحاضرات المباشرة. لا تترددوا في طرح أي استفسار.',
      timestamp: 'منذ يومين',
      isAnnouncement: true,
    },
    {
      id: 'm2',
      courseId: 'c1',
      senderId: 'std-1',
      senderName: 'سارة الأحمد',
      senderRole: 'student',
      content: 'شكراً م. فيصل على الشرح الرائع في درس الدوال والتكرار! واجهت نقطة بسيطة في فهم الـ List Comprehension وكيفية استخدام الشروط المركبة، هل يمكن توضيحها بمثال سريع؟',
      timestamp: 'منذ ٥ ساعات',
    },
    {
      id: 'm3',
      courseId: 'c1',
      senderId: 'inst-1',
      senderName: 'م. فيصل بن عبدالعزيز الراشد',
      senderRole: 'instructor',
      content: 'أهلاً سارة، سؤال ممتاز! تذكري أن القاعدة العامة هي:\n`[expression for item in iterable if condition]`\nسأرفق لكم في المحاضرة القادمة ورقة مرجعية (Cheat Sheet) تيسر فهم كافة حالاتها مع تطبيقات واقعية.',
      timestamp: 'منذ ٤ ساعات',
    },
    {
      id: 'm4',
      courseId: 'c1',
      senderId: 'std-2',
      senderName: 'عبدالله السبيعي',
      senderRole: 'student',
      content: 'المشروع العملي للوحدة الثانية ممتع جداً، خصوصاً تطبيق نظام قواعد البيانات الصغير. أنصح الجميع بالبدء فيه مبكراً!',
      timestamp: 'منذ ساعتين',
    },
  ],
  c2: [
    {
      id: 'm201',
      courseId: 'c2',
      senderId: 'inst-2',
      senderName: 'د. نورة بنت فهد الهديب',
      senderRole: 'instructor',
      content: 'مرحباً بجميع المسجلين في دورة الذكاء الاصطناعي التوليدي. هذه القناة مخصصة للتوجيهات والروابط الرسمية للمحاضرات لضمان وصول التنبيهات للجميع بوضوح.',
      timestamp: 'أمس الساعة ٣:٠٠ م',
      isAnnouncement: true,
    },
    {
      id: 'm202',
      courseId: 'c2',
      senderId: 'inst-2',
      senderName: 'د. نورة بنت فهد الهديب',
      senderRole: 'instructor',
      content: 'تم رفع الكود المصدري لمشروع Transformers في مكتبة الدروس. نلتقي غداً بمشيئة الله في البث المباشر للإجابة على الأسئلة التقنية.',
      timestamp: 'منذ ساعتين',
    },
  ],
};

export const coursesService = {
  getCourses: async (params?: { category?: string }): Promise<Course[]> => {
    let result = [...coursesState];
    if (params?.category && params.category !== 'الكل') {
      result = result.filter(
        (c) => c.category === params.category || c.category.includes(params.category!)
      );
    }
    return result;
  },

  getCourseById: async (courseId: string): Promise<Course | undefined> => {
    return coursesState.find((c) => c.id === courseId);
  },

  enrollInCourse: async (courseId: string): Promise<boolean> => {
    try {
      await api.post(`/courses/${courseId}/enroll`);
    } catch {
      // Fallback
    }

    coursesState = coursesState.map((c) => {
      if (c.id === courseId) {
        return {
          ...c,
          enrolled: true,
          students: c.enrolled ? c.students : c.students + 1,
        };
      }
      return c;
    });

    return true;
  },

  getChatSettings: async (courseId: string): Promise<CourseChatSettings> => {
    if (!chatSettingsStore[courseId]) {
      chatSettingsStore[courseId] = {
        courseId,
        permissionMode: 'all',
      };
    }
    return { ...chatSettingsStore[courseId] };
  },

  updateChatSettings: async (
    courseId: string,
    updates: Partial<CourseChatSettings>
  ): Promise<CourseChatSettings> => {
    const current = chatSettingsStore[courseId] || {
      courseId,
      permissionMode: 'all',
    };

    chatSettingsStore[courseId] = {
      ...current,
      ...updates,
    };

    return { ...chatSettingsStore[courseId] };
  },

  getChatMessages: async (courseId: string): Promise<ChatMessage[]> => {
    return chatMessagesStore[courseId] || [];
  },

  sendChatMessage: async (
    courseId: string,
    data: {
      senderId: string;
      senderName: string;
      senderRole: 'instructor' | 'student' | 'admin';
      content: string;
      isAnnouncement?: boolean;
    }
  ): Promise<ChatMessage> => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      courseId,
      senderId: data.senderId,
      senderName: data.senderName,
      senderRole: data.senderRole,
      content: data.content,
      timestamp: 'الآن',
      isAnnouncement: data.isAnnouncement,
    };

    if (!chatMessagesStore[courseId]) {
      chatMessagesStore[courseId] = [];
    }

    chatMessagesStore[courseId].push(newMessage);
    return newMessage;
  },
};
