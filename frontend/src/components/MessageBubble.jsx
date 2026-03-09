import { useState } from 'react'

/* ── Typing indicator ────────────────────────────────────────── */
export function TypingIndicator() {
    return (
        <div className="flex gap-3 items-start py-1">
            <Avatar role="assistant" />
            <div className="px-4 py-3.5 glass-panel rounded-[4px_18px_18px_18px] flex gap-1.5 items-center">
                {[0, 1, 2].map(i => (
                    <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-primary block"
                        style={{ animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite` }}
                    />
                ))}
            </div>
        </div>
    )
}

/* ── Avatar ──────────────────────────────────────────────────── */
function Avatar({ role }) {
    const isUser = role === 'user'
    return (
        <div className={`
            w-8 h-8 rounded-full shrink-0 flex items-center justify-center
            text-[0.72rem] font-bold text-background
            ${isUser
                ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-[0_0_12px_rgba(139,92,246,0.4)]'
                : 'bg-gradient-to-br from-primary to-accent shadow-[0_0_12px_hsla(193,100%,50%,0.35)]'}
        `}>
            {isUser ? 'U' : '🌊'}
        </div>
    )
}

/* ── SQL Reveal Block ────────────────────────────────────────── */
function SqlBlock({ sql }) {
    const [open, setOpen] = useState(false)
    return (
        <div className="mt-3">
            <button
                onClick={() => setOpen(v => !v)}
                className="inline-flex items-center gap-1.5 text-[0.7rem] font-semibold text-primary bg-primary/8 border border-primary/20 rounded-full px-3 py-1 hover:bg-primary/15 transition-colors"
            >
                <span>{open ? '▾' : '▸'}</span>
                {open ? 'Hide' : 'View'} generated SQL
            </button>

            {open && (
                <pre className="mt-2 p-4 rounded-xl bg-black/40 border border-primary/10 text-[0.75rem] text-sky-300 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap" style={{ animation: 'chat-appear 0.25s ease both' }}>
                    {sql}
                </pre>
            )}
        </div>
    )
}

/* ── TX Hash Badge ───────────────────────────────────────────── */
function TxBadge({ txHash, auditHash, polygonscanUrl }) {
    const [expanded, setExpanded] = useState(false)
    const [copied, setCopied] = useState(null)

    const short = `${txHash.slice(0, 10)}…${txHash.slice(-8)}`
    const link = polygonscanUrl ?? `https://amoy.polygonscan.com/tx/${txHash}`

    const copyToClipboard = (text, key) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(key); setTimeout(() => setCopied(null), 2000)
        })
    }

    return (
        <div className="mt-3 rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.07] to-blue-500/[0.07] overflow-hidden" style={{ animation: 'chat-appear 0.3s ease both' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-3.5 py-2">
                <div className="flex items-center gap-2">
                    <span className="text-[0.88rem]" style={{ animation: 'pulse-glow 2.5s ease infinite' }}>⛓️</span>
                    <span className="text-[0.68rem] font-bold text-violet-300 uppercase tracking-wider">On-Chain Verified</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_#4ade80]" style={{ animation: 'pulse-glow 2s ease infinite' }} />
                </div>
                <div className="flex items-center gap-2">
                    <a
                        href={link} target="_blank" rel="noopener noreferrer"
                        className="text-[0.67rem] font-semibold text-indigo-300 border border-indigo-400/20 bg-indigo-400/8 rounded-full px-2.5 py-1 hover:bg-indigo-400/18 transition-colors"
                    >
                        View on PolygonScan ↗
                    </a>
                    <button
                        onClick={() => setExpanded(v => !v)}
                        className="text-[0.72rem] text-muted-foreground hover:text-violet-300 transition-colors px-1"
                        title={expanded ? 'Collapse' : 'Show full hashes'}
                    >
                        {expanded ? '▴' : '▾'}
                    </button>
                </div>
            </div>

            {/* Short TX pill */}
            <div className="px-3.5 pb-2.5 flex items-center gap-2">
                <code className="text-[0.7rem] text-violet-300 font-mono bg-violet-500/10 px-2 py-0.5 rounded-md tracking-wide">
                    TX: {short}
                </code>
                <button
                    onClick={() => copyToClipboard(txHash, 'tx')}
                    className={`text-[0.72rem] transition-colors ${copied === 'tx' ? 'text-green-400' : 'text-muted-foreground hover:text-violet-300'}`}
                >
                    {copied === 'tx' ? '✓' : '⧉'}
                </button>
            </div>

            {/* Expanded hashes */}
            {expanded && (
                <div className="border-t border-violet-500/10 px-3.5 py-3 flex flex-col gap-3" style={{ animation: 'chat-appear 0.2s ease both' }}>
                    <div>
                        <p className="text-[0.6rem] font-bold text-muted-foreground/50 uppercase tracking-widest mb-1">Transaction Hash</p>
                        <div className="flex items-center gap-2">
                            <code className="text-[0.67rem] text-violet-300 font-mono break-all leading-relaxed">{txHash}</code>
                            <button onClick={() => copyToClipboard(txHash, 'tx-full')} className={`text-[0.72rem] shrink-0 transition-colors ${copied === 'tx-full' ? 'text-green-400' : 'text-muted-foreground'}`}>
                                {copied === 'tx-full' ? '✓' : '⧉'}
                            </button>
                        </div>
                    </div>
                    {auditHash && (
                        <div>
                            <p className="text-[0.6rem] font-bold text-muted-foreground/50 uppercase tracking-widest mb-1">Audit Hash (SHA-256 · reproducible)</p>
                            <div className="flex items-center gap-2">
                                <code className="text-[0.67rem] text-sky-300 font-mono break-all leading-relaxed">{auditHash}</code>
                                <button onClick={() => copyToClipboard(auditHash, 'audit')} className={`text-[0.72rem] shrink-0 transition-colors ${copied === 'audit' ? 'text-green-400' : 'text-muted-foreground'}`}>
                                    {copied === 'audit' ? '✓' : '⧉'}
                                </button>
                            </div>
                            <p className="text-[0.6rem] text-muted-foreground/40 italic mt-1">SHA256(question + SQL + results) — independently reproducible by any researcher</p>
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
        <div className={`flex gap-3 items-start py-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`} style={{ animation: 'chat-appear 0.3s ease both' }}>
            <Avatar role={role} />

            <div className={`max-w-[72%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <span className="text-[0.65rem] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-1.5">
                    {isUser ? 'You' : 'FloatChat'}
                </span>

                <div className={`
                    px-4 py-3.5 backdrop-blur-sm
                    ${isUser
                        ? 'bg-gradient-to-br from-primary/15 to-accent/10 border border-primary/25 rounded-[18px_4px_18px_18px]'
                        : 'glass-panel rounded-[4px_18px_18px_18px]'}
                `}>
                    <p className="text-foreground text-[0.88rem] leading-[1.68] whitespace-pre-wrap break-words">
                        {content}
                    </p>

                    {!isUser && sqlGenerated && <SqlBlock sql={sqlGenerated} />}
                    {!isUser && txHash && (
                        <TxBadge txHash={txHash} auditHash={auditHash} polygonscanUrl={polygonscanUrl} />
                    )}
                </div>

                {createdAt && (
                    <span className="text-[0.63rem] text-muted-foreground/40 mt-1.5">
                        {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}
            </div>
        </div>
    )
}
