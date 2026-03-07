import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function UsernameModal({ onComplete }) {
    const { user } = useAuth()
    const [username, setUsername] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        const name = username.trim()
        if (!name || name.length < 2) {
            setError('Must be at least 2 characters.')
            return
        }
        if (name.length > 24) {
            setError('Max 24 characters.')
            return
        }
        if (!/^[a-zA-Z0-9_\- ]+$/.test(name)) {
            setError('Only letters, numbers, spaces, _ and - allowed.')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const { error: dbError } = await supabase
                .from('profiles')
                .insert([{ id: user.id, username: name }])

            if (dbError) throw dbError
            onComplete(name)
        } catch (err) {
            // Username already taken or DB error
            setError(err.message?.includes('unique') ? 'That name is taken. Try another.' : err.message)
            setLoading(false)
        }
    }

    return (
        /* ── Backdrop ───────────────────────────────────────────── */
        <div style={{
            position: 'fixed', inset: 0, zIndex: 999,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
            animation: 'fadeIn 0.3s ease',
        }}>

            {/* ── Modal card ──────────────────────────────────────── */}
            <div className="animate-slide-in-up" style={{
                width: '100%', maxWidth: 420,
                background: 'rgba(10, 10, 28, 0.95)',
                border: '1px solid rgba(34, 211, 238, 0.18)',
                borderRadius: 24,
                padding: '44px 36px',
                boxShadow: '0 0 80px rgba(34,211,238,0.08), 0 24px 60px rgba(0,0,0,0.5)',
                position: 'relative', overflow: 'hidden',
            }}>

                {/* Glow top */}
                <div style={{
                    position: 'absolute', top: 0, left: '50%',
                    transform: 'translateX(-50%)',
                    width: 300, height: 1,
                    background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.4), transparent)',
                }} />

                {/* Icon */}
                <div style={{
                    textAlign: 'center', marginBottom: 24,
                    fontSize: '3rem',
                    animation: 'float 3s ease-in-out infinite',
                }}>
                    🌊
                </div>

                {/* Heading */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <h2 style={{
                        fontSize: '1.45rem', fontWeight: 800,
                        letterSpacing: '-0.02em', marginBottom: 8,
                        background: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                        What do you wanna get called?
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                        This is your research identity in FloatChat.
                        <br />You can always change it later.
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="msg-error animate-fade-in" style={{ marginBottom: 16 }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div style={{ position: 'relative', marginBottom: 16 }}>
                        <input
                            id="input-username"
                            type="text"
                            placeholder="e.g. OceanExplorer42"
                            value={username}
                            onChange={e => { setUsername(e.target.value); setError(null) }}
                            autoFocus
                            maxLength={24}
                            className="input-field"
                            style={{ paddingRight: 56, fontSize: '1rem', padding: '14px 18px', letterSpacing: '0.01em' }}
                        />
                        {/* Char counter */}
                        <span style={{
                            position: 'absolute', right: 14, top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '0.72rem', color: username.length > 20 ? 'var(--warning)' : 'var(--text-muted)',
                            pointerEvents: 'none',
                        }}>
                            {username.length}/24
                        </span>
                    </div>

                    <button
                        id="btn-set-username"
                        type="submit"
                        className="btn-primary"
                        disabled={loading || username.trim().length < 2}
                        style={{ width: '100%', padding: '14px', fontSize: '0.95rem', marginTop: 4 }}
                    >
                        {loading ? (
                            <div className="spinner" style={{ width: 20, height: 20 }} />
                        ) : (
                            <>Set my name — Let\'s go 🚀</>
                        )}
                    </button>
                </form>

                {/* Suggestion chips */}
                <div style={{ marginTop: 18, textAlign: 'center' }}>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                        Quick picks:
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center' }}>
                        {['OceanExplorer', 'ArgoResearcher', 'DeepSeaDiver', 'WaveRider', 'FloatWatcher']
                            .map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => { setUsername(s); setError(null) }}
                                    style={{
                                        padding: '4px 12px',
                                        background: 'var(--glass-bg)',
                                        border: '1px solid var(--glass-border)',
                                        color: 'var(--text-secondary)',
                                        borderRadius: 99, fontSize: '0.75rem',
                                        cursor: 'pointer', transition: 'all 0.15s ease',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.3)'; e.currentTarget.style.color = 'var(--cyan)' }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                                >
                                    {s}
                                </button>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
