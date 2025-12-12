import { useState, useEffect, useMemo } from 'react';
import { db, auth } from './firebase';
import { collection, doc, setDoc, onSnapshot, addDoc, updateDoc } from 'firebase/firestore';
import { signOut, signInAnonymously, onAuthStateChanged, type User } from 'firebase/auth';

// --- CONFIG ---

const USERS = [
  { username: "anas9910", password: "24177", appId: "expenso-e317f" },
  { username: "user2", password: "22222", appId: "expenso-test-mode" },
  { username: "user3", password: "3333", appId: "expenso-user-333" },
  { username: "user4", password: "4444", appId: "expenso-user-444" },
  { username: "user5", password: "5555", appId: "expenso-user-555" }
];



const DEFAULT_CATEGORIES: Record<string, any> = {
  food: { label: 'Food', color: '#F59E0B', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2zm0 0h18M5 7h14M5 11h7" /></svg> },
  water: { label: 'Water', color: '#3498DB', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.472 15.03L3 12.56C3 12.23 3.23 12 3.56 12H5.44C5.77 12 6 12.23 6 12.56L8.53 15.03C8.72 15.22 9 15.09 9 14.82V3.5C9 3.22 8.78 3 8.5 3H3.5C3.22 3 3 3.22 3 3.5V14.82C3 15.09 3.28 15.22 3.47 15.03L5.472 15.03zM18.53 15.03L21 12.56C21 12.23 20.77 12 20.44 12H18.56C18.23 12 18 12.23 18 12.56L15.47 15.03C15.28 15.22 15 15.09 15 14.82V3.5C15 3.22 15.22 3 15.5 3H20.5C20.78 3 21 3.22 21 3.5V14.82C21 15.09 20.72 15.22 20.53 15.03L18.53 15.03zM12 10.5C12.83 10.5 13.5 9.83 13.5 9C13.5 8.17 12.83 7.5 12 7.5S10.5 8.17 10.5 9C10.5 9.83 11.17 10.5 12 10.5zM12 21C15.31 21 18 18.31 18 15V12H6V15C6 18.31 8.69 21 12 21z" /></svg> },
  electricity: { label: 'Electricity', color: '#F9C851', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
  rent: { label: 'Rent', color: '#EF4444', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2a1 1 0 01-1-1v-4z" /></svg> },
  transport: { label: 'Transport', color: '#8B5CF6', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg> },
  vecuil_expense: { label: 'Vecuil Expense', color: '#34495E', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg> },
  gazolin: { label: 'Gazolin', color: '#E67E22', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.636 18.364a9 9 0 1112.728 0M12 21v-7" /></svg> },
  internet: { label: 'Internet', color: '#6366F1', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11.99a9.002 9.002 0 1017.89 0A9.002 9.002 0 003.054 12z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 3.53a9.003 9.003 0 010 16.94 9.003 9.003 0 010-16.94zM3.53 12.002a9.003 9.003 0 0116.94 0 9.003 9.003 0 01-16.94 0z" /></svg> },
  other: { label: 'Other', color: '#EC4899', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 5.523-4.477 10-10 10S1 17.523 1 12S5.477 2 11 2s10 4.477 10 10z" /></svg> }
};

// --- HELPERS ---

const renderSafeIcon = (icon: any) => {
  if (typeof icon === 'string' && icon.includes('<svg')) {
    return <span dangerouslySetInnerHTML={{ __html: icon }} />;
  }
  return icon;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount) + ' DH';
};

const formatDate = (dateString: string) => {
  // dateString is "YYYY-MM-DD"
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
};

const getTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- INTERFACES ---

interface Expense {
  id?: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  tags: string[];
}

interface Income {
  id?: string;
  title: string;
  amount: number;
  date: string;
}

interface Category {
  label: string;
  budget?: number | null;
  color?: string;
  icon?: any; // JSX Element
}

// --- COMPONENTS ---

// Password Gate
const PasswordGate = ({ onLogin }: { onLogin: (appId: string) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedUser = USERS.find(u => u.username === username && u.password === password);
    if (matchedUser) {
      onLogin(matchedUser.appId);
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div id="password-gate" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[--bg-primary]">
      <div className="glass-card w-full max-w-sm p-6">
        <h3 className="text-2xl font-semibold text-[--text-primary] mb-6 text-center">Expenso</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[--text-secondary] mb-2">Username</label>
            <input type="text" value={username} onChange={e => { setUsername(e.target.value); setError(false); }} className="glass-input w-full rounded-lg p-3" required autoComplete="username" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[--text-secondary] mb-2">Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); setError(false); }} className="glass-input w-full rounded-lg p-3 pr-10" required maxLength={5} autoComplete="current-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-[--text-secondary] hover:text-[--text-primary]">
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 .23-.62.5-1.22.814-1.78m3.95 3.95A3 3 0 018.02 14.02l-1.07-1.07m5.92-5.92A3 3 0 0115.98 9.98l1.07 1.07m-5.92 5.92l-1.07-1.07m5.92-5.92l1.07 1.07M3 3l18 18" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-.07.207-.141.414-.214.618m-2.06 3.095A9.002 9.002 0 0112 19c-4.478 0-8.268-2.943-9.542-7 .07-.207-.141-.414-.214-.618m2.06-3.095l-2.06-3.095m16 0l-2.06 3.095" /></svg>
                )}
              </button>
            </div>
            {error && <p className="text-red-400 text-sm mt-2">Incorrect username or password.</p>}
          </div>
          <div className="flex justify-end pt-4">
            <button type="submit" className="w-full font-medium py-3 px-5 rounded-full transition-colors duration-200" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--accent-primary-text)' }}>Unlock</button>
          </div>
        </form>
      </div>
    </div>
  );
};

function App() {
  const [appId, setAppId] = useState<string | null>(() => sessionStorage.getItem('expenso_app_id'));
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [theme, setTheme] = useState('dark');
  const [budget, setBudget] = useState(0);
  const [activeTab, setActiveTab] = useState<'home' | 'stats' | 'history' | 'settings'>('home');

  // Filter/Sort State
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [filterCategory] = useState('all'); // setFilterCategory unused
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [searchTerm, setSearchTerm] = useState('');
  const [historyType, setHistoryType] = useState('expenses');
  const [filterRecurring, setFilterRecurring] = useState(false);


  const [isFabOpen, setIsFabOpen] = useState(false);

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catFormLabel, setCatFormLabel] = useState('');
  const [catFormColor, setCatFormColor] = useState('#1DB954');
  const [catFormIcon, setCatFormIcon] = useState<any>('');
  const [editingCatKey, setEditingCatKey] = useState<string | null>(null);

  // --- CONSTANTS ---
  const PRESET_ICONS = [
    '<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>', // Shopping
    '<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>', // Building
    '<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>', // Time
    '<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>', // Energy
    '<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>', // Education
    '<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>', // Internet
    '<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11.99a9.002 9.002 0 1017.89 0A9.002 9.002 0 003.054 12z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 3.53a9.003 9.003 0 010 16.94 9.003 9.003 0 010-16.94zM3.53 12.002a9.003 9.003 0 0116.94 0 9.003 9.003 0 01-16.94 0z" /></svg>', // Globe
    '<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>', // Entertainment
    '<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>', // Health/Love
    '<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>', // Money
    '<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>', // Food (Placeholder Cross -> Cutlery/Plate to be distinct)
    '<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>', // Work
    '<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3 3-3 3 3-3-3-3m0 10l3 3-3 3 3-3-3-3" /></svg>', // Pets (Bone shape? Placeholder unique path)
    '<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>', // Gift
    '<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>', // Gaming
  ];

  // Smart Icon Detection (Keywords for each PRESET_ICON index)
  const ICON_KEYWORDS = [
    ['shop', 'buy', 'store', 'market', 'grocery', 'cloth', 'fruit', 'veg', 'food'], // 0: Shopping
    ['rent', 'home', 'house', 'bill', 'util', 'apart', 'mortgage'], // 1: Building
    ['sub', 'month', 'year', 'week', 'daily', 'time', 'date'], // 2: Time
    ['elect', 'power', 'light', 'gas', 'water', 'internet', 'wifi'], // 3: Energy
    ['school', 'course', 'learn', 'book', 'edu', 'class', 'study'], // 4: Education
    ['net', 'web', 'phone', 'data', 'mobile', 'tech'], // 5: Internet
    ['travel', 'trip', 'flight', 'hotel', 'air', 'vacation', 'uber', 'taxi', 'indrive', 'transport', 'car', 'bus', 'train', 'gas'], // 6: Transport/Travel
    ['movie', 'film', 'netflix', 'game', 'play', 'fun', 'entertainment', 'tv', 'music', 'spotify'], // 7: Entertainment
    ['health', 'doc', 'med', 'gym', 'fit', 'love', 'gift', 'date', 'sport', 'run'], // 8: Health/Love
    ['salary', 'wage', 'invest', 'save', 'cash', 'money', 'deposit', 'bank'], // 9: Money
    ['food', 'eat', 'restaurant', 'cafe', 'coffee', 'snack', 'drink', 'dinner', 'lunch', 'breakfast'], // 10: Food
    ['work', 'job', 'office', 'career', 'business'], // 11: Work
    ['pet', 'dog', 'cat', 'vet', 'animal'], // 12: Pets
    ['gift', 'present', 'donation', 'charity'], // 13: Gift
    ['game', 'xbox', 'ps5', 'steam', 'playstation', 'nintendo'], // 14: Gaming
  ];

  const getSmartIcon = (label: string) => {
    const lower = label.toLowerCase();
    for (let i = 0; i < ICON_KEYWORDS.length; i++) {
      if (ICON_KEYWORDS[i].some(k => lower.includes(k))) {
        return PRESET_ICONS[i];
      }
    }
    return ''; // No match
  };

  const [sortType, setSortType] = useState('date-desc');
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    console.log("Current catFormIcon updated:", PRESET_ICONS.indexOf(catFormIcon));
  }, [catFormIcon]);
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  useEffect(() => {
    if (!appId) return;
    sessionStorage.setItem('expenso_app_id', appId);

    if (!user) {
      signInAnonymously(auth).catch((error) => console.error("Auth error:", error));
      return;
    }

    // Listeners
    const basePath = `artifacts/${appId}/public/data`;

    const unsubExp = onSnapshot(collection(db, basePath, 'expenses'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Expense));
      setExpenses(data);
    });

    const unsubInc = onSnapshot(collection(db, basePath, 'income'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Income));
      setIncome(data);
    });

    const unsubSettings = onSnapshot(doc(db, basePath, 'settings', 'userSettings'), (snap) => {
      if (snap.exists()) {
        const s = snap.data();
        if (s.theme) setTheme(s.theme);
        if (s.budget) setBudget(s.budget);
        if (s.categories) setCategories(s.categories);
        else setCategories(DEFAULT_CATEGORIES as any); // Fallback
      } else {
        setCategories(DEFAULT_CATEGORIES as any);
        setTheme('dark');
      }
    });

    return () => { unsubExp(); unsubInc(); unsubSettings(); };
  }, [appId, user]);

  // Apply Theme
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);



  // --- COMPUTED ---

  const periodExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
  }, [expenses, currentYear, currentMonth]);

  const periodIncome = useMemo(() => {
    return income.filter(i => {
      const d = new Date(i.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
  }, [income, currentYear, currentMonth]);



  const stats = useMemo(() => {
    const totalExp = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalInc = periodIncome.reduce((sum, i) => sum + i.amount, 0);
    const savings = totalInc - totalExp;

    // Category breakdown
    const catTotals: Record<string, number> = {};
    periodExpenses.forEach(e => {
      const k = e.category || 'other';
      catTotals[k] = (catTotals[k] || 0) + e.amount;
    });

    const topCatKey = Object.keys(catTotals).reduce((a, b) => catTotals[a] > catTotals[b] ? a : b, 'other');
    const highestExp = periodExpenses.reduce((max, e) => e.amount > max.amount ? e : max, { amount: 0, title: '--' } as Expense);



    // Calculate Weekly Stats
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
    // Adjust to Monday start
    const diffToMon = (dayOfWeek + 6) % 7;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - diffToMon);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
    const endOfWeekStr = endOfWeek.toISOString().split('T')[0];

    const weeklyExpenses = expenses.filter(e => e.date >= startOfWeekStr && e.date <= endOfWeekStr);
    const weeklyTotal = weeklyExpenses.reduce((sum, e) => sum + e.amount, 0);

    const todayStr = getTodayString();
    const todayTotal = expenses.filter(e => e.date === todayStr).reduce((sum, e) => sum + e.amount, 0);

    // Weekly Top Category
    const weeklyCatTotals: Record<string, number> = {};
    weeklyExpenses.forEach(e => {
      e.category = e.category || 'other';
      weeklyCatTotals[e.category] = (weeklyCatTotals[e.category] || 0) + e.amount;
    });
    const weeklyTopCatKey = Object.keys(weeklyCatTotals).reduce((a, b) => weeklyCatTotals[a] > weeklyCatTotals[b] ? a : b, 'other');

    let historyData = [...expenses, ...income];
    // Sort initially by date desc to have a base order
    historyData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { totalExp, totalInc, savings, catTotals, topCatKey, highestExp, history: historyData, weeklyTotal, todayTotal, weeklyTopCatKey };
  }, [periodExpenses, periodIncome, expenses, income]);

  const filteredHistory = useMemo(() => {
    let data = [...stats.history];

    // 1. Filter by Type
    if (historyType === 'expenses') {
      data = data.filter(item => 'category' in item);
    } else if (historyType === 'income') {
      data = data.filter(item => !('category' in item));
    }

    // 2. Filter by Category
    if (filterCategory !== 'all') {
      data = data.filter(item => 'category' in item && (item as Expense).category === filterCategory);
    }

    // 3. Search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(item => item.title.toLowerCase().includes(lower) || ((item as Expense).tags?.some(t => t.toLowerCase().includes(lower))));
    }

    // 4. Recurring Filter
    if (filterRecurring) {
      data = data.filter(item => 'tags' in item && (item as Expense).tags?.includes('recurring'));
    }

    // 5. Sorting
    data.sort((a, b) => {
      if (sortType === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortType === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortType === 'amount-desc') return b.amount - a.amount;
      if (sortType === 'amount-asc') return a.amount - b.amount;
      return 0;
    });

    return data;
  }, [stats.history, historyType, filterCategory, searchTerm, filterRecurring, sortType]);

  // Group by Date for Daily View (Computed at top level)
  const groupedHistory = useMemo(() => {
    const groups: Record<string, { date: Date, items: any[], total: number }> = {};

    filteredHistory.forEach((item: any) => {
      const dateKey = item.date; // YYYY-MM-DD
      if (!groups[dateKey]) {
        groups[dateKey] = { date: new Date(item.date), items: [], total: 0 };
      }
      groups[dateKey].items.push(item);

      if ('category' in item) {
        groups[dateKey].total -= item.amount; // Expense is negative for daily total
      } else {
        groups[dateKey].total += item.amount; // Income is positive
      }
    });

    // Sort groups by date desc
    return Object.values(groups).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [filteredHistory]);

  const handleLogout = async () => {
    await signOut(auth);
    sessionStorage.removeItem('expenso_app_id');
    setAppId(null);
  };


  // --- MODAL STATE ---
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState<string>('other');
  const [formDate, setFormDate] = useState(getTodayString());
  // const [formTags, setFormTags] = useState(''); // TODO: Implement tags

  const openAddExpense = () => {
    setModalMode('add');
    setTransactionType('expense');
    setEditingId(null);
    setFormTitle('');
    setFormAmount('');
    setFormCategory('other');
    setFormDate(getTodayString());
    setIsExpenseModalOpen(true);
  };

  const openEditExpense = (expense: Expense) => {
    setModalMode('edit');
    setTransactionType('expense');
    setEditingId(expense.id!);
    setFormTitle(expense.title);
    setFormAmount(expense.amount.toString());
    setFormCategory(expense.category);
    setFormDate(expense.date);
    setIsExpenseModalOpen(true);
  };

  const openAddIncome = () => {
    setModalMode('add');
    setTransactionType('income');
    setEditingId(null);
    setFormTitle('');
    setFormAmount('');
    setFormDate(getTodayString());
    setIsExpenseModalOpen(true);
  };

  const openEditIncome = (income: Income) => {
    setModalMode('edit');
    setTransactionType('income');
    setEditingId(income.id!);
    setFormTitle(income.title);
    setFormAmount(income.amount.toString());
    setFormDate(income.date);
    setIsExpenseModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appId) return;

    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount <= 0) return;

    const baseData = {
      title: formTitle,
      amount,
      date: formDate,
    };

    const data = transactionType === 'expense' ? { ...baseData, category: formCategory, tags: [] } : baseData;
    const collectionName = transactionType === 'expense' ? 'expenses' : 'income';

    try {
      if (modalMode === 'add') {
        await addDoc(collection(db, `artifacts/${appId}/public/data/${collectionName}`), data);
      } else if (modalMode === 'edit' && editingId) {
        await updateDoc(doc(db, `artifacts/${appId}/public/data/${collectionName}`, editingId), data);
      }
      setIsExpenseModalOpen(false);
    } catch (error) {
      console.error("Error saving transaction:", error);
    }
  };

  // --- HANDLERS CONT. ---

  const handleThemeToggle = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (appId) {
      await setDoc(doc(db, `artifacts/${appId}/public/data/settings/userSettings`), { theme: newTheme }, { merge: true });
    }
  };



  /* const handleDelete = async (id: string, type: 'expenses' | 'income') => {
    // Simple confirm generic for now, ideally custom modal
    if (!appId || !confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteDoc(doc(db, `artifacts/${appId}/public/data/${type}`, id));
    } catch (e) {
      console.error("Delete failed", e);
    }
  }; */

  const openCatModal = (catKey?: string) => {
    if (catKey && categories[catKey]) {
      console.log("Opening Cat Modal Edit", catKey);
      setEditingCatKey(catKey);
      setCatFormLabel(categories[catKey].label);
      setCatFormColor(categories[catKey].color || '#1DB954');
      setCatFormIcon(categories[catKey].icon);
      setIsCatModalOpen(true);
    } else {
      console.log("Opening Cat Modal New");
      setEditingCatKey(null);
      setCatFormLabel('');
      setCatFormColor('#1DB954');
      setCatFormIcon(PRESET_ICONS[0]);
      setIsCatModalOpen(true);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appId) return;

    const slug = editingCatKey || catFormLabel.toLowerCase().replace(/\s+/g, '_');
    const newCat = {
      label: catFormLabel,
      color: catFormColor,
      icon: catFormIcon
    };

    const updatedCategories = { ...categories, [slug]: newCat };

    try {
      await setDoc(doc(db, `artifacts/${appId}/public/data/settings/userSettings`), { categories: updatedCategories }, { merge: true });
      setIsCatModalOpen(false);
    } catch (err) {
      console.error("Error saving category", err);
    }
  };

  const handleDeleteCategory = async (catKey: string) => {
    if (!appId || !confirm(`Delete category "${categories[catKey].label}"? Existing expenses will be kept but may look undefined.`)) return;

    const updatedCategories = { ...categories };
    delete updatedCategories[catKey];

    try {
      await setDoc(doc(db, `artifacts/${appId}/public/data/settings/userSettings`), { categories: updatedCategories }, { merge: true });
      if (editingCatKey === catKey) setIsCatModalOpen(false);
    } catch (err) {
      console.error("Error deleting category", err);
    }
  };

  if (!appId) {
    return <PasswordGate onLogin={setAppId} />;
  }

  const renderCatModal = () => {
    if (!isCatModalOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCatModalOpen(false)}></div>
        <div className="glass-card z-10 w-full max-w-sm p-6 relative bg-[--bg-secondary] max-h-[80vh] overflow-y-auto">
          <h3 className="text-xl font-semibold text-[--text-primary] mb-6">
            {editingCatKey ? 'Edit Category' : 'New Category'}
          </h3>
          <form onSubmit={handleSaveCategory} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[--text-secondary] mb-2">Label</label>
              <input type="text" value={catFormLabel} onChange={e => {
                const val = e.target.value;
                setCatFormLabel(val);
                if (!editingCatKey) { // Only auto-select on new category
                  const smartIcon = getSmartIcon(val);
                  console.log("Input:", val, "Matched Icon Index:", PRESET_ICONS.indexOf(smartIcon));
                  if (smartIcon) setCatFormIcon(smartIcon);
                }
              }} className="glass-input w-full rounded-lg p-3" placeholder="e.g. Gym" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[--text-secondary] mb-2">Color</label>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {['#F59E0B', '#3498DB', '#F9C851', '#EF4444', '#8B5CF6', '#34495E', '#E67E22', '#6366F1', '#EC4899', '#1DB954'].map(c => (
                  <button key={c} type="button" onClick={() => setCatFormColor(c)} className={`w-8 h-8 rounded-full flex-shrink-0 ${catFormColor === c ? 'ring-2 ring-white' : ''}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[--text-secondary] mb-2">Icon</label>
              <div className="grid grid-cols-5 gap-2">
                {PRESET_ICONS.map((icon, i) => {
                  const isActive = catFormIcon === icon;
                  return (
                    <button key={i} type="button" onClick={() => { console.log("Clicked Icon Index:", i); setCatFormIcon(icon); }} className={`p-2 rounded-lg flex items-center justify-center transition-colors duration-200 ${isActive ? 'bg-[--accent-primary] text-[--bg-primary] shadow-lg scale-105' : 'hover:bg-[--bg-tertiary] text-[--text-primary]'}`}>
                      <div className="w-6 h-6">{renderSafeIcon(icon)}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              {editingCatKey && (
                <button type="button" onClick={() => handleDeleteCategory(editingCatKey)} className="mr-auto text-red-400 hover:text-red-300">Delete</button>
              )}
              <button type="button" onClick={() => setIsCatModalOpen(false)} className="px-5 py-2 rounded-full text-[--text-secondary] hover:bg-[--bg-tertiary]">Cancel</button>
              <button type="submit" className="px-5 py-2 rounded-full font-medium" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--accent-primary-text)' }}>Save</button>
            </div>
          </form>

          {/* List existing if adding new ? No, just simple create/edit focus. */}
        </div>
      </div>
    );
  };

  const renderModal = () => {
    if (!isExpenseModalOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsExpenseModalOpen(false)}></div>
        <div className="glass-card z-10 w-full max-w-sm p-6 relative bg-[--bg-secondary]">
          <h3 className="text-2xl font-semibold text-[--text-primary] mb-6">
            {modalMode === 'add' ? 'Add' : 'Edit'} {transactionType === 'expense' ? 'Expense' : 'Income'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[--text-secondary] mb-2">Amount</label>
              <input type="number" step="0.01" value={formAmount} onChange={e => setFormAmount(e.target.value)} className="glass-input w-full rounded-lg p-3 text-2xl" placeholder="0.00" autoFocus required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[--text-secondary] mb-2">Title</label>
              <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} className="glass-input w-full rounded-lg p-3" placeholder="What is this for?" required />
            </div>

            {transactionType === 'expense' && (
              <div>
                <label className="block text-sm font-medium text-[--text-secondary] mb-2">Category</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.keys(categories).map(catKey => {
                    const isActive = formCategory === catKey;
                    const cat = categories[catKey];
                    return (
                      <button key={catKey} type="button" onClick={() => setFormCategory(catKey)} className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors ${isActive ? 'bg-[--bg-tertiary] ring-2 ring-[--accent-primary]' : 'hover:bg-[--bg-tertiary]'}`}>
                        <div className={isActive ? 'text-[--accent-primary]' : 'text-[--text-secondary]'}>
                          {renderSafeIcon(cat.icon)}
                        </div>
                        <span className="text-[10px] text-[--text-secondary] truncate w-full text-center">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[--text-secondary] mb-2">Date</label>
                <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="glass-input w-full rounded-lg p-3" required />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="px-5 py-2 rounded-full text-[--text-secondary] hover:bg-[--bg-tertiary]">Cancel</button>
              <button type="submit" className="px-5 py-2 rounded-full font-medium" style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--accent-primary-text)' }}>Save</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // --- MAIN RENDER ---
  const currentTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6 pb-24">
            {/* Totals Card */}
            <div className="glass-card p-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                <div>
                  <h2 className="text-sm font-medium text-[--text-tertiary] mb-2">Total This Month</h2>
                  <div className={`text-4xl md:text-5xl font-bold ${stats.totalExp > 0 ? 'text-red-500' : 'text-[--text-primary]'}`}>
                    {stats.totalExp > 0 ? '-' : ''} {formatCurrency(stats.totalExp)}
                  </div>
                </div>
                <div className="sm:text-right mt-4 sm:mt-0">
                  <h2 className="text-sm font-medium text-[--text-tertiary] mb-2">Budget</h2>
                  <div className="text-2xl font-semibold text-[--text-primary]">{budget > 0 ? formatCurrency(budget) : 'Not Set'}</div>
                </div>
              </div>
              {/* Budget Bar */}
              {budget > 0 && (
                <div className="mt-4">
                  <div className="w-full bg-[--bg-tertiary] rounded-full h-2.5">
                    <div className="h-2.5 rounded-full transition-all duration-500" style={{ width: `${Math.min((stats.totalExp / budget) * 100, 100)}%`, backgroundColor: (stats.totalExp / budget) > 0.9 ? 'var(--accent-danger)' : 'var(--accent-primary)' }}></div>
                  </div>
                  <p className={`text-right mt-1 text-sm font-medium ${budget - stats.totalExp >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                    {budget - stats.totalExp >= 0 ? `${formatCurrency(budget - stats.totalExp)} remaining` : `${formatCurrency(Math.abs(budget - stats.totalExp))} over budget`}
                  </p>
                </div>
              )}
            </div>

            {/* Weekly Summary */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-[--text-primary] mb-4">This Week's Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-[--text-tertiary]">TOTAL SPENT</h3>
                    <p className="text-2xl font-semibold text-[--text-primary]">{formatCurrency(stats.weeklyTotal)}</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-sm font-medium text-[--text-tertiary]">TODAY</h3>
                    <p className={`text-2xl font-semibold ${stats.todayTotal > 0 ? 'text-[--accent-primary]' : 'text-[--text-primary]'}`} style={stats.todayTotal > 0 ? { color: 'var(--accent-primary)' } : {}}>{formatCurrency(stats.todayTotal)}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[--text-tertiary]">TOP CATEGORY</h3>
                  <p className="text-lg font-semibold text-[--text-primary]">{stats.weeklyTotal > 0 ? (categories[stats.weeklyTopCatKey]?.label || '--') : '--'}</p>
                </div>
              </div>
            </div>

            {/* Recent History Preview */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-[--text-primary]">Recent Transactions</h2>
                <button onClick={() => setActiveTab('history')} className="text-sm text-[--accent-primary]">View All</button>
              </div>
              {filteredHistory.slice(0, 5).map((item: any) => {
                const isExpense = 'category' in item;
                const cat = isExpense ? (categories[item.category] || DEFAULT_CATEGORIES.other) : null;
                return (
                  <div key={item.id} className="glass-card p-4 flex justify-between items-center cursor-pointer" onClick={() => { if (isExpense) openEditExpense(item); else openEditIncome(item); }}>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-[--bg-tertiary] rounded-xl text-[--text-primary]">
                        {isExpense ? renderSafeIcon(cat?.icon) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" /></svg>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-[--text-primary]">{item.title}</p>
                        <p className="text-xs text-[--text-secondary]">{formatDate(item.date)}</p>
                      </div>
                    </div>
                    <div className={`font-semibold ${isExpense ? 'text-red-500' : 'text-green-400'}`}>
                      {isExpense ? '-' : '+'} {formatCurrency(item.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 'stats':
        return (
          <div className="space-y-6 pb-24">
            <div className="glass-card p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-[--text-primary]">Monthly Breakdown</h3>
                <div className="flex gap-2">
                  <button onClick={() => setChartType('bar')} className={`p-2 rounded-lg glass-input transition-colors ${chartType === 'bar' ? 'bg-[--bg-tertiary] text-[--accent-primary]' : 'text-[--text-secondary]'}`} style={chartType === 'bar' ? { backgroundColor: 'var(--accent-primary-subtle-bg)', color: 'var(--accent-primary)' } : {}}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  </button>
                  <button onClick={() => setChartType('pie')} className={`p-2 rounded-lg glass-input transition-colors ${chartType === 'pie' ? 'bg-[--bg-tertiary] text-[--accent-primary]' : 'text-[--text-secondary]'}`} style={chartType === 'pie' ? { backgroundColor: 'var(--accent-primary-subtle-bg)', color: 'var(--accent-primary)' } : {}}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                  </button>
                </div>
              </div>
              <div className={`w-full p-2 sm:p-4 bg-[--bg-tertiary] rounded-xl overflow-x-auto ${chartType === 'pie' ? 'flex flex-col items-center justify-center' : 'h-48 flex items-end gap-2'}`} id="chart-container">
                {Object.keys(stats.catTotals).length > 0 ? (
                  chartType === 'bar' ? (
                    Object.keys(stats.catTotals).map(key => {
                      const total = stats.catTotals[key];
                      const max = Math.max(...Object.values(stats.catTotals));
                      const pct = (total / max) * 100;
                      const cat = categories[key] || DEFAULT_CATEGORIES.other;
                      return (
                        <div key={key} className="flex flex-col items-center justify-end h-full" style={{ minWidth: 40 }}>
                          <div className="w-1/2 md:w-3/5 rounded-t-md transition-all duration-500" style={{ height: `${pct}%`, backgroundColor: cat.color || '#808080' }} title={`${cat.label}: ${formatCurrency(total)}`}></div>
                          <span className="text-xs text-[--text-tertiary] mt-1 truncate w-full text-center">{cat.label}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center gap-8">
                      <div className="relative w-32 h-32 rounded-full" style={{
                        background: `conic-gradient(${Object.keys(stats.catTotals).reduce<{ current: number, parts: string[] }>((acc, key) => {
                          const val = stats.catTotals[key];
                          const total = stats.totalExp || 1;
                          const deg = (val / total) * 360;
                          const cat = categories[key] || DEFAULT_CATEGORIES.other;
                          acc.parts.push(`${cat.color} ${acc.current}deg ${acc.current + deg}deg`);
                          acc.current += deg;
                          return acc;
                        }, { current: 0, parts: [] }).parts.join(', ')
                          })`
                      }}></div>
                      <div className="space-y-1">
                        {Object.keys(stats.catTotals).map(key => {
                          const cat = categories[key] || DEFAULT_CATEGORIES.other;
                          return (
                            <div key={key} className="flex items-center gap-2 text-xs">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                              <span className="text-[--text-secondary]">{cat.label}</span>
                              <span className="font-semibold text-[--text-primary]">{formatCurrency(stats.catTotals[key])}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                ) : <div className="w-full h-full flex items-center justify-center text-[--text-tertiary] p-4">No data</div>}
              </div>
            </div>

            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-[--text-primary] mb-4">Insights</h2>
              <div className="space-y-4">
                <div className="flex justify-between border-b border-[--border-primary] pb-2">
                  <span className="text-[--text-tertiary]">Monthly Savings</span>
                  <span className={`font-semibold ${stats.savings >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(stats.savings)}</span>
                </div>
                <div className="flex justify-between border-b border-[--border-primary] pb-2">
                  <span className="text-[--text-tertiary]">Highest Expense</span>
                  <div className="text-right">
                    <div className="font-semibold text-[--text-primary]">{formatCurrency(stats.highestExp.amount)}</div>
                    <div className="text-xs text-[--text-secondary]">{stats.highestExp.title}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'history':
        return (
          <div className="space-y-4 pb-24 h-full flex flex-col">
            <div className="sticky top-[72px] z-20 bg-[--bg-primary] pb-4 space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="glass-input w-full rounded-full py-2 pl-10 pr-4 text-sm" />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-3 text-[--text-tertiary]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <select value={historyType} onChange={e => setHistoryType(e.target.value)} className="glass-input text-sm rounded-full py-2 px-3">
                  <option value="all">All</option>
                  <option value="expenses">Exp</option>
                  <option value="income">Inc</option>
                </select>
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                <button onClick={() => setFilterRecurring(!filterRecurring)} className={`px-3 py-1 rounded-full text-xs whitespace-nowrap border ${filterRecurring ? 'bg-[--accent-primary-subtle-bg] border-[--accent-primary] text-[--accent-primary]' : 'border-[--border-primary] text-[--text-tertiary]'}`}>
                  Recurring
                </button>
                <select value={sortType} onChange={e => setSortType(e.target.value)} className="glass-input text-xs rounded-full py-1 px-2 border-none">
                  <option value="date-desc">Newest</option>
                  <option value="date-asc">Oldest</option>
                  <option value="amount-desc">Amount High</option>
                </select>
              </div>
            </div>

            <div className="space-y-6">
              {groupedHistory.map((group) => (
                <div key={group.date.toISOString()} className="glass-card overflow-hidden">
                  {/* Day Header */}
                  <div className="bg-[--bg-tertiary] p-4 flex justify-between items-center border-b border-[--border-primary]">
                    <div className="flex items-center gap-2 text-[--text-primary] font-medium">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[--text-tertiary]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span className="capitalize">{group.date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric' })}</span>
                    </div>
                    <span className={`font-semibold ${group.total >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {group.total > 0 ? '+' : ''}{formatCurrency(group.total)}
                    </span>
                  </div>

                  {/* Transactions List */}
                  <div className="divide-y divide-[--border-primary]">
                    {group.items.map((item: any) => {
                      const isExpense = 'category' in item;
                      const cat = isExpense ? (categories[item.category] || DEFAULT_CATEGORIES.other) : null;
                      return (
                        <div key={item.id} className="p-4 flex justify-between items-center hover:bg-[--bg-tertiary] transition-colors cursor-pointer" onClick={() => { if (isExpense) openEditExpense(item); else openEditIncome(item); }}>
                          <div className="flex items-center gap-4">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: isExpense ? (cat?.color || '#808080') : '#22c55e' }}></div>
                            <div>
                              <p className="font-semibold text-[--text-primary] text-sm">{item.title}</p>
                              <p className="text-xs text-[--text-tertiary]">{cat?.label || 'Income'}</p>
                            </div>
                          </div>
                          <div className={`font-medium text-sm ${isExpense ? 'text-[--text-primary]' : 'text-green-400'}`}>
                            {formatCurrency(item.amount)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {groupedHistory.length === 0 && (
                <div className="text-center text-[--text-tertiary] py-10">No transactions found.</div>
              )}
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-4 pb-24">
            <div className="glass-card p-6 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-[--accent-primary] flex items-center justify-center text-2xl font-bold text-white mb-4">
                {user?.uid.substring(0, 2).toUpperCase() || 'U'}
              </div>
              <h2 className="text-xl font-semibold text-[--text-primary]">User Profile</h2>
              <p className="text-[--text-secondary] text-sm">App ID: {appId}</p>
            </div>

            <div className="glass-card p-0 overflow-hidden divide-y divide-[--border-primary]">
              <button onClick={handleThemeToggle} className="w-full p-4 flex justify-between items-center hover:bg-[--bg-tertiary]">
                <span className="text-[--text-primary]">Theme</span>
                <span className="text-[--accent-primary]">{theme === 'light' ? 'Light' : 'Dark'}</span>
              </button>
              <button onClick={() => openCatModal()} className="w-full p-4 flex justify-between items-center hover:bg-[--bg-tertiary]">
                <span className="text-[--text-primary]">Manage Categories</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[--text-tertiary]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              <button onClick={handleLogout} className="w-full p-4 flex justify-between items-center hover:bg-[--bg-tertiary] text-red-400">
                <span>Sign Out</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };



  return (
    <div className="min-h-screen font-sans text-[--text-secondary] max-w-xl mx-auto p-4 relative">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-[--bg-primary] pt-2 pb-4 flex justify-between items-center transition-colors duration-300">
        <div>
          <h1 className="text-2xl font-bold text-[--text-primary] tracking-tight">Expenso</h1>
          <select
            className="bg-transparent text-sm text-[--accent-primary] font-medium outline-none cursor-pointer"
            value={`${currentYear}-${currentMonth}`}
            onChange={e => {
              const [y, m] = e.target.value.split('-').map(Number);
              setCurrentYear(y);
              setCurrentMonth(m);
            }}
          >
            {Array.from({ length: 12 }).map((_, i) => {
              const d = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
              return <option key={i} value={`${d.getFullYear()}-${d.getMonth()}`} className="bg-[--bg-secondary] text-[--text-primary]">{d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</option>;
            })}
          </select>
        </div>
        <div className="w-8 h-8 rounded-full bg-[--bg-tertiary] flex items-center justify-center text-[--accent-primary] font-bold text-xs border border-[--border-primary]" onClick={() => setActiveTab('settings')}>
          {user?.uid ? user.uid.substring(0, 1).toUpperCase() : 'U'}
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[80vh]">
        {currentTabContent()}
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-3 pointer-events-none">
        {/* Mini FABS */}
        <div className={`flex flex-col gap-3 transition-all duration-300 ${isFabOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
          <button onClick={() => { setIsFabOpen(false); openAddIncome(); }} className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg">
            <span className="text-sm font-medium">Income</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
          </button>
          <button onClick={() => { setIsFabOpen(false); openAddExpense(); }} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg">
            <span className="text-sm font-medium">Expense</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
          </button>
        </div>

        {/* Main Trigger */}
        <button onClick={() => setIsFabOpen(!isFabOpen)} className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-transform duration-300 pointer-events-auto ${isFabOpen ? 'rotate-45' : ''}`} style={{ backgroundColor: 'var(--accent-primary)' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[--bg-secondary]/90 backdrop-blur-md border-t border-[--border-primary] pb-safe pt-2 px-6 z-50">
        <div className="flex justify-between items-center max-w-xl mx-auto h-16">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-[--accent-primary]' : 'text-[--text-tertiary]'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={activeTab === 'home' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2a1 1 0 01-1-1v-4z" /></svg>
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1 ${activeTab === 'stats' ? 'text-[--accent-primary]' : 'text-[--text-tertiary]'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={activeTab === 'stats' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
            <span className="text-[10px] font-medium">Stats</span>
          </button>
          <div className="w-8"></div> {/* Spacer for FAB */}
          <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 ${activeTab === 'history' ? 'text-[--accent-primary]' : 'text-[--text-tertiary]'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={activeTab === 'history' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-[10px] font-medium">History</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 ${activeTab === 'settings' ? 'text-[--accent-primary]' : 'text-[--text-tertiary]'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={activeTab === 'settings' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </div>
      </nav>

      {renderModal()}
      {renderCatModal()}
    </div>
  );
}

export default App;
