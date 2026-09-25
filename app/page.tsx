'use client'

import { cn } from "@/lib/utils";
import { Clock, Flame, Crown, Plus, CheckCircle2, Circle, Trophy, Play, Loader2 } from "lucide-react";
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
  const router = useRouter();

  useEffect(() => {
    // Check local storage for simple auth
    const savedUser = localStorage.getItem('coop_username');
    if (!savedUser) {
      router.push('/login');
      return;
    }
    
    setCurrentUser(savedUser);

    const profilesRef = collection(db, 'profiles');
    
    // Listen to my profile
    const qMyProfile = query(profilesRef, where('__name__', '==', savedUser));
    const unsubMyProfile = onSnapshot(qMyProfile, (snap) => {
      if (!snap.empty) setMyProfile(snap.docs[0].data());
    });

    // Listen to friend's profile (first user that isn't me)
    const qFriendProfile = query(profilesRef, where('__name__', '!=', savedUser), limit(1));
    const unsubFriendProfile = onSnapshot(qFriendProfile, (snap) => {
      if (!snap.empty) {
        setFriendProfile({ id: snap.docs[0].id, ...snap.docs[0].data() });
      }
    });

    // Listen to my goals
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

  // Listen to friend's goals once friendProfile is loaded
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

  const handleSignOut = () => {
    localStorage.removeItem('coop_username');
    router.push('/login');
  };

  const handleAddDemoGoal = () => {
    if (!currentUser) return;
    
    addDoc(collection(db, 'goals'), {
      user_id: currentUser,
      title: 'Focused Task ' + Math.floor(Math.random() * 1000),
      priority: ['P1', 'P2', 'P3'][Math.floor(Math.random() * 3)],
      is_completed: false,
      created_at: new Date().toISOString()
    }).catch(err => {
      console.warn("Error adding goal. Did you enable Firestore?", err)
    });
  };

  const toggleGoal = (id: string, currentStatus: boolean) => {
    updateDoc(doc(db, 'goals', id), {
      is_completed: !currentStatus
    }).catch(err => console.warn(err));
  };

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
    </div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-zinc-100 overflow-hidden font-sans">
      <header className="h-16 border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-50">
        <UserScore 
          user={myProfile?.username?.[0]?.toUpperCase() || currentUser?.[0]?.toUpperCase() || "A"} 
          name={myProfile?.username || currentUser || "Me"} 
          time="Local" 
          points={0} 
          streak={0} 
        />
        
        <div className="flex flex-col items-center justify-center">
          <span className="text-xs font-mono text-zinc-500 tracking-widest uppercase">Live Match</span>
          <div className="text-xl font-black italic tracking-tighter text-zinc-700">VS</div>
        </div>
        
        <UserScore 
          user={friendProfile?.username?.[0]?.toUpperCase() || "?"} 
          name={friendProfile?.username || "Waiting for Friend"} 
          time="Remote" 
          points={0} 
          streak={0} 
          align="right" 
        />
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-zinc-900 overflow-hidden">
        
        <section className="flex flex-col h-full bg-black relative">
          <div className="p-6 border-b border-zinc-900 bg-zinc-950/20">
            <h2 className="text-xs font-mono text-emerald-500 mb-2 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active Timebox
            </h2>
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-2xl font-semibold mb-1">Deep Work Phase</h3>
                <p className="text-zinc-500 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Ready to start
                </p>
              </div>
              <div className="text-4xl font-mono font-light text-zinc-500">
                00:00:00
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Play className="w-4 h-4" /> Start Block
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-mono text-zinc-500 uppercase tracking-wider">My Goals & Blocks</h3>
              <button onClick={handleAddDemoGoal} className="text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add Test Goal
              </button>
            </div>
            
            {myGoals.length > 0 ? myGoals.map(goal => (
              <ScheduleItem 
                key={goal.id}
                title={goal.title} 
                status={goal.is_completed ? "completed" : "planned"} 
                points={goal.priority}
                onClick={() => toggleGoal(goal.id, goal.is_completed)}
              />
            )) : (
              <p className="text-zinc-600 text-sm">No goals tracked yet. Click "Add Test Goal"!</p>
            )}
          </div>
        </section>

        <section className="flex flex-col h-full bg-[#050505] relative">
          <div className="p-6 border-b border-zinc-900">
            <h2 className="text-xs font-mono text-zinc-500 mb-2 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-zinc-700" />
              {friendProfile?.username || "Friend"}'s Live Status
            </h2>
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-xl font-semibold mb-1 text-zinc-300">Offline / Resting</h3>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 opacity-70">
            <h3 className="text-sm font-mono text-zinc-600 uppercase tracking-wider mb-4">Friend's Completed Work</h3>
            
            {friendGoals.length > 0 ? friendGoals.map(goal => (
              <ScheduleItem 
                key={goal.id}
                title={goal.title} 
                status={goal.is_completed ? "completed" : "planned"}
                points={goal.priority}
              />
            )) : (
              <p className="text-zinc-700 text-sm">Your friend hasn't added any goals yet.</p>
            )}
          </div>
        </section>

      </main>

      <button onClick={handleSignOut} className="absolute bottom-4 right-4 z-50 text-xs font-mono text-zinc-600 hover:text-zinc-300 transition-colors">
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

function ScheduleItem({ title, status, points, onClick }: { title: string, status: "completed" | "active" | "planned" | "failed", points?: string, onClick?: () => void }) {
  const isCompleted = status === "completed";
  const isActive = status === "active";
  
  return (
    <div 
      onClick={onClick}
      className={cn(
        "group flex items-center gap-4 p-4 rounded-xl border transition-all",
        onClick && "cursor-pointer",
        isActive ? "bg-emerald-500/5 border-emerald-500/20 glow-emerald" : "bg-zinc-950/50 border-zinc-900/50 hover:border-zinc-800"
      )}
    >
      <div className="flex-shrink-0">
        {isCompleted ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : 
         isActive ? <Play className="w-5 h-5 text-emerald-500 fill-emerald-500" /> :
         <Circle className="w-5 h-5 text-zinc-700 group-hover:text-zinc-500" />}
      </div>
      <div className="flex-1">
        <h4 className={cn("text-sm font-medium", isCompleted ? "text-zinc-500 line-through" : isActive ? "text-emerald-50" : "text-zinc-300")}>{title}</h4>
      </div>
      {points && (
        <div className={cn("text-xs font-mono px-2 py-1 rounded bg-zinc-900 border border-zinc-800", 
          isCompleted ? "text-emerald-500/70" : 
          points === "P1" ? "text-red-400" :
          points === "P2" ? "text-amber-400" : "text-blue-400"
        )}>
          {points}
        </div>
      )}
    </div>
  );
}
