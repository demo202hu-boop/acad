'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ── Key used in localStorage ───────────────────────────────────────────────
export const MAINTENANCE_KEY = 'acadflow_maintenance_on'

interface Props {
  onDisable: () => void
}

const EMOJIS = ['🛠️', '💀', '🤡', '💩', '😵‍💫', '🥲', '😤', '🙃', '🫠', '💔', '🤬', '😈', '🫡', '🤦', '🤷']
const FUNNY_LINES = [
  'Hamara server maa chuda raha hai, time lagega muh mein lele. ☕',
  'Abe lode ruk ja yaar, gaand mat mara apni idhar! 🤙',
  'BKL intern ne seedha production mein tatti kar di. BC kya karu iska. 😤',
  'Server ki behen chud gayi. HR se nayi randi lene ki baat chal rahi hai. 💼',
  'Bhai saab, system gaya apni maa chudane. Thoda wait kar gaandu. 🛢️',
  'Error 404: Developer k gaand k parche udd gaye. 💀',
  'Yeh sab teri wajah se hua hai madarchod. Haan, behenchod tujhe bol raha hoon. 😡',
  'Hum code fix kar rahe hain. Gandu shaant reh thoda warn gand mein danda de duga. 🔢',
  'Chal hat bkl, server ki gaand phati hai, aur mat maar uski. 😴',
  'Database ne bhi lund pakda diya yaar. Sabse bade chutiye aur mc nikle. 💔',
  'Bhai ek kaam kar — chai bana aur aa. Tab tak hum ye lund chudap theek karte hain. 🍵',
  'Tere baap ka lund hai jo 24/7 khada rahega chut ke patthe? Ruk ja thoda. 😂',
  'System ne gaand mar li hmari. Teri randi ex ki tarah. 🫠',
  'Production pe code push karte waqt tatte kaanp rahe the. Pata tha lawde lagenge. 🤡',
  'Saale chutiye maa k lode intern ko bataya tha test kar. BC seedha prod pe maa chod di. 🤦',
  'Server bolta hai: Gaand mara lo bhai, aaram chahiye aur nahi chudna mujhe. 🥲',
  'Maa chudi padi hai bc. Hum raat ke andhere mein lund dhoondh rahe hain. 🕯️',
  'Ek chut jaisa bug fix karo toh gaand se teen aur randwe nikal aate hain. 🐍',
  'Na lund khada hua na chudai mili... na idhar ka code chal raha na server chalu hai. 🎭',
  'Main seedha bata raha hu, mujhe lund kuch samjh nahi aa raha kya hua hai, bas button daba rha hoo. 😵',
]

export default function MaintenanceOverlay({ onDisable }: Props) {
  const [emoji, setEmoji]           = useState(EMOJIS[0])
  const [line, setLine]             = useState(FUNNY_LINES[0])
  const [dots, setDots]             = useState('.')
  const [shake, setShake]           = useState(false)

  // Secret "mkc" double-tap logic
  const [codeInput, setCodeInput]   = useState('')
  const [showUnlock, setShowUnlock] = useState(false)
  const [wrongCode, setWrongCode]   = useState(false)
  const tapCountRef                 = useRef(0)
  const tapTimerRef                 = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cycle emoji + line every 3s
  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      i = (i + 1) % EMOJIS.length
      setEmoji(EMOJIS[i])
      setLine(FUNNY_LINES[i % FUNNY_LINES.length])
    }, 3000)
    return () => clearInterval(id)
  }, [])

  // Animate dots
  useEffect(() => {
    const id = setInterval(() => {
      setDots(d => d.length >= 3 ? '.' : d + '.')
    }, 500)
    return () => clearInterval(id)
  }, [])

  // Shake every 5s (lol)
  useEffect(() => {
    const id = setInterval(() => {
      setShake(true)
      setTimeout(() => setShake(false), 600)
    }, 5000)
    return () => clearInterval(id)
  }, [])

  // Double-tap handler on the secret "mkc" text
  const handleMkcTap = useCallback(() => {
    tapCountRef.current += 1
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current)
    tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0 }, 500)

    if (tapCountRef.current >= 2) {
      tapCountRef.current = 0
      setShowUnlock(true)
      setCodeInput('')
      setWrongCode(false)
    }
  }, [])

  const handleUnlockSubmit = () => {
    const secret = process.env.NEXT_PUBLIC_MAINTENANCE_CODE || ''
    if (codeInput.trim() === secret) {
      onDisable()
    } else {
      setWrongCode(true)
      setTimeout(() => setWrongCode(false), 1500)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none"
      style={{
        background: 'linear-gradient(135deg, #0a0a0f 0%, #0d0f1e 40%, #0a0a0f 100%)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Animated grid bg */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glowing blob */}
      <div
        className="absolute rounded-full blur-3xl opacity-20 animate-pulse"
        style={{
          width: 500, height: 500,
          background: 'radial-gradient(circle, #6366f1, #8b5cf6)',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Content card */}
      <div
        className={`relative z-10 flex flex-col items-center text-center max-w-md px-8 py-10 rounded-3xl transition-transform ${shake ? 'animate-bounce' : ''}`}
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 0 80px rgba(99,102,241,0.15)',
        }}
      >
        {/* Big emoji */}
        <div
          className="text-8xl mb-6 transition-all duration-500"
          style={{ filter: 'drop-shadow(0 0 30px rgba(99,102,241,0.6))' }}
        >
          {emoji}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-black text-white mb-1 tracking-tight">
          Maintenance Chal Raha Hai
        </h1>
        <p className="text-xs text-slate-500 italic mb-4">System ki gaand fat chuki hai</p>
        <div className="flex items-center gap-1 mb-6">
          <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          <span className="text-xs text-red-400 font-bold tracking-wider">SAALA BAND HAI — RUK BSDK</span>
        </div>

        {/* Funny rotating line */}
        <p className="text-sm text-slate-200 leading-relaxed mb-1 min-h-[52px] transition-all duration-500 font-medium">
          {line}
        </p>

        {/* Loading dots */}
        <p className="text-indigo-400 text-sm font-mono mt-2 mb-8 tracking-widest">
          Fix ho raha hai{dots}
        </p>

        <p className="text-[11px] text-slate-600 mt-2">
          Kab aayega? Behenchod humein bhi nahi pata. 🙃
        </p>
      </div>

      {/* Secret "mkc" double-tap trigger — bottom of page */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <button
          onClick={handleMkcTap}
          className="text-[10px] text-slate-800 hover:text-slate-700 transition-colors select-none cursor-default"
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          aria-hidden="true"
        >
          mkc
        </button>
      </div>

      {/* Custom Unlock Modal Pop-up */}
      {showUnlock && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-opacity"
          onClick={e => { if (e.target === e.currentTarget) setShowUnlock(false) }}
        >
          <div
            className="w-[340px] rounded-3xl p-8 text-center animate-in zoom-in-95 duration-200"
            style={{
              background: '#111827',
              border: '1px solid rgba(139,92,246,0.4)',
              boxShadow: '0 0 60px rgba(139,92,246,0.3)',
            }}
          >
            <div className="text-[32px] mb-3">🔐</div>
            <h3 className="text-white font-bold text-lg mb-1">Code Daal BSDK</h3>
            <p className="text-white/50 text-xs mb-6">Muh me leni hai toh sahi daal</p>

            <input
              type="password"
              autoFocus
              value={codeInput}
              onChange={e => {
                setCodeInput(e.target.value)
                setWrongCode(false)
              }}
              onKeyDown={e => e.key === 'Enter' && handleUnlockSubmit()}
              placeholder="Secret code la bhadwe..."
              className="w-full p-3.5 rounded-xl border border-white/10 bg-white/5 text-white font-mono mb-4 text-sm outline-none focus:border-red-500/50 transition-colors"
              style={{
                ...(wrongCode ? { border: '1px solid #ef4444', background: 'rgba(239,68,68,0.1)' } : {})
              }}
            />

            {wrongCode && (
              <div className="text-red-500 text-xs mb-4 font-medium animate-pulse">
                ❌ Galat code bkl! Maa chuda.
              </div>
            )}

            <div className="flex gap-2.5">
              <button
                onClick={() => setShowUnlock(false)}
                className="flex-1 p-3 bg-transparent border border-white/10 text-white/60 rounded-xl text-sm font-semibold hover:bg-white/5 transition-colors"
              >
                Galti Se Daba Diya
              </button>
              <button
                onClick={handleUnlockSubmit}
                className="flex-1 p-3 rounded-xl text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg,#7c3aed,#dc2626)',
                  boxShadow: '0 10px 20px rgba(220,38,38,0.3)',
                }}
              >
                Khol De Bhai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
