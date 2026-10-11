import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, X, Search, Sparkles, Shield, Zap, Swords, Crown, ShoppingBag, HelpCircle, Layers, Flame, Trophy } from 'lucide-react';

interface TutorialModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type TabType = 'rules' | 'cards' | 'modes' | 'shop';

export const TutorialModal = ({ isOpen, onClose }: TutorialModalProps) => {
    const [activeTab, setActiveTab] = useState<TabType>('rules');
    const [searchQuery, setSearchQuery] = useState('');
    const [cardCategory, setCardCategory] = useState<'all' | 'nobles' | 'mages' | 'summons' | 'spells' | 'special'>('all');

    if (!isOpen) return null;

    const ALL_CARD_DESCRIPTIONS = [
        // Nobles & Royalty
        {
            category: 'nobles',
            code: 'K',
            name: 'Король (K)',
            icon: '👑',
            power: '13',
            bg: 'bg-amber-950/40 border-amber-500/40 text-amber-200',
            badge: '4N + 4J',
            description: 'Величний монарх. При розіграші закликає у вашу руку 4 Лицарів (N) та 4 Валетів (J) своєї масті.'
        },
        {
            category: 'nobles',
            code: 'Q',
            name: 'Королева (Q)',
            icon: '👑',
            power: '12',
            bg: 'bg-purple-950/40 border-purple-500/40 text-purple-200',
            badge: '4N + 4J',
            description: 'Королівська величність. При розіграші закликає у вашу руку 4 Лицарів (N) та 4 Валетів (J) своєї масті.'
        },
        {
            category: 'nobles',
            code: 'PC',
            name: 'Принцеса (PC)',
            icon: '👸',
            power: '92',
            bg: 'bg-pink-950/40 border-pink-500/40 text-pink-200',
            badge: '4J + 2HR',
            description: 'Шляхетна особа (1 на кожну масть = 4 карти). При розіграші закликає у вашу руку 4 Валетів (Лицарів J) своєї масті та 2 Карти Героїв (HR).'
        },
        {
            category: 'nobles',
            code: 'PRN',
            name: 'Принц (PRN)',
            icon: '🤴',
            power: '92',
            bg: 'bg-blue-950/40 border-blue-500/40 text-blue-200',
            badge: '1HR + 2J + 2x10',
            description: 'Спадкоємець престолу (1 на масть = 4 карти). При розіграші додає 1 Героя (HR), 2 Валетів (J) та дві 10-ки своєї масті.'
        },
        {
            category: 'nobles',
            code: 'HR',
            name: 'Герой (HR)',
            icon: '🏆',
            power: '99',
            bg: 'bg-amber-950/40 border-amber-500/40 text-amber-200',
            badge: 'Супер-карта',
            description: 'Б’є абсолютно будь-яку звичайну карту або козиря. Можна підкидати в будь-який момент бою.'
        },
        {
            category: 'nobles',
            code: 'GM',
            name: 'Гросмейстер (GM)',
            icon: '👑',
            power: '98',
            bg: 'bg-amber-950/40 border-amber-500/40 text-amber-200',
            badge: 'Захист столу',
            description: 'Королівський тактик. Б’є будь-яку карту до 97 сили. Блокує можливість підкидати карти іншим гравцям до кінця кону.'
        },
        {
            category: 'nobles',
            code: 'PL',
            name: 'Паладин (PL)',
            icon: '⚔️',
            power: '99',
            bg: 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200',
            badge: 'Анти-нежить',
            description: 'Святий воїн. Непереможний у захисті. Блокує атаки Скелетів, Зомбі та Лицаря Смерті.'
        },
        {
            category: 'nobles',
            code: 'SH',
            name: 'Шулер (SH)',
            icon: '🎴',
            power: '90',
            bg: 'bg-purple-950/40 border-purple-500/40 text-purple-200',
            badge: 'Підкидання',
            description: 'Хитрий картяр. Його можна підкидати в бій у будь-який момент, незалежно від того, які карти лежать на столі.'
        },
        {
            category: 'nobles',
            code: 'TH',
            name: 'Злодій (TH)',
            icon: '🗡️',
            power: '92',
            bg: 'bg-red-950/40 border-red-500/40 text-red-200',
            badge: 'Крадіжка',
            description: 'Під час атаки викрадає одну випадкову карту з руки захисника у вашу руку.'
        },

        // Mages & Inventors
        {
            category: 'mages',
            code: 'KB',
            name: 'Каббаліст (KB)',
            icon: '📜',
            power: '90',
            bg: 'bg-amber-950/40 border-amber-500/40 text-amber-200',
            badge: '3 Големи',
            description: 'Маг стародавніх знань. При розіграші миттєво створює у вашій руці 3 Големів (сила 4).'
        },
        {
            category: 'mages',
            code: 'INV',
            name: 'Винахідник (INV)',
            icon: '🔧',
            power: '90',
            bg: 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200',
            badge: '3AUT + 2ANM',
            description: 'Майстер механізмів. Закликає 3 Автоматонів (сила 5) та 2 Аніматроніків (сила 3) у вашу руку.'
        },
        {
            category: 'mages',
            code: 'M',
            name: 'Магістр (M)',
            icon: '✨',
            power: '95',
            bg: 'bg-purple-950/40 border-purple-500/40 text-purple-200',
            badge: 'Супер-Захист',
            description: 'Могутній чарівник. Може побити абсолютно будь-яку карту, але ним НЕ МОЖНА атакувати першим чи підкидати.'
        },
        {
            category: 'mages',
            code: 'WL',
            name: 'Чаклун (WL)',
            icon: '🔮',
            power: '88',
            bg: 'bg-violet-950/40 border-violet-500/40 text-violet-200',
            badge: 'Закляття',
            description: 'Повелитель магії. При розіграші додає у вашу руку 2 випадкових Закляття з магазина.'
        },
        {
            category: 'mages',
            code: 'MG',
            name: 'Маг (MG)',
            icon: '🧙‍♂️',
            power: '89',
            bg: 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200',
            badge: '+3 Карти',
            description: 'При розіграші добирає вам 3 карти з колоди та надає +2 Очки Сили.'
        },
        {
            category: 'mages',
            code: 'WZ',
            name: 'Чарівник (WZ)',
            icon: '🧙‍♂️',
            power: '91',
            bg: 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200',
            badge: 'Мудрість',
            description: 'Дає 4 випадкові Закляття, добирає 2 карти з колоди та дарує +5 Очок Сили.'
        },
        {
            category: 'mages',
            code: 'IL',
            name: 'Ілюзіоніст (IL)',
            icon: '🎭',
            power: '90',
            bg: 'bg-pink-950/40 border-pink-500/40 text-pink-200',
            badge: 'Ілюзії',
            description: 'Дає 4 карти Ілюзій (`ILL`) та 1 Закляття "Ілюзорна копія".'
        },

        // Summons & Minions
        {
            category: 'summons',
            code: 'GLM',
            name: 'Голем (GLM)',
            icon: '🗿',
            power: '4',
            bg: 'bg-stone-900 border-stone-600 text-stone-200',
            badge: 'Вічний',
            description: 'Кам’яний велетень (сила 4). Вічна карта — після бою відправляється у Вічний відбій і не дістається супернику при "Взяти".'
        },
        {
            category: 'summons',
            code: 'AUT',
            name: 'Автоматон (AUT)',
            icon: '⚙️',
            power: '5',
            bg: 'bg-slate-900 border-slate-600 text-slate-200',
            badge: 'Вічний',
            description: 'Заводна машина (сила 5). Завжди прямує у Вічний відбій.'
        },
        {
            category: 'summons',
            code: 'ANM',
            name: 'Аніматронік (ANM)',
            icon: '🤖',
            power: '3',
            bg: 'bg-zinc-900 border-zinc-600 text-zinc-200',
            badge: 'Вічний',
            description: 'Механічне створіння (сила 3). Вічна карта, що зникає у Вічному відбої.'
        },
        {
            category: 'summons',
            code: 'SK',
            name: 'Скелет (SK)',
            icon: '☠️',
            power: '3',
            bg: 'bg-neutral-900 border-neutral-600 text-neutral-300',
            badge: 'Нежить',
            description: 'Воїн темряви (сила 3). Закликається закляттям або Некромантом.'
        },
        {
            category: 'summons',
            code: 'ZB',
            name: 'Зомбі (ZB)',
            icon: '🧟',
            power: '4',
            bg: 'bg-emerald-950/40 border-emerald-600/40 text-emerald-200',
            badge: 'Нежить',
            description: 'Ожилий мерлець (сила 4). Входить до армії нежиті.'
        },
        {
            category: 'summons',
            code: 'GHOST',
            name: 'Привид',
            icon: '👻',
            power: '10',
            bg: 'bg-teal-950/40 border-teal-500/40 text-teal-200',
            badge: 'Дух',
            description: 'Безтілесний дух. Може копіювати або підніматися з звичайного відбою.'
        },

        // Spells & Magic
        {
            category: 'spells',
            code: 'IC',
            name: 'Ілюзорна копія',
            icon: '✨',
            power: '10',
            bg: 'bg-purple-950/40 border-purple-500/40 text-purple-200',
            badge: 'Закляття',
            description: 'Створює дублікат будь-якої карти у вашій руці або зі столу.'
        },
        {
            category: 'spells',
            code: 'IM',
            name: 'Безсмертя',
            icon: '🛡️',
            power: '99',
            bg: 'bg-amber-950/40 border-amber-500/40 text-amber-200',
            badge: '3 Ходи',
            description: 'Накладає ауру безсмертя на 3 ходи: ваші карти зі столу повертаються вам у руку при "Бито".'
        },
        {
            category: 'spells',
            code: 'ET',
            name: 'Закінчити хід',
            icon: '⌛',
            power: '99',
            bg: 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200',
            badge: 'Миттєво',
            description: 'Миттєво закінчує поточний кон та відправляє карти в "Бито".'
        },
        {
            category: 'spells',
            code: 'DTH',
            name: 'Смерть (DTH)',
            icon: '💀',
            power: '99',
            bg: 'bg-red-950/50 border-red-500/50 text-red-200',
            badge: 'Фатальність',
            description: 'Знищує будь-яку карту суперника та відправляє її у Вічний відбій.'
        },

        // Special & Economy
        {
            category: 'special',
            code: 'GL',
            name: 'Золото (GL)',
            icon: '🥇',
            power: '85',
            bg: 'bg-yellow-950/40 border-yellow-500/40 text-yellow-200',
            badge: '+3 Сили',
            description: 'Дає +3 Очки Сили при розіграші. Можна підкидати в будь-який момент.'
        },
        {
            category: 'special',
            code: 'SL',
            name: 'Срібло (SL)',
            icon: '🥈',
            power: '75',
            bg: 'bg-slate-800 border-slate-500 text-slate-200',
            badge: '+1 Сили',
            description: 'Приносить +1 Очко Сили. Вільне підкидання.'
        }
    ];

    const filteredCards = ALL_CARD_DESCRIPTIONS.filter(card => {
        const matchesCategory = cardCategory === 'all' || card.category === cardCategory;
        const matchesSearch = card.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              card.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              card.code.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="bg-slate-900 border-2 border-indigo-500/40 rounded-3xl p-4 sm:p-6 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center pb-4 border-b border-slate-800 gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-500/20 border border-indigo-500/40 rounded-2xl text-indigo-400">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black bg-gradient-to-r from-indigo-300 via-purple-300 to-amber-300 bg-clip-text text-transparent">
                                    Довідник та Правила гри
                                </h2>
                                <p className="text-xs text-slate-400">
                                    Всі механіки, режими колод та каталог карт в одному місці
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2 pt-3 pb-2 border-b border-slate-800/80 overflow-x-auto scrollbar-none">
                        <button
                            onClick={() => setActiveTab('rules')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                                activeTab === 'rules'
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                    : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                            }`}
                        >
                            <HelpCircle className="w-4 h-4" />
                            <span>Основні правила</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('cards')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                                activeTab === 'cards'
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                                    : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                            }`}
                        >
                            <Layers className="w-4 h-4" />
                            <span>Каталог всіх карт</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('modes')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                                activeTab === 'modes'
                                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                                    : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                            }`}
                        >
                            <Sparkles className="w-4 h-4" />
                            <span>Режими колод</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('shop')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                                activeTab === 'shop'
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                                    : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                            }`}
                        >
                            <ShoppingBag className="w-4 h-4" />
                            <span>Магазин та Очки Сили</span>
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto py-4 pr-1 scrollbar-thin scrollbar-thumb-slate-700 text-slate-300 text-sm">
                        {/* TAB 1: RULES */}
                        {activeTab === 'rules' && (
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-2">
                                    <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                                        <Swords className="w-5 h-5 text-amber-400" />
                                        Мета гри та класичні правила переведення / підкидання
                                    </h3>
                                    <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">
                                        Головна мета гри — позбутися всіх карт з руки. Гравець, який залишається з картами наприкінці гри, програє партію.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-2xl space-y-1.5">
                                        <h4 className="font-bold text-indigo-300 text-xs sm:text-sm flex items-center gap-1.5">
                                            <Shield className="w-4 h-4 text-indigo-400" />
                                            Правила Захисту та Відбиття
                                        </h4>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Захисник повинен побити карту атакувальника старшою картою тієї ж масті або козирем. Козир б’є будь-яку некозирову карту.
                                        </p>
                                    </div>

                                    <div className="p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-2xl space-y-1.5">
                                        <h4 className="font-bold text-purple-300 text-xs sm:text-sm flex items-center gap-1.5">
                                            <Sparkles className="w-4 h-4 text-purple-400" />
                                            Правило Переводу
                                        </h4>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Якщо захисник має карту того ж рангу, він може покласти її поруч і перевести хід на наступного гравця за годинниковою стрілкою!
                                        </p>
                                    </div>

                                    <div className="p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-2xl space-y-1.5">
                                        <h4 className="font-bold text-amber-300 text-xs sm:text-sm flex items-center gap-1.5">
                                            <Flame className="w-4 h-4 text-amber-400" />
                                            Підкидання карт
                                        </h4>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Підкидати можна карти лише тих рангів, які вже є на столі (атака або захист). Деякі персонажі (Шулер, Герой, Монети) підкидаються вільно!
                                        </p>
                                    </div>

                                     <div className="p-3.5 bg-rose-950/40 border border-rose-500/60 rounded-2xl space-y-1.5 col-span-1 sm:col-span-2">
                                        <h4 className="font-bold text-rose-300 text-xs sm:text-sm flex items-center gap-1.5">
                                            <Flame className="w-4 h-4 text-rose-400" />
                                            Ліміт карт у руці (22 карти) та Шкода від перевантаження
                                        </h4>
                                        <p className="text-xs text-slate-300 leading-relaxed">
                                            Нормальний розмір руки — до <strong>22 карт</strong>. Якщо наприкінці ходу гравець має в руці більше 22 карт, він отримує пошкодження рівне <strong>((x + y)²) / (2 × y)</strong>, де <em>x</em> — кількість лишніх карт (понад 22), а <em>y</em> — номер ходу гравця!
                                        </p>
                                    </div>

                                    <div className="p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-2xl space-y-1.5">
                                        <h4 className="font-bold text-emerald-300 text-xs sm:text-sm flex items-center gap-1.5">
                                            <Trophy className="w-4 h-4 text-emerald-400" />
                                            Нічия та Завершення
                                        </h4>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Якщо колода вичерпана і ніхто з гравців більше не може зробити хід (через відсутність підходящих карт), гра оголошується <strong>Нічиєю</strong>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: FULL CARD CATALOG */}
                        {activeTab === 'cards' && (
                            <div className="space-y-4">
                                {/* Search & Category Filter Controls */}
                                <div className="flex flex-col sm:flex-row gap-2.5 justify-between items-stretch sm:items-center bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80">
                                    <div className="relative flex-1">
                                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                                        <input 
                                            type="text"
                                            placeholder="Пошук за назвою або ефектом..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>

                                    <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                                        {[
                                            { id: 'all', label: 'Всі' },
                                            { id: 'nobles', label: 'Дворяни' },
                                            { id: 'mages', label: 'Маги' },
                                            { id: 'summons', label: 'Істоти' },
                                            { id: 'spells', label: 'Закляття' },
                                            { id: 'special', label: 'Економіка' },
                                        ].map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setCardCategory(cat.id as any)}
                                                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                                                    cardCategory === cat.id 
                                                        ? 'bg-indigo-500 text-white shadow-md' 
                                                        : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
                                                }`}
                                            >
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Cards Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {filteredCards.map(card => (
                                        <div 
                                            key={`guide-card-${card.code}`}
                                            className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-2 transition-all hover:scale-[1.01] ${card.bg}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="text-2xl">{card.icon}</span>
                                                    <div>
                                                        <h4 className="font-black text-sm text-slate-100">{card.name}</h4>
                                                        <span className="text-[10px] font-mono opacity-80">Код: {card.code}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="px-2 py-0.5 bg-black/40 border border-white/10 rounded-md text-[10px] font-bold">
                                                        {card.badge}
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-xs opacity-90 leading-relaxed pt-1 border-t border-white/10">
                                                {card.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TAB 3: DECK MODES */}
                        {activeTab === 'modes' && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl space-y-2">
                                    <div className="flex items-center gap-2 text-indigo-400 font-bold text-base">
                                        <span>🎴</span> Класична
                                    </div>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        Стандартна колода на 36 або 52 карти. Класичні правила підкидання та переведення карт для поціновувачів традиційної гри.
                                    </p>
                                </div>

                                <div className="p-4 bg-slate-800/80 border border-amber-500/40 rounded-2xl space-y-2">
                                    <div className="flex items-center gap-2 text-amber-300 font-bold text-base">
                                        <span>✨</span> Мега (Розширена)
                                    </div>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        Включає Дворян, Магів, Закляття, Принцес, Принців, Каббалістів та Винахідників! Максимальний азарт та тактична глибина.
                                    </p>
                                </div>

                                <div className="p-4 bg-slate-800/80 border border-purple-500/40 rounded-2xl space-y-2">
                                    <div className="flex items-center gap-2 text-purple-300 font-bold text-base">
                                        <span>🔮</span> Таро
                                    </div>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        78 карт з містичними Старшими Арканами та спеціальними козирями.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: SHOP & POWER POINTS */}
                        {activeTab === 'shop' && (
                            <div className="space-y-4">
                                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3">
                                    <Zap className="w-8 h-8 text-amber-400 shrink-0" />
                                    <div>
                                        <h3 className="font-bold text-amber-300 text-sm">Як отримувати Ресурси (⚡)?</h3>
                                        <p className="text-xs text-slate-300 leading-relaxed">
                                            Ресурси надаються за вдалі ходи, перемога в коні, розіграш Золота/Срібла, шахтарів, шукача скарбів або карт Магів.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl space-y-1">
                                        <span className="font-bold text-amber-300 text-xs">🛡️ Безсмертя (4⚡)</span>
                                        <p className="text-[11px] text-slate-400">Повертає карти зі столу назад у руку при "Бито" протягом 3 ходів.</p>
                                    </div>
                                    <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl space-y-1">
                                        <span className="font-bold text-purple-300 text-xs">✨ Ілюзорна копія (3⚡)</span>
                                        <p className="text-[11px] text-slate-400">Миттєво копіює будь-яку обрану карту з руки.</p>
                                    </div>
                                    <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl space-y-1">
                                        <span className="font-bold text-indigo-300 text-xs">⌛ Закінчити хід (3⚡)</span>
                                        <p className="text-[11px] text-slate-400">Миттєво відправляє поточні карти на столі у "Бито".</p>
                                    </div>
                                    <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl space-y-1">
                                        <span className="font-bold text-emerald-300 text-xs">🗿 Виклики істот (1-2⚡)</span>
                                        <p className="text-[11px] text-slate-400">Дають Големів, Автоматонів або Аніматроніків у руку.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="pt-3 border-t border-slate-800 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition-all shadow-md"
                        >
                            Зрозуміло, до гри!
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
