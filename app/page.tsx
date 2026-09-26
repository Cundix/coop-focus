'use client'

import { cn } from "@/lib/utils";
import { Clock, Flame, Crown, Plus, CheckCircle2, Circle, Trophy, Play, Loader2, EyeOff, Eye, SquareTerminal } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase/config";
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, limit } from "firebase/firestore";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [friendProfile, setFriendProfile] = useState<any>(null);
  const [myGoals, setMyGoals] = useState<any[]>([]);
  const [friendGoals, setFriendGoals] = useState<any[]>([]);
  
  // New States
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDuration, setNewGoalDuration] = useState("60");
  const [newGoalDesc, setNewGoalDesc] = useState("");
  const [newGoalParentId, setNewGoalParentId] = useState("");
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly">("daily");
  const [showFriend, setShowFriend] = useState(true);
  
  const [activeGoal, setActiveGoal] = useState<any>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60 * 60);

  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('coop_username');
    if (!savedUser) {
      router.push('/login');
      return;
    }
    
    setCurrentUser(savedUser);

    const profilesRef = collection(db, 'profiles');
    
    const qMyProfile = query(profilesRef, where('__name__', '==', savedUser));
    const unsubMyProfile = onSnapshot(qMyProfile, (snap) => {
      if (!snap.empty) setMyProfile(snap.docs[0].data());
    });

    const qFriendProfile = query(profilesRef, where('__name__', '!=', savedUser), limit(1));
    const unsubFriendProfile = onSnapshot(qFriendProfile, (snap) => {
      if (!snap.empty) {
        setFriendProfile({ id: snap.docs[0].id, ...snap.docs[0].data() });
      }
    });

    const goalsRef = collection(db, 'goals');
    const qMyGoals = query(goalsRef, where('user_id', '==', savedUser));
    const unsubMyGoals = onSnapshot(qMyGoals, (snap) => {
      setMyGoals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    setLoading(false);

    return () => {
      unsubMyProfile();
      unsubFriendProfile();
      unsubMyGoals();
    }
  }, [router]);

  useEffect(() => {
    if (friendProfile?.id) {
      const goalsRef = collection(db, 'goals');
      const qFriendGoals = query(goalsRef, where('user_id', '==', friendProfile.id));
      const unsubFriendGoals = onSnapshot(qFriendGoals, (snap) => {
        setFriendGoals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsubFriendGoals();
    }
  }, [friendProfile?.id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      if (activeGoal) {
        toggleGoal(activeGoal.id, false); // automatically mark complete!
      }
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, activeGoal]);

  // Reset parent selection when changing tabs
  useEffect(() => {
    setNewGoalParentId("");
  }, [activeTab]);

  const toggleTimer = () => {
    if (timeLeft === 0) setTimeLeft((activeGoal?.duration_minutes || 60) * 60);
    setTimerActive(!timerActive);
  };

  const startGoalTimer = (goal: any) => {
    if (goal.tier !== 'daily') return;
    setActiveGoal(goal);
    setTimeLeft((goal.duration_minutes || 60) * 60);
    setTimerActive(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSignOut = () => {
    localStorage.removeItem('coop_username');
    router.push('/login');
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newGoalTitle.trim()) return;
    if ((activeTab === 'weekly' || activeTab === 'daily') && !newGoalParentId) return;
    
    const payload: any = {
      user_id: currentUser,
      title: newGoalTitle.trim(),
      tier: activeTab,
      priority: 'P2',
      is_completed: false,
      created_at: new Date().toISOString()
    };

    if (activeTab === 'daily') {
      let duration = parseInt(newGoalDuration) || 60;
      if (duration < 20) duration = 20;
      if (duration > 180) duration = 180;
      payload.duration_minutes = duration;
      payload.parent_id = newGoalParentId;
    } else if (activeTab === 'weekly') {
      payload.description = newGoalDesc.trim();
      payload.parent_id = newGoalParentId;
    } else if (activeTab === 'monthly') {
      payload.description = newGoalDesc.trim();
    }

    addDoc(collection(db, 'goals'), payload).catch(err => {
      console.warn("Error adding goal.", err)
    });
    
    setNewGoalTitle("");
    setNewGoalDesc("");
    setNewGoalParentId("");
  };

  const toggleGoal = (id: string, currentStatus: boolean) => {
    updateDoc(doc(db, 'goals', id), {
      is_completed: !currentStatus
    }).catch(err => console.warn(err));

    // If we are marking the currently active timer goal as completed, stop the timer
    if (!currentStatus && activeGoal?.id === id) {
      setTimerActive(false);
      setActiveGoal(null);
      setTimeLeft(60 * 60);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
    </div>;
  }

  const filteredMyGoals = myGoals.filter(g => (g.tier || 'daily') === activeTab);
  const filteredFriendGoals = friendGoals.filter(g => (g.tier || 'daily') === activeTab);

  const availableParents = activeTab === 'weekly' 
    ? myGoals.filter(g => (g.tier || 'daily') === 'monthly')
    : activeTab === 'daily' 
    ? myGoals.filter(g => (g.tier || 'daily') === 'weekly')
    : [];

  const calculatePoints = (goals: any[]) => goals.filter(g => g.is_completed).reduce((acc, g) => {
    if (g.priority === 'P1') return acc + 30;
    if (g.priority === 'P2') return acc + 20;
    if (g.priority === 'P3') return acc + 10;
    return acc + 20;
  }, 0);

  const myPoints = calculatePoints(myGoals);
  const friendPoints = calculatePoints(friendGoals);

  const friendCompletedCount = friendGoals.filter(g => g.is_completed && (g.tier || 'daily') === 'daily').length;
  const friendStatusText = friendCompletedCount > 0 ? `Crushed ${friendCompletedCount} daily goals` : "Offline / Resting";

  const isFormValid = newGoalTitle.trim() && (activeTab === 'monthly' || newGoalParentId);

  return (
    <div className="flex flex-col min-h-screen bg-black text-zinc-100 overflow-hidden font-sans">
      <header className="h-16 border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-50">
        <UserScore 
          user={myProfile?.username?.[0]?.toUpperCase() || currentUser?.[0]?.toUpperCase() || "A"} 
          name={myProfile?.username || currentUser || "Me"} 
          time="Local" 
          points={myPoints} 
          streak={0} 
        />
        
        <div className="flex flex-col items-center justify-center">
          <span className="text-xs font-mono text-zinc-500 tracking-widest uppercase">
            {showFriend ? "Live Match" : "Solo Focus"}
          </span>
          {showFriend ? (
            <div className="text-xl font-black italic tracking-tighter text-zinc-700">VS</div>
          ) : (
            <button onClick={() => setShowFriend(true)} className="mt-1 text-[10px] text-emerald-500 hover:text-emerald-400 flex items-center gap-1 uppercase tracking-widest">
              <Eye className="w-3 h-3" /> Show Friend
            </button>
          )}
        </div>
        
        {showFriend ? (
          <UserScore 
            user={friendProfile?.username?.[0]?.toUpperCase() || "?"} 
            name={friendProfile?.username || "Waiting for Friend"} 
            time="Remote" 
            points={friendPoints} 
            streak={0} 
            align="right" 
          />
        ) : (
          <div className="w-[120px]" /> /* Spacer to keep center alignment */
        )}
      </header>

      <main className={cn("flex-1 grid divide-y lg:divide-y-0 lg:divide-x divide-zinc-900 overflow-hidden", showFriend ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 max-w-4xl mx-auto w-full border-x border-zinc-900")}>
        
        <section className="flex flex-col h-full bg-black relative">
          <div className="p-6 border-b border-zinc-900 bg-zinc-950/20">
            <h2 className="text-xs font-mono text-emerald-500 mb-2 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active Timebox
            </h2>
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-2xl font-semibold mb-1">{activeGoal ? activeGoal.title : "Deep Work Phase"}</h3>
                <p className="text-zinc-500 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" /> {timerActive ? "In progress..." : "Ready to start"}
                </p>
              </div>
              <div className="text-4xl font-mono font-light text-zinc-500">
                {formatTime(timeLeft)}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={toggleTimer}
                disabled={!activeGoal}
                className={cn("flex-1 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 border", 
                  !activeGoal
                    ? "bg-zinc-900/50 text-zinc-600 border-zinc-800/50 cursor-not-allowed"
                    : timerActive 
                    ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border-amber-500/20" 
                    : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/20"
                )}
              >
                {!activeGoal ? <><Clock className="w-4 h-4" /> Select a daily objective to begin</> : timerActive ? <><Clock className="w-4 h-4" /> Pause Block</> : <><Play className="w-4 h-4" /> Start Block</>}
              </button>
              {(!timerActive && timeLeft < (activeGoal?.duration_minutes || 60) * 60) && (
                <button 
                  onClick={() => setTimeLeft((activeGoal?.duration_minutes || 60) * 60)}
                  className="px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 rounded-md text-sm font-medium transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-6 pb-2 border-b border-zinc-900 flex gap-6">
              {(['daily', 'weekly', 'monthly'] as const).map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)}
                  className={cn("text-xs font-mono uppercase tracking-wider pb-3 border-b-2 transition-colors relative top-[1px]", 
                    activeTab === tab ? "border-emerald-500 text-emerald-500" : "border-transparent text-zinc-600 hover:text-zinc-400")}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <form onSubmit={handleAddGoal} className="flex flex-col gap-3 mb-6 bg-zinc-950/30 p-4 rounded-xl border border-zinc-900">
                <input 
                  type="text" 
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder={`New ${activeTab} objective title...`}
                  className="w-full bg-zinc-950/50 border border-zinc-900 rounded-md px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-700 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                />

                {activeTab !== 'daily' && (
                  <textarea 
                    value={newGoalDesc}
                    onChange={(e) => setNewGoalDesc(e.target.value)}
                    placeholder="Detailed description..."
                    className="w-full bg-zinc-950/50 border border-zinc-900 rounded-md px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-700 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all min-h-[80px] resize-none"
                  />
                )}

                {activeTab !== 'monthly' && (
                  <CustomSelect
                    value={newGoalParentId}
                    onChange={setNewGoalParentId}
                    options={availableParents}
                    placeholder={`Link to a ${activeTab === 'daily' ? 'weekly' : 'monthly'} objective (Required)`}
                  />
                )}

                <div className="flex justify-between items-center mt-1">
                  {activeTab === 'daily' ? (
                    <div className="relative w-28">
                      <input 
                        type="number" 
                        value={newGoalDuration}
                        onChange={(e) => setNewGoalDuration(e.target.value)}
                        placeholder="60"
                        min="20"
                        max="180"
                        className="w-full bg-zinc-950/50 border border-zinc-900 rounded-md px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-700 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none m-0"
                      />
                      <span className="absolute right-3 top-2.5 text-sm text-zinc-500 pointer-events-none">mins</span>
                    </div>
                  ) : <div />}

                  <button type="submit" disabled={!isFormValid} className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 disabled:bg-zinc-900 disabled:text-zinc-600 disabled:border-zinc-800 disabled:cursor-not-allowed border border-emerald-500/20 px-6 py-2.5 rounded-md flex items-center justify-center transition-colors text-sm font-medium gap-2">
                    <Plus className="w-4 h-4" /> Add {activeTab}
                  </button>
                </div>
              </form>

              {filteredMyGoals.length > 0 ? filteredMyGoals.map(goal => (
                <ScheduleItem 
                  key={goal.id}
                  goal={goal}
                  allGoals={myGoals}
                  onStart={() => startGoalTimer(goal)}
                  onToggle={() => toggleGoal(goal.id, goal.is_completed)}
                />
              )) : (
                <p className="text-zinc-700 text-sm text-center mt-10">No {activeTab} objectives set yet.</p>
              )}
            </div>
          </div>
        </section>

        {showFriend && (
          <section className="flex flex-col h-full bg-[#050505] relative">
            <div className="p-6 border-b border-zinc-900">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-zinc-700" />
                  {friendProfile?.username || "Friend"}'s Live Status
                </h2>
                <button onClick={() => setShowFriend(false)} className="text-zinc-600 hover:text-zinc-400 p-1" title="Hide Friend">
                  <EyeOff className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <h3 className={cn("text-xl font-semibold mb-1", friendCompletedCount > 0 ? "text-emerald-500" : "text-zinc-300")}>{friendStatusText}</h3>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
              <div className="px-6 pt-6 pb-2 border-b border-zinc-900 flex gap-6">
                <div className="text-xs font-mono uppercase tracking-wider pb-3 border-b-2 border-transparent text-zinc-500">
                  {activeTab} Goals
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {filteredFriendGoals.length > 0 ? filteredFriendGoals.map(goal => (
                  <ScheduleItem 
                    key={goal.id}
                    goal={goal}
                    allGoals={friendGoals}
                    isFriend
                  />
                )) : (
                  <p className="text-zinc-800 text-sm text-center mt-10">Your friend hasn't added any {activeTab} objectives.</p>
                )}
              </div>
            </div>
          </section>
        )}

      </main>

      <button onClick={handleSignOut} className="absolute bottom-4 right-4 z-50 text-xs font-mono text-zinc-700 hover:text-zinc-400 transition-colors">
        Log Out
      </button>
    </div>
  );
}

// Components
function UserScore({ user, name, time, points, streak, crown = false, align = "left" }: { user: string, name: string, time: string, points: number, streak: number, crown?: boolean, align?: "left" | "right" }) {
  const isRight = align === "right";
  return (
    <div className={cn("flex items-center gap-4", isRight && "flex-row-reverse")}>
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-lg font-bold">
          {user}
        </div>
        {crown && (
          <div className="absolute -top-3 -right-2 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]">
            <Trophy className="w-5 h-5 fill-yellow-500" />
          </div>
        )}
      </div>
      <div className={cn("flex flex-col", isRight && "items-end")}>
        <div className="flex items-center gap-2">
          <span className="font-medium">{name}</span>
          <span className="text-xs font-mono text-zinc-500">{time}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-sm font-mono text-zinc-300">{points} <span className="text-zinc-500">pts</span></span>
          <span className="text-xs text-orange-500 flex items-center font-mono">
            <Flame className="w-3 h-3 mr-0.5" /> {streak}
          </span>
        </div>
      </div>
    </div>
  );
}

function ScheduleItem({ goal, allGoals, isFriend, onStart, onToggle }: { goal: any, allGoals: any[], isFriend?: boolean, onStart?: () => void, onToggle?: () => void }) {
  const isCompleted = goal.is_completed;
  const parentGoal = goal.parent_id ? allGoals.find(g => g.id === goal.parent_id) : null;
  const isDaily = (goal.tier || 'daily') === 'daily';
  
  return (
    <div 
      onClick={onToggle}
      className={cn(
        "group flex items-start gap-4 p-4 rounded-xl border transition-all",
        onToggle && "cursor-pointer",
        "bg-zinc-950/50 border-zinc-900/50 hover:border-zinc-800"
      )}
    >
      <div className="flex-shrink-0 mt-0.5">
        {isCompleted ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-zinc-700 group-hover:text-zinc-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={cn("text-sm font-medium", isCompleted ? "text-zinc-500 line-through" : "text-zinc-300")}>{goal.title}</h4>
        
        {goal.description && (
          <p className={cn("text-xs mt-1.5 line-clamp-2", isCompleted ? "text-zinc-600 line-through" : "text-zinc-500")}>
            {goal.description}
          </p>
        )}
        
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {parentGoal && (
            <span className={cn("text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest truncate max-w-[150px] border", 
              isCompleted ? "text-zinc-600 border-zinc-800 bg-zinc-900/50" : "text-emerald-500/70 border-emerald-500/20 bg-emerald-500/5"
            )}>
              ↳ {parentGoal.title}
            </span>
          )}
          {goal.duration_minutes && !isCompleted && isDaily && (
            <span className="text-xs text-zinc-600 flex items-center gap-1"><Clock className="w-3 h-3" /> {goal.duration_minutes}m</span>
          )}
        </div>
      </div>
      
      {!isFriend && !isCompleted && onStart && isDaily && (
        <button 
          onClick={(e) => { e.stopPropagation(); onStart(); }}
          className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 text-xs font-medium rounded hover:bg-emerald-500/20 flex items-center gap-1 transition-all flex-shrink-0"
        >
          <Play className="w-3 h-3" /> Start
        </button>
      )}

      {goal.priority && (
        <div className={cn("text-xs font-mono px-2 py-1 rounded border flex-shrink-0", 
          isCompleted ? "bg-zinc-900 border-zinc-800 text-emerald-500/40" : 
          goal.priority === "P1" ? "bg-zinc-900 border-zinc-800 text-red-400" :
          goal.priority === "P2" ? "bg-zinc-900 border-zinc-800 text-amber-400" : "bg-zinc-900 border-zinc-800 text-blue-400"
        )}>
          {goal.priority}
        </div>
      )}
    </div>
  );
}

function CustomSelect({ value, onChange, options, placeholder }: { value: string, onChange: (val: string) => void, options: { id: string, title: string }[], placeholder: string }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn("w-full bg-zinc-950/50 border border-zinc-900 rounded-md px-4 py-2.5 text-sm outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all text-left flex justify-between items-center", value ? "text-zinc-100" : "text-zinc-700")}
      >
        <span className="truncate">{selected ? selected.title : placeholder}</span>
        <svg className={cn("w-4 h-4 transition-transform", open ? "rotate-180 text-emerald-500" : "text-zinc-500")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-2 w-full bg-[#0a0a0a] border border-zinc-800 rounded-md shadow-2xl z-50 py-1.5 max-h-60 overflow-auto">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-sm text-zinc-500 italic">No objectives available to link.</div>
            ) : (
              options.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => { onChange(opt.id); setOpen(false); }}
                  className={cn("w-full text-left px-4 py-2 text-sm hover:bg-zinc-800/80 transition-colors flex items-center justify-between", value === opt.id ? "text-emerald-500 bg-zinc-900/50 font-medium" : "text-zinc-300")}
                >
                  <span className="truncate">{opt.title}</span>
                  {value === opt.id && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
