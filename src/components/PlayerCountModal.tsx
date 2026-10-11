import { motion } from 'motion/react';
import { Users, Play } from 'lucide-react';
import { DeckMode } from '../lib/gameLogic';

interface PlayerCountModalProps {
    isOpen: boolean;
    currentCount: number;
    onSelectCount: (count: number) => void;
    deckMode: DeckMode;
    onSelectDeckMode: (mode: DeckMode) => void;
    onClose: () => void;
}

export const PlayerCountModal = ({ 
    isOpen, 
    currentCount, 
    onSelectCount, 
    deckMode, 
    onSelectDeckMode, 
    onClose 
}: PlayerCountModalProps) => {
    if (!isOpen) return null;

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto"
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }} 
                animate={{ scale: 1, y: 0 }}
                className="bg-slate-900 border border-slate-700/80 p-6 sm:p-8 rounded-3xl max-w-lg w-full shadow-2xl flex flex-col gap-5 text-white my-auto max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                    <div className="p-3 bg-indigo-600/30 border border-indigo-500/40 rounded-2xl text-indigo-400">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold">Налаштування гри</h2>
                        <p className="text-sm text-slate-400">Оберіть кількість учасників та тип колоди</p>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-semibold text-slate-300">Кількість гравців (2 — 25)</label>
                        <span className="text-indigo-400 font-extrabold text-base bg-indigo-950/60 border border-indigo-500/30 px-3 py-0.5 rounded-full">
                            {currentCount} {currentCount === 2 ? 'гравець' : (currentCount >= 5 && currentCount <= 20 ? 'гравців' : 'гравці')}
                        </span>
                    </div>

                    {/* Quick presets */}
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5">
                        {[2, 3, 4, 6, 8, 10, 12, 15, 18, 20, 22, 25].map((num) => {
                            const isSelected = currentCount === num;
                            return (
                                <button
                                    key={num}
                                    onClick={() => onSelectCount(num)}
                                    className={`py-2 px-1 rounded-xl font-bold text-xs sm:text-sm transition-all flex flex-col items-center justify-center border ${
                                        isSelected 
                                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30 scale-105' 
                                            : 'bg-slate-800/80 border-slate-700/70 text-slate-300 hover:bg-slate-700 hover:text-white'
                                    }`}
                                >
                                    <span>{num}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Slider & Stepper */}
                    <div className="flex items-center gap-3 bg-slate-800/50 p-2.5 rounded-2xl border border-slate-700/60 mt-1">
                        <button
                            onClick={() => onSelectCount(Math.max(2, currentCount - 1))}
                            disabled={currentCount <= 2}
                            className="w-9 h-9 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-40 font-bold text-lg flex items-center justify-center transition-colors"
                        >
                            -
                        </button>
                        <input 
                            type="range" 
                            min={2} 
                            max={25} 
                            value={currentCount} 
                            onChange={(e) => onSelectCount(Number(e.target.value))}
                            className="flex-1 accent-indigo-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
                        />
                        <button
                            onClick={() => onSelectCount(Math.min(25, currentCount + 1))}
                            disabled={currentCount >= 25}
                            className="w-9 h-9 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-40 font-bold text-lg flex items-center justify-center transition-colors"
                        >
                            +
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-300">Тип колоди</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                        <button
                            onClick={() => onSelectDeckMode('classic54')}
                            className={`py-3 px-2 rounded-2xl font-bold text-xs sm:text-sm transition-all border flex flex-col items-center justify-center gap-1 text-center ${
                                deckMode === 'classic54'
                                    ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/30'
                                    : 'bg-slate-800/80 border-slate-700/70 text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`}
                        >
                            <span>Чистий Дурень 🃏</span>
                            <span className="text-[10px] font-normal opacity-80">54 карти (без RPG)</span>
                        </button>
                        <button
                            onClick={() => onSelectDeckMode('classic56')}
                            className={`py-3 px-2 rounded-2xl font-bold text-xs sm:text-sm transition-all border flex flex-col items-center justify-center gap-1 text-center ${
                                deckMode === 'classic56'
                                    ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg shadow-cyan-600/30'
                                    : 'bg-slate-800/80 border-slate-700/70 text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`}
                        >
                            <span>Розширена 🃏</span>
                            <span className="text-[10px] font-normal opacity-80">56 карт (4 джокери)</span>
                        </button>
                        <button
                            onClick={() => onSelectDeckMode('classic')}
                            className={`py-3 px-2 rounded-2xl font-bold text-xs sm:text-sm transition-all border flex flex-col items-center justify-center gap-1 text-center ${
                                deckMode === 'classic'
                                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30'
                                    : 'bg-slate-800/80 border-slate-700/70 text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`}
                        >
                            <span>RPG Класика 🏰</span>
                            <span className="text-[10px] font-normal opacity-80">4 масті + RPG</span>
                        </button>
                        <button
                            onClick={() => onSelectDeckMode('extended')}
                            className={`py-3 px-2 rounded-2xl font-bold text-xs sm:text-sm transition-all border flex flex-col items-center justify-center gap-1 text-center ${
                                deckMode === 'extended'
                                    ? 'bg-amber-600 border-amber-400 text-white shadow-lg shadow-amber-600/30'
                                    : 'bg-slate-800/80 border-slate-700/70 text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`}
                        >
                            <span>RPG Мега ✨</span>
                            <span className="text-[10px] font-normal opacity-80">26 мастей + RPG</span>
                        </button>
                        <button
                            onClick={() => onSelectDeckMode('minor_tarot')}
                            className={`py-3 px-2 rounded-2xl font-bold text-xs sm:text-sm transition-all border flex flex-col items-center justify-center gap-1 text-center ${
                                deckMode === 'minor_tarot'
                                    ? 'bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-600/30'
                                    : 'bg-slate-800/80 border-slate-700/70 text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`}
                        >
                            <span>Молодші Аркани 🪄</span>
                            <span className="text-[10px] font-normal opacity-80">56 карт Таро</span>
                        </button>
                        <button
                            onClick={() => onSelectDeckMode('tarot')}
                            className={`py-3 px-2 rounded-2xl font-bold text-xs sm:text-sm transition-all border flex flex-col items-center justify-center gap-1 text-center ${
                                deckMode === 'tarot'
                                    ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/30'
                                    : 'bg-slate-800/80 border-slate-700/70 text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`}
                        >
                            <span>Таро 🔮</span>
                            <span className="text-[10px] font-normal opacity-80">22 Аркани</span>
                        </button>
                    </div>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-2xl text-xs sm:text-sm text-slate-300 border border-slate-700/50 flex flex-col gap-1.5">
                    <div className="font-semibold text-slate-200">ℹ️ Особливості гри:</div>
                    <p>• Ви граєте проти {currentCount - 1} ботів ({currentCount} учасників на столі).</p>
                    {deckMode === 'classic54' ? (
                        <p>• Чистий Дурень (54 карти) включає 4 класичні масті та 2 Джокери. Жодних RPG-модифікаторів!</p>
                    ) : deckMode === 'classic56' ? (
                        <p>• Розширена колода (56 карт) включає 4 класичні масті та 4 різнокольорові Джокери (Чорний, Червоний, Білий, Золотий). Без RPG-модифікаторів!</p>
                    ) : deckMode === 'minor_tarot' ? (
                        <p>• Молодші Аркани Таро (56 карт) складаються з 4 мастей (Жезли 🪄, Мечі 🗡️, Кубки 🍷, Пентаклі 🪙), по 14 карт у кожній (від Туза до Десятки та 4 фігури двору: Паж, Лицар, Королева, Король).</p>
                    ) : deckMode === 'classic' ? (
                        <p>• RPG Класика містить 4 класичні масті, Джокерів та повний набір спеціальних RPG карт.</p>
                    ) : deckMode === 'extended' ? (
                        <p>• RPG Мега-колода містить 26 мастей, карти 0, 1, лицаря (N), Джокерів та спец-карти.</p>
                    ) : (
                        <p>• Колода Таро включає 22 Старших Аркани від Шута (0) до Світу (XXI).</p>
                    )}
                </div>

                <button
                    onClick={onClose}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg text-base flex justify-center items-center gap-2 cursor-pointer"
                >
                    <Play className="w-5 h-5 fill-current" />
                    Розпочати гру ({currentCount} гравців)
                </button>
            </motion.div>
        </motion.div>
    );
};
