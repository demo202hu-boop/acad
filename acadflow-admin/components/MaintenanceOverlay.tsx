'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ── Key used in localStorage ───────────────────────────────────────────────
export const MAINTENANCE_KEY = 'acadflow_maintenance_on'

interface Props {
  onDisable: () => void
}

const EMOJIS = ['🛠️', '💀', '🤡', '💩', '😵‍💫', '🥲', '😤', '🙃', '🫠', '💔', '🤬', '😈', '🫡', '🤦', '🤷']
const FUNNY_LINES = [
  'Maa chudi padi hai yahan, time lagega thoda muh mein lele. ☕',
  'Abe lode ruk ja yaar, gaand mat mara apni aake idhar! 🤙',
  'BKL kisi ne lund jaisa kaam kiya hai yahan. BC kya karu iska. 😤',
  'Har jagah maa behen chud chuki hai. Jaa abhi apni gaand mara jaa ke. 💼',
  'Bhai saab, sab kuch gaya apni maa chudane. Thoda wait kar gaandu. 🛢️',
  'Error 404: Dimag ki maa chud gayi poori tarah. 💀',
  'Yeh sab teri wajah se hua hai madarchod. Haan, behenchod tujhe bol raha hoon. 😡',
  'Kaam chal raha hai. Gandu shaant reh warna teri gaand mein danda de duga. 🔢',
  'Chal hat bkl, meri apni phati padi hai idhar, aur mat maar pakad ke. 😴',
  'Kismat ne aur in mc logo ne ek dum lund pakda diya yaar bhenchod. 💔',
  'Bhai ek kaam kar — chai bana aur aa. Tab tak hum ye lund chudap theek karte hain. 🍵',
  'Tere baap ka lund hai jo 24/7 khada rahega chut ke patthe? Ruk ja thoda. 😂',
  'Kismat ne gaand mar li hmari. Teri randi ex ki tarah. 🫠',
  'Pehle hi gaand se aawaz aa rahi thi lafde lagenge, phir nahaq akele ungli kardi humne. 🤡',
  'Saale chutiye ko bola tha dhyan rakhne ko, par mc ne naye tareeke se maa chod di dobara. 🤦',
  'Maa kasam ab lag raha hai sub chor ke, aaram se gaand mara lo bhai. 🥲',
  'Maa chudi padi hai bc. Hum raat ke andhere mein lund aur rasta dhoondh rahe hain. 🕯️',
  'Ek kalesh theek karne jao toh gaand se teen aur randwe bkl lund nikal aate hain. 🐍',
  'Na lund khada hua na chudai mili... lode alag ghisne pad rahe hain khali. 🎭',
  'Main seedha bata raha hu, mujhe lund kuch samjh nahi aa raha ab, kya maa chud rahi hai yahan. 😵',
]

export default function MaintenanceOverlay({ onDisable }: Props) {
  const CYCLE_DUR = 6000
  const [idx, setIdx]               = useState(0)
  const [emoji, setEmoji]           = useState(EMOJIS[0])
  const [line, setLine]             = useState(FUNNY_LINES[0])
  const [dots, setDots]             = useState('.')
  const [shake, setShake]           = useState(false)
  const [progress, setProgress]     = useState(0)

  // Secret "mkc" double-tap logic
  const [codeInput, setCodeInput]   = useState('')
  const [showUnlock, setShowUnlock] = useState(false)
  const [wrongCode, setWrongCode]   = useState(false)
  const tapCountRef                 = useRef(0)
  const tapTimerRef                 = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startTimeRef                = useRef<number>(Date.now())

  // Cycle emoji + line
  useEffect(() => {
    setEmoji(EMOJIS[idx % EMOJIS.length])
    setLine(FUNNY_LINES[idx % FUNNY_LINES.length])
  }, [idx])

  // Progress Bar Animation
  useEffect(() => {
    let animationFrameId: number

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current
      if (elapsed >= CYCLE_DUR) {
        startTimeRef.current = Date.now()
        setIdx(prev => prev + 1)
        setProgress(0)
      } else {
        setProgress((elapsed / CYCLE_DUR) * 100)
      }
      animationFrameId = requestAnimationFrame(tick)
    }
    
    animationFrameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationFrameId)
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
      <style>{`
        @keyframes panGrid {
          from { transform: translateY(0) translateX(0); }
          to { transform: translateY(40px) translateX(40px); }
        }
        @keyframes orbit1 {
          0% { transform: translate(0,0) scale(1); }
          100% { transform: translate(200px,100px) scale(1.2); }
        }
        @keyframes orbit2 {
          0% { transform: translate(0,0) scale(1); }
          100% { transform: translate(-150px,-150px) scale(1.1); }
        }
        @keyframes rainbowBg {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      {/* Animated grid bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99,102,241,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.15) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          animation: 'panGrid 15s linear infinite'
        }}
      />

      {/* Glowing Orbital Blobs */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute rounded-full opacity-30 mix-blend-screen"
          style={{
            width: 400, height: 400, top: '10%', left: '20%',
            background: 'radial-gradient(circle, #ec4899, #db2777)',
            filter: 'blur(100px)',
            animation: 'orbit1 12s infinite alternate ease-in-out'
          }}
        />
        <div
          className="absolute rounded-full opacity-30 mix-blend-screen"
          style={{
            width: 500, height: 500, bottom: '10%', right: '10%',
            background: 'radial-gradient(circle, #3b82f6, #2563eb)',
            filter: 'blur(120px)',
            animation: 'orbit2 15s infinite alternate ease-in-out'
          }}
        />
        <div
          className="absolute rounded-full max-w-full opacity-25 mix-blend-screen animate-pulse"
          style={{
            width: 450, height: 450, top: '40%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, #8b5cf6, #7c3aed)',
            filter: 'blur(110px)',
            animationDuration: '4s'
          }}
        />
      </div>

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
        <div className="flex items-center justify-center min-h-[80px] w-full mb-3">
          <p className="text-[15px] font-medium text-slate-200 leading-relaxed transition-all duration-300">
            {line}
          </p>
        </div>

        {/* 6-second progress bar */}
        <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden mb-6">
          <div 
            className="h-full rounded-full transition-all duration-75 ease-linear"
            style={{ 
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #ff4b2b, #ff416c, #8b5cf6, #3b82f6)'
            }}
          />
        </div>

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
