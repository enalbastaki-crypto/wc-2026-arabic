import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, CalendarDays, BarChart3, Settings, Lock, Check, Save, UserCircle, Edit2, AlertCircle, Clock, LogIn, UserPlus, Trash2, ShieldAlert } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, deleteDoc, writeBatch } from 'firebase/firestore';

// --- إعدادات قاعدة البيانات الفايربيس ---
  const firebaseConfig = {
    apiKey: "AIzaSyC8S_ucFYD0yuwmnwHGrjMwMnCUKKitmXo",
    authDomain: "wc-2026-arabic.firebaseapp.com",
    projectId: "wc-2026-arabic",
    storageBucket: "wc-2026-arabic.firebasestorage.app",
    messagingSenderId: "304563147258",
    appId: "1:304563147258:web:8ed60fec479f142fab9443"
  };

// تهيئة الخدمة
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'world-cup-app-id-ar';

// --- الثوابت والإعدادات ---
const ADMIN_PASSCODE = '6014'; 

const GROUP_NAMES_AR = ['أ','ب','ج','د','هـ','و','ز','ح','ط','ي','ك','ل'];

const TOURNAMENT_GROUPS = {
  0: ['المكسيك', 'جنوب إفريقيا', 'كوريا الجنوبية', 'التشيك'],
  1: ['كندا', 'البوسنة والهرسك', 'الولايات المتحدة', 'المغرب'],
  2: ['البرازيل', 'فرنسا', 'السعودية', 'نيجيريا'],
  3: ['الأرجنتين', 'إسبانيا', 'اليابان', 'السنغال'],
  4: ['إنجلترا', 'ألمانيا', 'كولومبيا', 'أستراليا'],
  5: ['البرتغال', 'إيطاليا', 'مصر', 'بيرو'],
  6: ['هولندا', 'أوروغواي', 'إيران', 'غانا'],
  7: ['بلجيكا', 'كرواتيا', 'الإكوادور', 'الجزائر'],
  8: ['سويسرا', 'الدنمارك', 'ساحل العاج', 'قطر'],
  9: ['السويد', 'صربيا', 'تونس', 'تشيلي'],
  10: ['بولندا', 'ويلز', 'مالي', 'باراغواي'],
  11: ['النمسا', 'المجر', 'الكاميرون', 'فنزويلا']
};

const ALL_48_TEAMS = Object.values(TOURNAMENT_GROUPS).flat().sort((a, b) => a.localeCompare(b, 'ar'));

// توليد جدول الـ 104 مباراة لعام 2026
const BASE_MATCHES = (() => {
  const matches = [];
  let matchId = 1;
  const startDate = new Date('2026-06-11T00:00:00');
  let daysAdded = 0;

  // 1. مباريات المجموعات (72 مباراة)
  Object.entries(TOURNAMENT_GROUPS).forEach(([groupIndex, teams]) => {
    const groupLetter = GROUP_NAMES_AR[groupIndex];
    const pairings = [[0,1], [2,3], [0,2], [1,3], [3,0], [1,2]];
    pairings.forEach((pair, idx) => {
      const matchDate = new Date(startDate);
      matchDate.setDate(startDate.getDate() + daysAdded);
      
      matches.push({
        id: `m${matchId}`,
        order: matchId,
        group: `المجموعة ${groupLetter}`,
        date: matchDate.toISOString().split('T')[0],
        time: idx % 2 === 0 ? '18:00' : '22:00',
        teamA: teams[pair[0]],
        teamB: teams[pair[1]],
        isLocked: false, actualA: null, actualB: null
      });
      matchId++;
      if (matchId % 4 === 0) daysAdded++; 
    });
  });

  if(matches[0]) { matches[0].date = '2026-06-11'; matches[0].time = '22:00'; }
  if(matches[1]) { matches[1].date = '2026-06-12'; matches[1].time = '05:00'; }
  if(matches[2]) { matches[2].date = '2026-06-12'; matches[2].time = '22:00'; }

  // 2. الأدوار الإقصائية (32 مباراة)
  for (let i = 73; i <= 104; i++) {
    let stage = "دور الـ 32"; let dateStr = "2026-06-28";
    if (i > 88 && i <= 96) { stage = "دور الـ 16"; dateStr = "2026-07-04"; }
    else if (i > 96 && i <= 100) { stage = "ربع النهائي"; dateStr = "2026-07-09"; }
    else if (i > 100 && i <= 102) { stage = "نصف النهائي"; dateStr = "2026-07-14"; }
    else if (i === 103) { stage = "المركز الثالث"; dateStr = "2026-07-18"; }
    else if (i === 104) { stage = "النهائي"; dateStr = "2026-07-19"; }

    let teamAName, teamBName;
    if (i <= 88) {
      teamAName = `أول المجموعة ${GROUP_NAMES_AR[(i-73) % 12]}`;
      teamBName = `ثاني المجموعة ${GROUP_NAMES_AR[11 - ((i-73) % 12)]}`;
    } else {
      teamAName = `الفائز من م${i - 16}`;
      teamBName = `الفائز من م${i - 15}`;
    }

    matches.push({
      id: `m${i}`, order: i, group: stage, date: dateStr, time: '20:00',
      teamA: teamAName,
      teamB: teamBName,
      isLocked: false, actualA: null, actualB: null
    });
  }
  return matches;
})();

const getBaseCollection = (collectionName) => collection(db, 'artifacts', appId, 'public', 'data', collectionName);
const getBaseDoc = (collectionName, docId) => doc(db, 'artifacts', appId, 'public', 'data', collectionName, docId);

const isMatchStarted = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return false;
  try {
    const matchDate = new Date(`${dateStr}T${timeStr}:00+03:00`);
    if (isNaN(matchDate)) return false;
    return new Date() >= matchDate;
  } catch (e) { return false; }
};

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  
  const [usersData, setUsersData] = useState([]);
  const [dbMatches, setDbMatches] = useState([]); 
  const [predictions, setPredictions] = useState([]);
  const [settings, setSettings] = useState({ actualChampion: null, isRegistrationLocked: false });
  
  const [activeTab, setActiveTab] = useState('matches');
  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeProfileId, setActiveProfileId] = useState(localStorage.getItem('wc2026_profile_id_ar') || null);

  useEffect(() => {
    const timer = setInterval(() => {}, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error:", err);
        setErrorMsg("فشل الاتصال بقاعدة البيانات. يرجى التحديث.");
        setAuthChecking(false);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;

    const unUsers = onSnapshot(getBaseCollection('users'), (snapshot) => {
      const uData = [];
      snapshot.forEach(doc => uData.push({ profileId: doc.id, ...doc.data() }));
      setUsersData(uData);
    });

    const unMatches = onSnapshot(getBaseCollection('matches'), (snapshot) => {
      const mData = [];
      snapshot.forEach(doc => mData.push({ id: doc.id, ...doc.data() }));
      setDbMatches(mData);
    });

    const unPreds = onSnapshot(getBaseCollection('predictions'), (snapshot) => {
      const pData = [];
      snapshot.forEach(doc => pData.push({ id: doc.id, ...doc.data() }));
      setPredictions(pData);
    });

    const unSettings = onSnapshot(getBaseDoc('settings', 'global'), (docSnap) => {
      if (docSnap.exists()) setSettings(docSnap.data());
    });

    return () => { unUsers(); unMatches(); unPreds(); unSettings(); };
  }, [firebaseUser]);

  const matches = useMemo(() => {
    return BASE_MATCHES.map(baseMatch => {
      const dbEdit = dbMatches.find(m => m.id === baseMatch.id);
      return dbEdit ? { ...baseMatch, ...dbEdit } : baseMatch;
    });
  }, [dbMatches]);

  const leaderboardData = useMemo(() => {
    return usersData.map(u => {
      let points = 0; let exact = 0; let outcome = 0;
      const userPreds = predictions.filter(p => p.profileId === u.profileId);

      matches.forEach(match => {
        if (match.actualA !== undefined && match.actualA !== null && match.actualB !== undefined && match.actualB !== null) {
          const p = userPreds.find(pred => pred.matchId === match.id);
          if (p && p.scoreA !== '' && p.scoreB !== '') {
            const pA = parseInt(p.scoreA); const pB = parseInt(p.scoreB);
            const aA = parseInt(match.actualA); const aB = parseInt(match.actualB);

            if (pA === aA && pB === aB) { points += 3; exact += 1; } 
            else if ((pA > pB && aA > aB) || (pA < pB && aA < aB) || (pA === pB && aA === aB)) { points += 1; outcome += 1; }
          }
        }
      });

      if (settings?.actualChampion && u.champion === settings.actualChampion) points += 10;
      return { ...u, points, exact, outcome };
    }).sort((a, b) => b.points - a.points || b.exact - a.exact || b.outcome - a.outcome);
  }, [usersData, matches, predictions, settings]);

  const handleSetProfile = (profileId) => {
    localStorage.setItem('wc2026_profile_id_ar', profileId);
    setActiveProfileId(profileId);
  };

  const handleLogout = () => {
    localStorage.removeItem('wc2026_profile_id_ar');
    setActiveProfileId(null);
  }

  useEffect(() => {
    if (activeProfileId && usersData.length > 0 && !usersData.find(u => u.profileId === activeProfileId)) {
      handleLogout();
    }
  }, [usersData, activeProfileId]);

  if (authChecking) {
    return <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-emerald-400 gap-4"><Trophy className="w-12 h-12 animate-bounce"/><p>جاري تحميل التطبيق...</p></div>;
  }

  if (!firebaseUser && errorMsg) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-red-400 p-6 text-center">{errorMsg}</div>;
  }

  const currentProfile = usersData.find(u => u.profileId === activeProfileId);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-20">
      <header className="bg-slate-800 p-4 shadow-md sticky top-0 z-10 border-b border-slate-700">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 text-emerald-400">
            <Trophy className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-tight">توقعات المونديال 26</h1>
          </div>
          {currentProfile && (
            <div className="text-sm text-slate-400 flex items-center gap-2">
              <UserCircle className="w-5 h-5" />
              <span className="font-medium text-white">{currentProfile.name}</span>
              <button onClick={handleLogout} className="text-xs mr-2 text-slate-500 hover:text-white underline">خروج</button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {!currentProfile ? (
          <AuthForms onLogin={handleSetProfile} existingUsers={usersData} isRegistrationLocked={settings?.isRegistrationLocked} />
        ) : (
          <div className="animate-in fade-in duration-300">
            {activeTab === 'matches' && <MatchesView matches={matches} predictions={predictions} profileId={currentProfile.profileId} />}
            {activeTab === 'leaderboard' && <LeaderboardView leaderboardData={leaderboardData} settings={settings} />}
            {activeTab === 'admin' && <AdminView isAdmin={isAdmin} setIsAdmin={setIsAdmin} matches={matches} settings={settings} passcode={ADMIN_PASSCODE} usersData={usersData} predictions={predictions} />}
          </div>
        )}
      </main>

      {currentProfile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 pb-safe z-20">
          <div className="max-w-4xl mx-auto flex justify-around">
            <NavBtn icon={<CalendarDays className="w-6 h-6" />} label="المباريات" active={activeTab === 'matches'} onClick={() => setActiveTab('matches')} />
            <NavBtn icon={<BarChart3 className="w-6 h-6" />} label="الترتيب" active={activeTab === 'leaderboard'} onClick={() => setActiveTab('leaderboard')} />
            <NavBtn icon={<Settings className="w-6 h-6" />} label="الإدارة" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />
          </div>
        </nav>
      )}
    </div>
  );
}

function NavBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${active ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}>
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

function AuthForms({ onLogin, existingUsers, isRegistrationLocked }) {
  const [mode, setMode] = useState(isRegistrationLocked ? 'login' : 'register');
  const [name, setName] = useState('');
  const [champion, setChampion] = useState('');
  const [pin, setPin] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    if (isRegistrationLocked) return;
    if (!name.trim() || !champion.trim() || pin.length !== 4) {
      setError('يرجى تعبئة جميع الحقول وإدخال رمز PIN من 4 أرقام.'); return;
    }
    if (existingUsers.some(u => u.name.trim() === name.trim())) {
      setError('هذا الاسم مستخدم مسبقاً. أضف اسم العائلة أو انتقل لصفحة الدخول.'); return;
    }

    setLoading(true); setError('');
    const newProfileId = 'user_' + Date.now().toString(); 

    try {
      await setDoc(getBaseDoc('users', newProfileId), { 
        name: name.trim(), champion: champion.trim(), pin: pin, joinedAt: new Date().toISOString() 
      });
      onLogin(newProfileId);
    } catch (err) { 
      console.error(err); setError("حدث خطأ أثناء إنشاء الحساب.");
    }
    setLoading(false);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    if (!selectedProfileId || loginPin.length !== 4) {
       setError('اختر اسمك وأدخل الرمز السري من 4 أرقام.'); return;
    }

    const user = existingUsers.find(u => u.profileId === selectedProfileId);
    if (user && user.pin === loginPin) {
      onLogin(user.profileId);
    } else {
      setError('الرمز السري خاطئ لهذا الحساب.');
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mb-4">
          <Trophy className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">بوابة المسابقة</h2>
      </div>

      <div className="flex bg-slate-900 rounded-lg p-1 mb-6 border border-slate-700">
        <button onClick={() => {setMode('register'); setError('');}} className={`flex-1 py-2 rounded flex justify-center items-center gap-2 text-sm font-bold transition-colors ${mode === 'register' ? 'bg-emerald-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}>
          <UserPlus className="w-4 h-4"/> لاعب جديد
        </button>
        <button onClick={() => {setMode('login'); setError('');}} className={`flex-1 py-2 rounded flex justify-center items-center gap-2 text-sm font-bold transition-colors ${mode === 'login' ? 'bg-emerald-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}>
          <LogIn className="w-4 h-4"/> تسجيل دخول
        </button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

      {mode === 'register' ? (
        isRegistrationLocked ? (
          <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 p-4 rounded-lg text-center text-sm flex flex-col items-center gap-2">
            <ShieldAlert className="w-6 h-6"/>
            التسجيل مغلق حالياً من قبل الإدارة.
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">الاسم الكامل</label>
              <input type="text" required maxLength={30} value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="مثال: حمد خالد" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">توقع البطل (10 نقاط)</label>
              <select required value={champion} onChange={(e) => setChampion(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none appearance-none">
                <option value="" disabled>اختر فريقاً...</option>
                {ALL_48_TEAMS.map(team => <option key={team} value={team}>{team}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">أنشئ رمز PIN (4 أرقام)</label>
              <input type="password" required maxLength={4} pattern="\d{4}" value={pin} onChange={(e) => setPin(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none text-center tracking-widest text-lg" placeholder="1234" />
              <p className="text-xs text-slate-500 mt-1">* تذكر هذا الرمز لتسجيل الدخول لاحقاً من أجهزة أخرى.</p>
            </div>
            <button disabled={loading} type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold rounded-lg px-4 py-3 mt-4 transition">
              {loading ? 'جاري التسجيل...' : 'إنشاء حساب'}
            </button>
          </form>
        )
      ) : (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">اختر اسمك</label>
            <select required value={selectedProfileId} onChange={(e) => setSelectedProfileId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none appearance-none">
              <option value="" disabled>ابحث عن اسمك...</option>
              {existingUsers.map(u => <option key={u.profileId} value={u.profileId}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">أدخل رمز PIN الخاص بك</label>
            <input type="password" required maxLength={4} value={loginPin} onChange={(e) => setLoginPin(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none text-center tracking-widest text-lg" placeholder="••••" />
          </div>
          <button type="submit" className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg px-4 py-3 mt-4 transition">
            دخول اللوحة
          </button>
        </form>
      )}
    </div>
  );
}

function MatchesView({ matches, predictions, profileId }) {
  const matchesByDate = matches.reduce((acc, match) => {
    const d = match.date || "غير محدد";
    if (!acc[d]) acc[d] = [];
    acc[d].push(match);
    return acc;
  }, {});

  const sortedDates = Object.keys(matchesByDate).sort((a, b) => new Date(a) - new Date(b));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <div>
          <h2 className="text-xl font-bold text-white">توقعات المباريات</h2>
          <p className="text-xs text-slate-400">عرض جميع المباريات الـ 104</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs flex items-center gap-1 bg-slate-800 text-emerald-400 px-3 py-1.5 rounded-full border border-slate-700">
            <Clock className="w-3 h-3"/> بتوقيت مكة المكرمة (GMT+3)
          </span>
        </div>
      </div>
      
      {sortedDates.map(date => {
        let displayDate = date;
        try {
          const dObj = new Date(date);
          if (!isNaN(dObj)) {
            displayDate = new Intl.DateTimeFormat('ar-SA', { weekday: 'long', month: 'long', day: 'numeric' }).format(dObj);
          }
        } catch(e) {}

        return (
          <div key={date} className="space-y-3">
            <h3 className="text-sm font-bold text-slate-400 bg-slate-800/50 px-3 py-2 rounded-lg inline-block border border-slate-700/50">
              {displayDate}
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {matchesByDate[date].map(match => {
                const pred = predictions.find(p => p.matchId === match.id && p.profileId === profileId);
                return <MatchCard key={match.id} match={match} userPred={pred} profileId={profileId} />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MatchCard({ match, userPred, profileId }) {
  const [scoreA, setScoreA] = useState(userPred?.scoreA ?? '');
  const [scoreB, setScoreB] = useState(userPred?.scoreB ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setScoreA(userPred?.scoreA ?? '');
    setScoreB(userPred?.scoreB ?? '');
  }, [userPred]);

  const hasChanges = (userPred?.scoreA ?? '') !== scoreA || (userPred?.scoreB ?? '') !== scoreB;

  const handleSave = async () => {
    if (scoreA === '' || scoreB === '') return;
    setSaving(true);
    const predId = `${profileId}_${match.id}`;
    try {
      await setDoc(getBaseDoc('predictions', predId), { 
        profileId, matchId: match.id, scoreA: parseInt(scoreA), scoreB: parseInt(scoreB) 
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const isCompleted = match.actualA !== null && match.actualA !== undefined;
  const isPastKickoff = isMatchStarted(match.date, match.time);
  const isLockedForUser = match.isLocked || isCompleted || isPastKickoff;

  let earnedPoints = null;
  if (isCompleted && userPred && userPred.scoreA !== '' && userPred.scoreB !== '') {
    const pA = parseInt(userPred.scoreA); const pB = parseInt(userPred.scoreB);
    const aA = parseInt(match.actualA); const aB = parseInt(match.actualB);
    if (pA === aA && pB === aB) earnedPoints = 3;
    else if ((pA > pB && aA > aB) || (pA < pB && aA < aB) || (pA === pB && aA === aB)) earnedPoints = 1;
    else earnedPoints = 0;
  }

  return (
    <div className={`bg-slate-800 rounded-xl p-4 shadow-sm border ${isCompleted ? 'border-slate-600/50 opacity-80' : 'border-slate-700'}`}>
      <div className="flex justify-between items-center text-xs text-slate-400 mb-3 font-medium uppercase tracking-wider">
        <span>{match.group} (م{match.order})</span>
        <span>{match.time}</span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 text-center min-w-0">
          <div className="font-bold text-sm sm:text-base text-white mb-2 truncate px-1" title={match.teamA}>{match.teamA}</div>
          <input 
            type="number" min="0" max="20" value={scoreA} onChange={(e) => setScoreA(e.target.value)} disabled={isLockedForUser}
            className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-900 border border-slate-600 rounded-lg text-center text-xl sm:text-2xl font-bold text-white disabled:opacity-50 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
        <div className="px-1 text-slate-500 font-bold mt-8 text-sm shrink-0">ضد</div>
        <div className="flex-1 text-center min-w-0">
          <div className="font-bold text-sm sm:text-base text-white mb-2 truncate px-1" title={match.teamB}>{match.teamB}</div>
          <input 
            type="number" min="0" max="20" value={scoreB} onChange={(e) => setScoreB(e.target.value)} disabled={isLockedForUser}
            className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-900 border border-slate-600 rounded-lg text-center text-xl sm:text-2xl font-bold text-white disabled:opacity-50 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-between items-center h-10">
        {isCompleted ? (
          <div className="w-full flex justify-between items-center">
            <span className="text-sm font-medium text-slate-400">النتيجة: <span className="text-white font-bold">{match.actualA} - {match.actualB}</span></span>
            {earnedPoints !== null && (
              <span className={`text-sm font-bold px-2 py-1 rounded ${earnedPoints === 3 ? 'bg-emerald-500/20 text-emerald-400' : earnedPoints === 1 ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
                +{earnedPoints} نقطة
              </span>
            )}
          </div>
        ) : (
          <div className="w-full flex justify-between items-center">
             {(match.isLocked || isPastKickoff) ? (
               <span className="text-sm text-yellow-500 flex items-center gap-1"><Lock className="w-4 h-4"/> مغلق</span>
             ) : (
               <span className="text-xs text-slate-500">بانتظار البداية</span>
             )}
             
             {!isLockedForUser && (
               <button 
                 onClick={handleSave} disabled={saving || !hasChanges || scoreA === '' || scoreB === ''}
                 className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold transition ${saved ? 'bg-emerald-500/20 text-emerald-400' : hasChanges && scoreA !== '' && scoreB !== '' ? 'bg-emerald-500 text-slate-900 shadow-md shadow-emerald-500/20' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}
               >
                 {saving ? 'جاري...' : saved ? <><Check className="w-4 h-4"/> تم</> : <><Save className="w-4 h-4"/> حفظ</>}
               </button>
             )}
          </div>
        )}
      </div>
    </div>
  );
}

function LeaderboardView({ leaderboardData, settings }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <h2 className="text-xl font-bold text-white">الترتيب المباشر</h2>
        <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
          نقاط: تامة (3) • النتيجة (1) • البطل (10)
        </div>
      </div>

      {settings?.actualChampion && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg mb-4 flex items-center gap-3">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <div>
            <p className="text-sm text-yellow-500/80 font-medium">بطل البطولة</p>
            <p className="text-lg text-yellow-500 font-bold">{settings.actualChampion}</p>
          </div>
        </div>
      )}

      <div className="bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700">
        <div className="grid grid-cols-12 gap-2 p-3 border-b border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-800/50">
          <div className="col-span-2 text-center">المركز</div>
          <div className="col-span-5">اللاعب</div>
          <div className="col-span-3 text-center" title="نتيجة تامة / فائز صحيح">تام/فائز</div>
          <div className="col-span-2 text-center">نقاط</div>
        </div>
        
        <div className="divide-y divide-slate-700/50">
          {leaderboardData.length === 0 ? (
            <div className="p-8 text-center text-slate-500">لا يوجد مشاركين بعد.</div>
          ) : (
            leaderboardData.map((user, index) => {
              const rank = index + 1;
              let styleStr = "bg-slate-800";
              let rankStyle = "text-slate-400 font-bold";
              
              if (rank === 1) { styleStr = "bg-yellow-500/10"; rankStyle = "text-yellow-400 font-black text-lg"; }
              else if (rank === 2) { styleStr = "bg-slate-300/10"; rankStyle = "text-slate-300 font-black text-lg"; }
              else if (rank === 3) { styleStr = "bg-amber-700/10"; rankStyle = "text-amber-500 font-black text-lg"; }

              return (
                <div key={user.profileId} className={`grid grid-cols-12 gap-2 p-3 items-center transition ${styleStr}`}>
                  <div className={`col-span-2 text-center ${rankStyle}`}>{rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}</div>
                  <div className="col-span-5 min-w-0">
                    <div className="font-bold text-white truncate text-sm" title={user.name}>{user.name}</div>
                    <div className="text-xs text-slate-400 truncate">🏆 {user.champion}</div>
                  </div>
                  <div className="col-span-3 text-center flex flex-col items-center justify-center">
                    <span className="text-xs font-medium text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                      <span className="text-emerald-400">{user.exact}</span> / <span className="text-blue-400">{user.outcome}</span>
                    </span>
                  </div>
                  <div className="col-span-2 text-center font-black text-emerald-400 text-lg">{user.points}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function AdminView({ isAdmin, setIsAdmin, matches, settings, passcode, usersData, predictions }) {
  const [inputCode, setInputCode] = useState('');
  const [actualChamp, setActualChamp] = useState(settings?.actualChampion || '');
  const [editingMatchId, setEditingMatchId] = useState(null);
  const [editForm, setEditForm] = useState({ teamA: '', teamB: '', date: '', time: '', group: '' });

  const handleLogin = (e) => {
    e.preventDefault();
    if (inputCode === passcode) setIsAdmin(true);
    else alert("الرمز السري غير صحيح");
  };

  const updateMatchSafely = async (matchId, updates) => {
    try {
      await setDoc(getBaseDoc('matches', matchId), updates, { merge: true });
    } catch (err) {
      console.error(err); alert("فشل في حفظ التعديلات.");
    }
  };

  const handleSetScores = (matchId, sA, sB) => {
    updateMatchSafely(matchId, { actualA: sA === '' ? null : parseInt(sA), actualB: sB === '' ? null : parseInt(sB), isLocked: true });
  };

  const handleSetChampion = async () => {
    try { await setDoc(getBaseDoc('settings', 'global'), { actualChampion: actualChamp || null }, { merge: true }); }
    catch (err) { console.error(err); }
  };

  const handleToggleLock = (matchId, currentLock) => updateMatchSafely(matchId, { isLocked: !currentLock });

  const toggleRegistration = async () => {
    try {
      await setDoc(getBaseDoc('settings', 'global'), { isRegistrationLocked: !settings?.isRegistrationLocked }, { merge: true });
    } catch (err) { console.error(err); }
  };

  const handleDeleteUser = async (profileId) => {
    if (window.confirm("هل أنت متأكد من حذف هذا اللاعب وجميع توقعاته نهائياً؟")) {
      try {
        await deleteDoc(getBaseDoc('users', profileId));
        const userPreds = predictions.filter(p => p.profileId === profileId);
        const batch = writeBatch(db);
        userPreds.forEach(p => { batch.delete(getBaseDoc('predictions', p.id)); });
        await batch.commit();
      } catch (err) { console.error(err); alert("حدث خطأ أثناء الحذف."); }
    }
  };

  const openEditForm = (match) => {
    setEditingMatchId(match.id);
    setEditForm({ teamA: match.teamA, teamB: match.teamB, date: match.date, time: match.time, group: match.group });
  };

  const saveEditForm = async () => {
    await updateMatchSafely(editingMatchId, { ...editForm });
    setEditingMatchId(null);
  };

  if (!isAdmin) {
    return (
      <div className="max-w-sm mx-auto mt-10 bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700 text-center">
        <Lock className="w-12 h-12 text-slate-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">لوحة التحكم</h2>
        <p className="text-sm text-slate-400 mb-6">أدخل رمز المرور لإدارة النتائج والفرق.</p>
        <form onSubmit={handleLogin}>
          <input type="password" value={inputCode} onChange={e => setInputCode(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-center text-xl tracking-widest text-white focus:ring-2 focus:ring-emerald-500 outline-none mb-4" placeholder="••••" />
          <button type="submit" className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg px-4 py-3 transition">دخول للوحة</button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-20">
      <div className="flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700">
        <h2 className="text-lg font-bold text-white flex items-center gap-2"><Settings className="w-5 h-5 text-emerald-400"/> الإدارة</h2>
        <button onClick={() => setIsAdmin(false)} className="text-sm text-slate-400 hover:text-white bg-slate-900 px-3 py-1.5 rounded">خروج</button>
      </div>

      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md flex justify-between items-center">
        <div>
          <h3 className="font-bold text-white text-sm">حالة التسجيل</h3>
          <p className="text-xs text-slate-400 mt-1">التحكم في قبول لاعبين جدد.</p>
        </div>
        <button 
          onClick={toggleRegistration}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${settings?.isRegistrationLocked ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}
        >
          {settings?.isRegistrationLocked ? 'مغلق (افتح)' : 'مفتوح (أغلق)'}
        </button>
      </div>

      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md">
        <h3 className="font-bold text-white mb-3 text-sm">إدارة اللاعبين</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto pl-2">
          {usersData.map(u => (
            <div key={u.profileId} className="flex justify-between items-center bg-slate-900 p-2 rounded border border-slate-700">
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">{u.name}</div>
                <div className="text-xs text-slate-400">PIN: {u.pin}</div>
              </div>
              <button onClick={() => handleDeleteUser(u.profileId)} className="text-slate-500 hover:text-red-400 p-2 transition-colors" title="حذف اللاعب وتوقعاته">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {usersData.length === 0 && <div className="text-xs text-slate-500">لا يوجد لاعبين حتى الآن.</div>}
        </div>
      </div>

      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md">
        <h3 className="font-bold text-white mb-3 text-sm">تحديد بطل البطولة</h3>
        <div className="flex gap-2">
          <select value={actualChamp} onChange={(e) => setActualChamp(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none">
            <option value="">لم يحدد بعد</option>
            {ALL_48_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={handleSetChampion} className="bg-emerald-500 text-slate-900 px-4 py-2 rounded-lg font-bold text-sm hover:bg-emerald-400">حفظ</button>
        </div>
      </div>

      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md space-y-4">
        <div className="mb-2 border-b border-slate-700 pb-2">
          <h3 className="font-bold text-white text-sm">إدارة جميع المباريات (104 مباراة)</h3>
          <p className="text-xs text-slate-400 mt-1">قم بتحديث أسماء الفرق (خصوصاً للأدوار الإقصائية) أو إدخال النتائج النهائية.</p>
        </div>
        
        <div className="space-y-3 max-h-[600px] overflow-y-auto pl-2">
          {matches.map(match => (
            <div key={match.id} className="bg-slate-900 p-3 rounded-lg border border-slate-700 flex flex-col gap-3">
              
              <div className="flex justify-between items-start">
                <div className="min-w-0 pl-2">
                  <div className="text-xs text-slate-400 font-mono mb-1">{match.date} • {match.time} • {match.group} (م{match.order})</div>
                  <div className="text-sm font-bold text-white truncate" title={`${match.teamA} ضد ${match.teamB}`}>{match.teamA} <span className="text-slate-500">ضد</span> {match.teamB}</div>
                </div>
                <button onClick={() => openEditForm(match)} className="shrink-0 text-slate-400 hover:text-emerald-400 p-1 bg-slate-800 rounded transition-colors" title="تعديل الفرق والوقت">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {editingMatchId === match.id && (
                <div className="bg-slate-800 p-3 rounded border border-emerald-500/30 mt-2">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div><label className="text-xs text-slate-400">الفريق الأول</label><input type="text" value={editForm.teamA} onChange={e => setEditForm({...editForm, teamA: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm" /></div>
                    <div><label className="text-xs text-slate-400">الفريق الثاني</label><input type="text" value={editForm.teamB} onChange={e => setEditForm({...editForm, teamB: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm" /></div>
                    <div><label className="text-xs text-slate-400">التاريخ</label><input type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm" /></div>
                    <div><label className="text-xs text-slate-400">الوقت</label><input type="time" value={editForm.time} onChange={e => setEditForm({...editForm, time: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm" /></div>
                    <div className="col-span-2"><label className="text-xs text-slate-400">المجموعة / الدور</label><input type="text" value={editForm.group} onChange={e => setEditForm({...editForm, group: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm" /></div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingMatchId(null)} className="px-3 py-1.5 text-xs text-slate-400 bg-slate-900 rounded hover:text-white">إلغاء</button>
                    <button onClick={saveEditForm} className="px-3 py-1.5 text-xs font-bold text-slate-900 bg-emerald-500 rounded hover:bg-emerald-400">حفظ</button>
                  </div>
                </div>
              )}
              
              {!editingMatchId && (
                <div className="flex items-center justify-between border-t border-slate-800 pt-2 mt-1">
                  <div className="flex items-center gap-2">
                    <input type="number" placeholder="أ" value={match.actualA ?? ''} onChange={(e) => handleSetScores(match.id, e.target.value, match.actualB)} className="w-12 h-9 bg-slate-800 border border-slate-600 rounded text-center font-bold text-white text-sm focus:ring-1 focus:ring-emerald-500" />
                    <span className="text-slate-500">-</span>
                    <input type="number" placeholder="ب" value={match.actualB ?? ''} onChange={(e) => handleSetScores(match.id, match.actualA, e.target.value)} className="w-12 h-9 bg-slate-800 border border-slate-600 rounded text-center font-bold text-white text-sm focus:ring-1 focus:ring-emerald-500" />
                  </div>

                  <button onClick={() => handleToggleLock(match.id, match.isLocked)} className={`text-xs px-2 py-1.5 rounded w-16 font-medium transition-colors ${match.isLocked ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800 text-slate-400 border border-slate-600'}`}>
                    {match.isLocked ? 'مغلق' : 'مفتوح'}
                  </button>
                </div>
              )}

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
