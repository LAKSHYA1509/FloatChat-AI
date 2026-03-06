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

/* ── TX Hash Badge (Polygon Amoy) ───────────────────────────── */
function TxBadge({ txHash, auditHash, polygonscanUrl }) {
    const [expanded, setExpanded] = useState(false)
    const [copied, setCopied] = useState(null) // 'tx' | 'audit' | null

    const short = `${txHash.slice(0, 10)}…${txHash.slice(-8)}`
    const link = polygonscanUrl ?? `https://amoy.polygonscan.com/tx/${txHash}`

    const copyToClipboard = (text, key) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(key)
            setTimeout(() => setCopied(null), 2000)
        })
    }

    return (
        <div className="animate-slide-in-up" style={{
            marginTop: 12,
            borderRadius: 12,
            border: '1px solid rgba(167,139,250,0.25)',
            background: 'linear-gradient(135deg, rgba(139,92,246,0.07), rgba(59,130,246,0.07))',
            overflow: 'hidden',
        }}>
            {/* ── Header row ── */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', gap: 8,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    {/* animated chain icon */}
                    <span style={{
                        fontSize: '0.85rem',
                        animation: 'pulse-glow 2.5s ease infinite',
                        display: 'inline-block',
                    }}>⛓️</span>
                    <span style={{
                        fontSize: '0.72rem', fontWeight: 700,
                        color: '#a78bfa', letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                    }}>
                        On-Chain Verified
                    </span>
                    {/* live green dot */}
                    <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: '#4ade80',
                        boxShadow: '0 0 6px #4ade80',
                        display: 'inline-block',
                        animation: 'pulse-glow 2s ease infinite',
                    }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {/* PolygonScan link */}
                    <a href={link} target="_blank" rel="noopener noreferrer" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: '0.7rem', fontWeight: 600, color: '#818cf8',
                        textDecoration: 'none', padding: '3px 9px',
                        borderRadius: 99, border: '1px solid rgba(129,140,248,0.25)',
                        background: 'rgba(129,140,248,0.08)',
                        transition: 'all 0.18s ease',
                    }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(129,140,248,0.18)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(129,140,248,0.08)'}
                    >
                        View on PolygonScan ↗
                    </a>
                    {/* expand toggle */}
                    <button onClick={() => setExpanded(v => !v)} style={{
                        background: 'transparent', border: 'none',
                        color: 'var(--text-muted)', cursor: 'pointer',
                        fontSize: '0.75rem', padding: '2px 6px',
                        transition: 'color 0.15s',
                    }}
                        onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        title={expanded ? 'Collapse' : 'Show full hashes'}
                    >
                        {expanded ? '▴' : '▾'}
                    </button>
                </div>
            </div>

            {/* ── TX hash short pill ── */}
            <div style={{
                padding: '0 12px 8px',
                display: 'flex', alignItems: 'center', gap: 6,
            }}>
                <code style={{
                    fontSize: '0.72rem', color: '#c4b5fd',
                    fontFamily: 'var(--font-mono)',
                    background: 'rgba(139,92,246,0.1)',
                    padding: '2px 8px', borderRadius: 6,
                    letterSpacing: '0.03em',
                }}>
                    TX: {short}
                </code>
                <button
                    onClick={() => copyToClipboard(txHash, 'tx')}
                    title="Copy TX hash"
                    style={{
                        background: 'transparent', border: 'none',
                        cursor: 'pointer', fontSize: '0.75rem',
                        color: copied === 'tx' ? '#4ade80' : 'var(--text-muted)',
                        transition: 'color 0.2s', padding: '2px 4px',
                    }}
                >
                    {copied === 'tx' ? '✓' : '⧉'}
                </button>
            </div>

            {/* ── Expanded: show full hashes ── */}
            {expanded && (
                <div className="animate-slide-in-up" style={{
                    borderTop: '1px solid rgba(167,139,250,0.15)',
                    padding: '10px 12px',
                    display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                    {/* Full TX Hash */}
                    <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Transaction Hash
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <code style={{
                                fontSize: '0.68rem', color: '#c4b5fd',
                                fontFamily: 'var(--font-mono)',
                                wordBreak: 'break-all', lineHeight: 1.5,
                            }}>
                                {txHash}
                            </code>
                            <button onClick={() => copyToClipboard(txHash, 'tx-full')} style={{
                                background: 'transparent', border: 'none', cursor: 'pointer',
                                fontSize: '0.75rem', flexShrink: 0,
                                color: copied === 'tx-full' ? '#4ade80' : 'var(--text-muted)',
                                transition: 'color 0.2s',
                            }}>
                                {copied === 'tx-full' ? '✓' : '⧉'}
                            </button>
                        </div>
                    </div>

                    {/* Audit Hash */}
                    {auditHash && (
                        <div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Audit Hash (SHA-256 · reproducible)
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <code style={{
                                    fontSize: '0.68rem', color: '#93c5fd',
                                    fontFamily: 'var(--font-mono)',
                                    wordBreak: 'break-all', lineHeight: 1.5,
                                }}>
                                    {auditHash}
                                </code>
                                <button onClick={() => copyToClipboard(auditHash, 'audit')} style={{
                                    background: 'transparent', border: 'none', cursor: 'pointer',
                                    fontSize: '0.75rem', flexShrink: 0,
                                    color: copied === 'audit' ? '#4ade80' : 'var(--text-muted)',
                                    transition: 'color 0.2s',
                                }}>
                                    {copied === 'audit' ? '✓' : '⧉'}
                                </button>
                            </div>
                            <p style={{
                                fontSize: '0.63rem', color: 'var(--text-muted)',
                                marginTop: 4, fontStyle: 'italic',
                            }}>
                                SHA256(question + SQL + results) — independently reproducible by any researcher
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

/* ── Main MessageBubble ──────────────────────────────────────── */
export default function MessageBubble({ role, content, sqlGenerated, txHash, auditHash, polygonscanUrl, createdAt }) {
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
                    {!isUser && txHash && (
                        <TxBadge
                            txHash={txHash}
                            auditHash={auditHash}
                            polygonscanUrl={polygonscanUrl}
                        />
                    )}
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
