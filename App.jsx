import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Compass, Navigation, Coffee, Smartphone, ChevronRight, Check, X, 
  Globe, Star, Sparkles, Loader, AlertTriangle, MapPin, Radio, 
  ShoppingBag, Camera, Music, PlayCircle, History, Utensils, Search
} from 'lucide-react';

// --- ИМПОРТ КАРТИНОК ---
// Логотип-визитная карточка (новый файл)
import fullLogo from './IMG_0289.jpeg'; 
// Скриншоты телефона (PNG)
import profileScreen from './IMG_0288.png'; 
import mapScreen from './IMG_0275.png';     

// --- GEMINI API SETUP ---
const apiKey = ""; 

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyCWQJtzHMksDG5UgLVma8LnYiOxYYcv_AQ",
  authDomain: "guide-du-detour.firebaseapp.com",
  projectId: "guide-du-detour",
  storageBucket: "guide-du-detour.firebasestorage.app",
  messagingSenderId: "182479723840",
  appId: "1:182479723840:web:866963483cf1bca6f9aea5",
  measurementId: "G-17851JKM7F"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// --- COMPONENTS ---

// Обновленный компонент Logo: только крупный логотип
const Logo = () => (
  <div className="flex items-center justify-start py-2">
    <img 
      src={fullLogo} 
      alt="Guide du Détour" 
      // Увеличенный размер (h-16 на мобильных, h-24 на десктопах) и убран фильтр инверсии, чтобы сохранить цвета оригинала
      className="h-16 md:h-24 w-auto object-contain transition-transform duration-500 hover:scale-105" 
    />
  </div>
);

const FeatureCard = ({ icon: Icon, title, description, color = "text-emerald-400" }) => (
  <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-6 rounded-2xl hover:border-emerald-500/30 transition-all duration-300 group h-full hover:-translate-y-1 shadow-lg hover:shadow-emerald-900/10">
    <div className={`w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-4 ${color} group-hover:scale-110 transition-transform`}>
      <Icon size={24} />
    </div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-slate-400 leading-relaxed text-sm">{description}</p>
  </div>
);

const RoadmapItem = ({ emoji, title, desc }) => (
  <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition border border-transparent hover:border-white/10">
    <div className="text-2xl pt-1 select-none">{emoji}</div>
    <div>
        <h4 className="text-white font-bold text-sm md:text-base mb-1">{title}</h4>
        <p className="text-slate-400 text-xs md:text-sm leading-relaxed">{desc}</p>
    </div>
  </div>
);

const ComparisonRow = ({ feature, us, others }) => (
  <div className="grid grid-cols-12 gap-2 md:gap-4 py-4 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors px-4 rounded-lg items-center">
    <div className="col-span-6 text-slate-300 font-medium text-xs md:text-sm">{feature}</div>
    <div className="col-span-3 text-center flex justify-center">
        {us ? <Check className="text-emerald-400 w-5 h-5" /> : <X className="text-slate-600 w-5 h-5" />}
    </div>
    <div className="col-span-3 text-center flex justify-center opacity-50 grayscale">
        {others ? <Check className="text-slate-400 w-5 h-5" /> : <X className="text-slate-600 w-5 h-5" />}
    </div>
  </div>
);

// --- AI LAB COMPONENT ---
const AiLab = () => {
    const [activeTab, setActiveTab] = useState('scout');
    const [input, setInput] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        setResult(null);
        setError(null);
        setInput('');
    }, [activeTab]);

    const handleAction = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        let systemPrompt = "";
        switch (activeTab) {
            case 'scout':
                systemPrompt = "Tu es un expert local pour l'application 'Guide du Détour'. L'utilisateur indique une région. Propose UN SEUL lieu précis, méconnu mais atmosphérique (moulin, ruine, plage secrète) dans cette zone. Réponse courte (max 40 mots), inspirante, en français. Commence par le nom du lieu.";
                break;
            case 'history':
                systemPrompt = "Tu es le mode 'Rétroviseur Temporel' de l'application. L'utilisateur donne un lieu ou une région. Raconte une courte anecdote historique fascinante, un mythe ou une légende locale oublié sur ce lieu. Ton mystérieux et captivant. Max 40 mots. En français.";
                break;
            case 'food':
                systemPrompt = "Tu es le mode 'Coffre Vide' de l'application. L'utilisateur donne une région. Liste 3 produits du terroir spécifiques et authentiques (fromage, vin, artisanat) qu'il faut absolument acheter et ramener de là-bas. Format liste simple. En français.";
                break;
            default:
                systemPrompt = "";
        }

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `Demande: ${input}` }] }],
                    systemInstruction: { parts: [{ text: systemPrompt }] }
                })
            });

            if (!response.ok) throw new Error('AI busy');
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) setResult(text);
            else setError('Pas de réponse trouvée.');
        } catch (err) {
            console.error(err);
            setError('Le serveur est surchargé.');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'scout', icon: Compass, label: "L'Éclaireur", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
        { id: 'history', icon: History, label: "Rétroviseur", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
        { id: 'food', icon: ShoppingBag, label: "Coffre Vide", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" }
    ];
    const activeTabData = tabs.find(t => t.id === activeTab);

    return (
        <div className="w-full max-w-2xl mx-auto mt-20 rounded-2xl bg-gradient-to-b from-slate-800 to-[#0b1021] p-[1px] shadow-2xl shadow-emerald-900/20">
            <div className="bg-[#0b1021] rounded-[15px] overflow-hidden">
                <div className="bg-slate-900/50 p-2 flex gap-2 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? `${tab.bg} ${tab.color} ring-1 ring-inset ${tab.border}` : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}>
                            <tab.icon size={16} /> {tab.label}
                        </button>
                    ))}
                </div>
                <div className="p-6 md:p-10 text-center min-h-[300px] flex flex-col">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-6 mx-auto">
                        <Sparkles size={10} className={activeTabData.color} /> Démonstration IA en direct
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                        {activeTab === 'scout' && "Trouvez une pépite cachée"}
                        {activeTab === 'history' && "Écoutez les murs parler"}
                        {activeTab === 'food' && "Remplissez votre coffre"}
                    </h3>
                    <p className="text-slate-400 mb-8 text-sm">
                        {activeTab === 'scout' && "Entrez une région, nous trouvons le détour parfait."}
                        {activeTab === 'history' && "Découvrez les légendes oubliées d'un lieu."}
                        {activeTab === 'food' && "Les meilleurs produits locaux à ramener chez vous."}
                    </p>
                    <form onSubmit={handleAction} className="flex flex-col md:flex-row gap-3 max-w-md mx-auto w-full mb-8 relative z-10">
                        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={activeTab === 'scout' ? "Ex: Bretagne..." : activeTab === 'history' ? "Ex: Mont Saint-Michel..." : "Ex: Alsace..."} className="flex-1 bg-slate-800/50 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-slate-500 transition placeholder-slate-600" />
                        <button type="submit" disabled={loading || !input} className={`text-white px-6 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${activeTab === 'scout' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20' : ''} ${activeTab === 'history' ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/20' : ''} ${activeTab === 'food' ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/20' : ''}`}>
                            {loading ? <Loader className="animate-spin" size={20} /> : <Search size={20} />}
                        </button>
                    </form>
                    <div className="flex-1 flex items-center justify-center">
                        {loading && <div className={`${activeTabData.color} opacity-50 animate-pulse text-sm`}>L'IA consulte ses cartes...</div>}
                        {error && <div className="text-red-400 text-sm">{error}</div>}
                        {result && (
                            <div className={`relative bg-slate-800/30 border rounded-xl p-6 animate-fade-in text-left w-full ${activeTabData.border}`}>
                                <p className="text-slate-200 italic leading-relaxed text-lg">"{result}"</p>
                                <div className={`mt-4 text-xs font-bold uppercase tracking-widest text-right ${activeTabData.color}`}>Mode {activeTabData.label}</div>
                            </div>
                        )}
                        {!loading && !result && !error && <div className="text-slate-700 text-sm italic">Le résultat apparaîtra ici...</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- PHONE MOCKUP ---
const PhoneMockup = ({ activeScreen, setActiveScreen }) => {
    const screens = [
        {
            id: 'profile',
            title: 'Mes Intérêts',
            src: profileScreen,  
            alt: 'Ecran profil avec intérêts'
        },
        {
            id: 'map',
            title: 'Sur la route',
            src: mapScreen, 
            alt: 'Ecran navigation carte'
        }
    ];

    const currentScreen = screens.find(s => s.id === activeScreen) || screens[0];

    return (
        <div className="relative mx-auto border-slate-800 bg-slate-900 border-[14px] rounded-[2.5rem] h-[640px] w-[320px] shadow-2xl flex flex-col items-center justify-start z-20 transition-all duration-500 hover:scale-[1.02]">
            <div className="w-[148px] h-[24px] bg-slate-900 absolute top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 z-30"></div>
            <div className="rounded-[2rem] overflow-hidden w-full h-full bg-slate-950 relative">
                <div className="absolute top-0 w-full h-12 flex justify-between items-center px-6 text-white text-xs font-bold z-20 bg-gradient-to-b from-black/80 to-transparent">
                    <span>22:07</span>
                    <div className="flex gap-1">
                        <div className="w-4 h-4 rounded-full border border-white/20 bg-white/10"></div>
                        <div className="w-4 h-4 rounded-full border border-white/20 bg-white"></div>
                    </div>
                </div>
                <div className="w-full h-full relative">
                    <img src={currentScreen.src} alt={currentScreen.alt} className="w-full h-full object-cover transition-opacity duration-500" />
                </div>
            </div>
        </div>
    );
};

// --- MAIN APP ---
const App = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [user, setUser] = useState(null);
  const [activeScreen, setActiveScreen] = useState('profile');
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
        setAuthError(null);
      } catch (err) {
        console.error("Auth failed:", err);
        if (err.code === 'auth/admin-restricted-operation' || err.code === 'auth/operation-not-allowed') {
            setAuthError("Configuration Firebase requise: Activez l'authentification Anonyme dans la console.");
        }
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    const uid = user ? user.uid : 'anonymous_guest';
    try {
      await addDoc(collection(db, 'waitlist'), {
        email,
        timestamp: serverTimestamp(),
        source: 'landing_page_french',
        uid: uid
      });
      setStatus('success');
      setEmail('');
    } catch (error) {
      console.error("Error:", error);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] text-slate-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden scroll-smooth">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-900/10 rounded-full blur-[120px] mix-blend-screen"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px] mix-blend-screen"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03]"></div>
      </div>
      <div className="relative z-10">
        {authError && (
            <div className="bg-orange-500/10 border-b border-orange-500/20 text-orange-200 px-6 py-2 text-center text-xs">
                <AlertTriangle size={14} className="inline mr-2" />
                {authError}
            </div>
        )}
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center bg-[#050816]/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
          <Logo />
          <div className="hidden md:flex gap-8 text-sm font-medium text-slate-400">
            <a href="#concept" className="hover:text-white transition">Concept</a>
            <a href="#features" className="hover:text-white transition">Fonctionnalités</a>
            <a href="#roadmap" className="hover:text-emerald-400 transition">Futur</a>
          </div>
          <a href="#join" className="bg-white/5 hover:bg-white/10 text-white text-sm font-medium px-4 py-2 rounded-full border border-white/10 transition">
            Accès Bêta
          </a>
        </nav>
        <header className="container mx-auto px-6 pt-12 pb-24 md:pt-20 md:pb-32">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-8">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Coming Soon
              </div>
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-[1.1] tracking-tight">
                Ça vaut le <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 italic pr-2">détour !</span>
              </h1>
              <p className="text-xl text-slate-400 mb-2 font-medium">Le guide qui enrichit vos voyages.</p>
              <p className="text-lg text-slate-500 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Transformez la route en une aventure fascinante. Définissez votre destination, choisissez votre rayon d'évasion, и découvrez les trésors cachés le long de votre trajet.
              </p>
              <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto lg:mx-0 relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
                <div className="relative flex shadow-2xl">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" className="w-full bg-[#0b1021] text-white placeholder-slate-500 px-6 py-4 rounded-l-lg border border-r-0 border-slate-700 focus:outline-none focus:border-emerald-500/50 transition-all text-center md:text-left" required />
                  <button type="submit" disabled={status === 'loading' || status === 'success'} className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-4 rounded-r-lg transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-70">
                    {status === 'loading' ? '...' : status === 'success' ? 'Inscrit !' : 'Rejoindre'}
                    {status === 'idle' && <ChevronRight size={18} />}
                  </button>
                </div>
                {status === 'success' && <p className="absolute -bottom-8 left-0 text-emerald-400 text-sm flex items-center gap-1 animate-fade-in"><Check size={14} /> Merci ! On vous tient au courant.</p>}
              </form>
            </div>
            <div className="flex-1 relative flex flex-col items-center">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[650px] bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 rounded-full blur-[80px] -z-10"></div>
                <PhoneMockup activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
                <div className="mt-8 flex gap-4">
                    <button onClick={() => setActiveScreen('profile')} className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${activeScreen === 'profile' ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-900/20' : 'bg-transparent text-slate-500 hover:text-white'}`}>Vos Intérêts</button>
                    <button onClick={() => setActiveScreen('map')} className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${activeScreen === 'map' ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-900/20' : 'bg-transparent text-slate-500 hover:text-white'}`}>La Route</button>
                </div>
            </div>
          </div>
        </header>
        <section id="concept" className="py-24 bg-[#02040a] relative overflow-hidden">
           <div className="container mx-auto px-6 relative z-10">
              <div className="text-center mb-20 max-w-3xl mx-auto">
                 <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 font-serif">Une expérience unique</h2>
                 <p className="text-slate-400 text-lg">Vous choisissez le cap, vous décidez jusqu'où vous êtes prêt à flâner. Nous nous occupons de l'émerveillement.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                 <FeatureCard icon={Navigation} title="Le Couloir" description="Définissez votre destination et un rayon d'écart (ex: 5km). Nous trouvons tout ce qui mérite un arrêt dans ce couloir." color="text-blue-400" />
                 <FeatureCard icon={Compass} title="4 Univers" description="Fermes & vignobles, Histoire & châteaux, Curiosités locales, Nature. Filtrez selon votre humeur du jour." color="text-amber-400" />
                 <FeatureCard icon={MapPin} title="En Chemin" description="Ajoutez des étapes à votre itinéraire ou laissez l'application vous suggérer des arrêts spontanés en roulant." color="text-emerald-400" />
                 <FeatureCard icon={Camera} title="Communauté" description="Chaque lieu a sa fiche détaillée. Vous avez trouvé une pépite ? Ajoutez votre propre découverte pour les autres." color="text-purple-400" />
              </div>
              <div className="bg-[#0b1021] rounded-2xl border border-slate-800 p-8 max-w-4xl mx-auto">
                 <h3 className="text-center text-white font-bold mb-8">Pourquoi choisir "Ça vaut le détour" ?</h3>
                 <div className="grid grid-cols-12 gap-2 md:gap-4 pb-4 border-b border-slate-800 px-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                    <div className="col-span-6">Fonctionnalité</div>
                    <div className="col-span-3 text-center text-emerald-400">Nous</div>
                    <div className="col-span-3 text-center">GPS Classique</div>
                 </div>
                 <ComparisonRow feature="Itinéraire A → B" us={true} others={true} />
                 <ComparisonRow feature="Découverte le long du trajet (Couloir)" us={true} others={false} />
                 <ComparisonRow feature="Rayon de détour ajustable" us={true} others={false} />
                 <ComparisonRow feature="Focus: Fermes, Vin, Histoire, Insolite" us={true} others={false} />
              </div>
           </div>
        </section>
        <section id="roadmap" className="py-24 bg-gradient-to-b from-[#02040a] to-[#050816]">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row gap-12 items-center mb-16">
                    <div className="flex-1">
                        <div className="inline-block px-3 py-1 mb-4 border border-indigo-500/30 rounded-full bg-indigo-900/20 text-indigo-300 text-xs font-bold tracking-widest uppercase">Roadmap</div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-serif">Le Futur de l'Aventure</h2>
                        <p className="text-slate-400 text-lg leading-relaxed">Nous ne construisons pas seulement une carte, mais un compagnon de route intelligent. Voici les modes exclusifs en cours de développement pour nos premiers utilisateurs.</p>
                    </div>
                    <div className="flex-1 w-full">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <RoadmapItem emoji="🧭" title="Mode Boussole" desc="Une simple flèche pour les vrais aventuriers. Suivez le cap, trouvez votre propre chemin." />
                            <RoadmapItem emoji="🛣️" title="Grain de la Route" desc="Choisissez la texture de votre voyage : routes panoramiques ou chemins de traverse." />
                            <RoadmapItem emoji="🏺" title="Mode Chineur" desc="Alertes en temps réel pour les brocantes и vide-greniers sur votre route." />
                            <RoadmapItem emoji="🧀" title="Coffre Vide" desc="Remplissez votre coffre de produits locaux : fermiers et artisans en direct." />
                            <RoadmapItem emoji="⏸️" title="L'Escale Parfaite" desc="Des arrêts synchronisés avec votre fatigue et les plus beaux panoramas." />
                            <RoadmapItem emoji="🏰" title="Point Mystère" desc="Laissez-vous guider à l'aveugle vers une destination surprise." />
                            <RoadmapItem emoji="🎧" title="Rétroviseur Temporel" desc="Des histoires audio géolocalisées qui racontent le passé des lieux traversés." />
                            <RoadmapItem emoji="⭐️" title="Club des Éclaireurs" desc="Gagnez des points, classements и badges en découvrant de nouveaux lieux." />
                        </div>
                    </div>
                </div>
                <AiLab />
            </div>
        </section>
        <footer id="join" className="py-24 text-center container mx-auto px-6 relative overflow-hidden bg-[#050816]">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[100px] -z-10"></div>
           <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-serif">Prêt à changer de route ?</h2>
           <p className="text-slate-400 mb-10 max-w-xl mx-auto">Rejoignez la liste d'attente pour être parmi les premiers explorateurs à tester l'application sur iPhone et Android.</p>
           <div className="flex justify-center w-full mb-16">
             <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col md:flex-row gap-4">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" className="flex-1 bg-slate-800 text-white placeholder-slate-500 px-6 py-4 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500/50 transition-all text-center md:text-left" required />
                <button type="submit" disabled={status === 'loading' || status === 'success'} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-4 rounded-lg transition-all shadow-lg shadow-emerald-900/20 whitespace-nowrap">
                  {status === 'loading' ? '...' : status === 'success' ? 'Inscrit !' : 'Rejoindre'}
                </button>
             </form>
           </div>
           <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-slate-600 text-sm gap-4">
              <div className="flex items-center gap-2"><Globe size={16} /><span>© 2025 Ça vaut le détour. Fait avec passion pour les voyageurs.</span></div>
              <div className="flex gap-6"><a href="#" className="hover:text-emerald-400 transition">Confidentialité</a><a href="#" className="hover:text-emerald-400 transition">Contact</a></div>
           </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
