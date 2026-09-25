'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase/config'
import { doc, setDoc } from 'firebase/firestore'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const router = useRouter()

  useEffect(() => {
    // If they already have a username saved, auto-login
    if (typeof window !== 'undefined' && localStorage.getItem('coop_username')) {
      router.push('/')
    }
  }, [router])

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!username.trim()) return

    const normalizedUsername = username.trim().toLowerCase()
    
    // Save to local storage (Simple Auth)
    localStorage.setItem('coop_username', normalizedUsername)

    // Save profile to Firestore (fire and forget)
    try {
      setDoc(doc(db, 'profiles', normalizedUsername), {
        username: normalizedUsername,
        created_at: new Date().toISOString()
      }, { merge: true }).catch(err => {
        console.warn("Could not save to firestore, maybe rules aren't set yet?", err)
      })
    } catch (err) {
      console.warn("Firestore sync failed synchronously", err)
    }

    router.push('/')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleLogin()
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-black text-zinc-100 font-sans items-center justify-center">
      <div className="w-full px-8 sm:max-w-md mx-auto">
        <form className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground" onSubmit={handleLogin}>
          <h1 className="text-3xl font-bold mb-8 font-mono uppercase text-emerald-500 tracking-widest text-center">Co-op Focus</h1>
          
          <label className="text-sm font-mono text-zinc-400 uppercase tracking-wider" htmlFor="username">
            Your Name
          </label>
          <input
            className="rounded-md px-4 py-3 border border-zinc-800 mb-8 bg-zinc-950/50 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all text-white placeholder:text-zinc-600"
            name="username"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Alex"
            required
            autoFocus
          />
          
          <button
            type="submit"
            className="bg-emerald-500 text-black font-semibold rounded-md px-4 py-3 mb-3 hover:bg-emerald-400 transition-colors uppercase tracking-wider text-sm"
          >
            Enter Workspace
          </button>
        </form>
      </div>
    </div>
  )
}
