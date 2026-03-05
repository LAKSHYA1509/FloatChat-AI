import { useState } from 'react'

/* ── Typing indicator (three bouncing dots) ──────────────────── */
export function TypingIndicator() {
    return (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '4px 0' }}>
            <Avatar role="assistant" />
            <div style={{
                padding: '14px 18px',
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '4px 18px 18px 18px',
                display: 'flex', gap: 6, alignItems: 'center',
            }}>
                {[0, 1, 2].map(i => (
                    <span key={i} style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: 'var(--cyan)',
                        animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                        display: 'block',
                    }} />
                ))}
            </div>
        </div>
    )
}

/* ── Avatar circle ───────────────────────────────────────────── */
function Avatar({ role }) {
    const isUser = role === 'user'
    return (
        <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: isUser
                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                : 'linear-gradient(135deg, #22d3ee, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.75rem', fontWeight: 700, color: '#fff',
            boxShadow: isUser
                ? '0 0 12px rgba(99,102,241,0.35)'
                : '0 0 12px rgba(34,211,238,0.30)',
        }}>
            {isUser ? 'U' : 'FC'}
        </div>
    )
}

/* ── SQL Reveal Block ────────────────────────────────────────── */
function SqlBlock({ sql }) {
    const [open, setOpen] = useState(false)
    return (
        <div style={{ marginTop: 10 }}>
            <button
                onClick={() => setOpen(v => !v)}
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'rgba(34,211,238,0.08)',
                    border: '1px solid rgba(34,211,238,0.18)',
                    color: 'var(--cyan)', borderRadius: 99,
                    padding: '4px 12px', fontSize: '0.72rem', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.2s ease',
                }}
            >
                <span>{open ? '▾' : '▸'}</span>
                {open ? 'Hide' : 'View'} generated SQL
            </button>

            {open && (
                <div className="code-block animate-slide-in-up" style={{ marginTop: 8 }}>
                    {sql}
                </div>
            )}
        </div>
    )
}

/* ── TX Hash Badge ───────────────────────────────────────────── */
function TxBadge({ txHash }) {
    const short = `${txHash.slice(0, 6)}…${txHash.slice(-4)}`
    const link = `https://mumbai.polygonscan.com/tx/${txHash}`
    return (
        <a href={link} target="_blank" rel="noopener noreferrer"
            style={{ textDecoration: 'none', display: 'inline-flex', marginTop: 8 }}
        >
            <span className="badge badge-purple">
                ⛓ Verified on-chain · {short}
            </span>
        </a>
    )
}

/* ── Main MessageBubble ──────────────────────────────────────── */
export default function MessageBubble({ role, content, sqlGenerated, txHash, createdAt }) {
    const isUser = role === 'user'

    return (
        <div className="animate-slide-in-up" style={{
            display: 'flex',
            flexDirection: isUser ? 'row-reverse' : 'row',
            gap: 10,
            alignItems: 'flex-start',
            padding: '4px 0',
        }}>
            <Avatar role={role} />

            <div style={{
                maxWidth: '72%',
                display: 'flex', flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
            }}>
                {/* Role label */}
                <span style={{
                    fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em',
                    color: 'var(--text-muted)', marginBottom: 4,
                    textTransform: 'uppercase',
                }}>
                    {isUser ? 'You' : 'FloatChat'}
                </span>

                {/* Bubble */}
                <div style={{
                    padding: '13px 17px',
                    background: isUser
                        ? 'linear-gradient(135deg, rgba(34,211,238,0.12), rgba(59,130,246,0.12))'
                        : 'var(--glass-bg)',
                    border: `1px solid ${isUser ? 'rgba(34,211,238,0.22)' : 'var(--glass-border)'}`,
                    borderRadius: isUser
                        ? '18px 4px 18px 18px'
                        : '4px 18px 18px 18px',
                    backdropFilter: 'blur(12px)',
                }}>
                    <p style={{
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem', lineHeight: 1.65,
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}>
                        {content}
                    </p>

                    {/* SQL block — only on assistant messages */}
                    {!isUser && sqlGenerated && <SqlBlock sql={sqlGenerated} />}

                    {/* Blockchain TX badge */}
                    {!isUser && txHash && <TxBadge txHash={txHash} />}
                </div>

                {/* Timestamp */}
                {createdAt && (
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}
            </div>
        </div>
    )
}
