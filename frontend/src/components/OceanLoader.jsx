/* ============================================================
   OceanLoader — Full-screen animated ocean loading screen
   Used during auth checks and page transitions
   ============================================================ */

const waveStyle = (delay, opacity, speed) => ({
    position: 'absolute',
    bottom: 0,
    left: '-50%',
    width: '200%',
    height: '160px',
    background: 'linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%)',
    borderRadius: '43% 57% 52% 48% / 30% 30% 70% 70%',
    opacity,
    animation: `ocean-wave ${speed}s ease-in-out ${delay}s infinite alternate`,
    transformOrigin: '50% 100%',
})

export default function OceanLoader({ message = 'Charting your course…' }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'var(--bg-root)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
            fontFamily: 'var(--font-sans)',
        }}>

            {/* ── Ambient glow orbs ────────────────────────────────── */}
            <div style={{
                position: 'absolute', width: 500, height: 500, borderRadius: '50%',
                top: '-20%', left: '-10%',
                background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)',
                animation: 'orb-drift-1 18s ease-in-out infinite',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', width: 400, height: 400, borderRadius: '50%',
                bottom: '-10%', right: '-8%',
                background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)',
                animation: 'orb-drift-2 22s ease-in-out infinite',
                pointerEvents: 'none',
            }} />

            {/* ── Main content ─────────────────────────────────────── */}
            <div style={{
                position: 'relative', zIndex: 2,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 28,
                marginBottom: 120, // offset for wave panel below
            }}>

                {/* Floating boat */}
                <div style={{
                    fontSize: '3.4rem',
                    animation: 'float 3s ease-in-out infinite',
                    filter: 'drop-shadow(0 0 20px rgba(34,211,238,0.5))',
                }}>
                    🚢
                </div>

                {/* Brand */}
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{
                        fontSize: '2rem', fontWeight: 800,
                        letterSpacing: '-0.03em',
                        background: 'linear-gradient(135deg, #22d3ee, #3b82f6, #8b5cf6)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        backgroundSize: '200% auto',
                        animation: 'shimmer-text 2.5s linear infinite',
                        marginBottom: 8,
                    }}>
                        FloatChat
                    </h1>
                    <p style={{
                        fontSize: '0.88rem',
                        color: 'var(--text-muted)',
                        letterSpacing: '0.04em',
                    }}>
                        {message}
                    </p>
                </div>

                {/* Animated dots */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {[0, 1, 2, 3, 4].map(i => (
                        <div
                            key={i}
                            style={{
                                width: i === 2 ? 10 : 7,
                                height: i === 2 ? 10 : 7,
                                borderRadius: '50%',
                                background: i === 2 ? 'var(--cyan)' : 'rgba(34,211,238,0.35)',
                                animation: `typing-dot 1.4s ease-in-out ${i * 0.15}s infinite`,
                                boxShadow: i === 2 ? '0 0 10px rgba(34,211,238,0.6)' : 'none',
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* ── Wave panel at bottom ──────────────────────────────── */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: 220, overflow: 'hidden',
            }}>
                {/* Wave 3 — back */}
                <div style={waveStyle(0.4, 0.06, 5)} />
                {/* Wave 2 — middle */}
                <div style={waveStyle(0, 0.10, 6.5)} />
                {/* Wave 1 — front */}
                <div style={{ ...waveStyle(0.8, 0.18, 4), background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }} />

                {/* Foam line */}
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    height: 70,
                    background: 'linear-gradient(to bottom, transparent, rgba(14,165,233,0.08))',
                }} />
            </div>

            {/* ── Keyframes ─────────────────────────────────────────── */}
            <style>{`
        @keyframes ocean-wave {
          0%   { transform: translateX(0) scaleY(1) rotate(0deg); }
          50%  { transform: translateX(-8%) scaleY(1.12) rotate(1deg); }
          100% { transform: translateX(-4%) scaleY(0.94) rotate(-1deg); }
        }
        @keyframes shimmer-text {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
        </div>
    )
}
