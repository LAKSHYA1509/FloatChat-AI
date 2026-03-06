import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import MessageBubble, { TypingIndicator } from './MessageBubble'

const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

// Human-readable error when the Python backend is not running
const BACKEND_OFFLINE_MSG = 'Cannot reach the FloatChat backend. Make sure the Python server is running: python -m uvicorn api.main:app --reload --port 8000'

export default function ChatWindow({
    conversationId, setConversationId,
    conversations, setConversations,
}) {
    const { user } = useAuth()
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [backendOnline, setBackendOnline] = useState(true)
    const bottomRef = useRef(null)
    const inputRef = useRef(null)

    /* ── Load messages when conversation switches ──────────────── */
    useEffect(() => {
        if (conversationId) {
            loadMessages(conversationId)
        } else {
            setMessages([])
        }
    }, [conversationId])

    /* ── Auto-scroll to bottom ─────────────────────────────────── */
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isLoading])

    /* ── Focus input on mount ──────────────────────────────────── */
    useEffect(() => {
        inputRef.current?.focus()
    }, [conversationId])

    const loadMessages = async (convId) => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: true })

        if (!error && data) setMessages(data)
    }

    /* ── Create a new conversation row ────────────────────────── */
    const createConversation = async (firstQuestion) => {
        const title = firstQuestion.length > 58
            ? firstQuestion.slice(0, 55) + '…'
            : firstQuestion

        const { data, error } = await supabase
            .from('conversations')
            .insert([{ user_id: user.id, title }])
            .select()
            .single()

        if (error) throw error

        // Add to sidebar list
        setConversations(prev => [data, ...prev])
        return data.id
    }

    /* ── Save a message to Supabase ────────────────────────────── */
    const saveMessage = async (convId, role, content, extra = {}) => {
        const { data, error } = await supabase
            .from('messages')
            .insert([{
                conversation_id: convId,
                role,
                content,
                sql_generated: extra.sql_generated ?? null,
                tx_hash: extra.tx_hash ?? null,
            }])
            .select()
            .single()

        if (error) throw error
        return data
    }

    /* ── Send message ──────────────────────────────────────────── */
    const handleSend = async () => {
        const question = input.trim()
        if (!question || isLoading) return

        setInput('')
        setError(null)
        setIsLoading(true)

        try {
            // 1. Create conversation if new
            let convId = conversationId
            if (!convId) {
                convId = await createConversation(question)
                setConversationId(convId)
            }

            // 2. Save + display user message
            const userMsg = await saveMessage(convId, 'user', question)
            setMessages(prev => [...prev, userMsg])

            // 3. Call FastAPI RAG backend
            const response = await fetch(`${API_BASE}/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question }),
            })

            if (!response.ok) {
                const detail = await response.json()
                throw new Error(detail?.detail ?? 'API error')
            }

            const result = await response.json()
            // result = { summary, sql_query, data, validation_error }

            const answerText = result.validation_error
                ? `⚠️ ${result.validation_error}\n\n${result.summary ?? ''}`
                : result.summary ?? 'No answer generated.'

            // 4. Save + display assistant message (with SQL + TX hash)
            const aiMsg = await saveMessage(convId, 'assistant', answerText, {
                sql_generated: result.sql_query ?? null,
                tx_hash: result.tx_hash ?? null,
            })
            setMessages(prev => [...prev, aiMsg])
            setBackendOnline(true) // explicit: backend clearly alive

        } catch (err) {
            const isOffline = err.message === 'Failed to fetch' || err.name === 'TypeError'
            if (isOffline) {
                setBackendOnline(false)
                setError(BACKEND_OFFLINE_MSG)
            } else {
                setBackendOnline(true)
                setError(err.message)
            }
        } finally {
            setIsLoading(false)
        }
    }

    /* ── Auto-ping backend when offline (recovers automatically) ─ */
    useEffect(() => {
        if (backendOnline) return
        const ping = async () => {
            try {
                const r = await fetch(`${API_BASE}/health`, { method: 'GET' })
                if (r.ok) {
                    setBackendOnline(true)
                    setError(null)
                }
            } catch {
                // still offline — keep trying
            }
        }
        const id = setInterval(ping, 5000)
        return () => clearInterval(id)
    }, [backendOnline])

    /* ── Enter key to send ─────────────────────────────────────── */
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    /* ─── Empty state ─────────────────────────────────────────── */
    const isEmpty = messages.length === 0

    return (
        <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            height: '100vh', overflow: 'hidden',
            background: 'var(--bg-root)',
        }}>

            {/* ── Top bar ─────────────────────────────────────────── */}
            <div style={{
                padding: '14px 28px',
                borderBottom: '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'var(--bg-surface)', flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: backendOnline ? 'var(--cyan)' : 'var(--error)',
                        boxShadow: backendOnline ? '0 0 8px var(--cyan)' : '0 0 8px var(--error)',
                        animation: backendOnline ? 'pulse-glow 2s ease infinite' : 'none',
                    }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {conversationId ? 'Research session active' : 'Start a new research query'}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                        fontSize: '0.71rem', fontWeight: 600,
                        padding: '3px 10px', borderRadius: 99,
                        background: backendOnline ? 'rgba(34,211,238,0.08)' : 'rgba(244,63,94,0.08)',
                        color: backendOnline ? 'var(--cyan)' : 'var(--error)',
                        border: `1px solid ${backendOnline ? 'rgba(34,211,238,0.18)' : 'rgba(244,63,94,0.18)'}`,
                    }}>
                        {backendOnline ? '⬤ Backend live' : '⬤ Backend offline'}
                    </span>
                </div>
            </div>

            {/* ── Backend offline banner ───────────────────────────── */}
            {!backendOnline && (
                <div style={{
                    background: 'rgba(244,63,94,0.07)',
                    borderBottom: '1px solid rgba(244,63,94,0.15)',
                    padding: '10px 28px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexShrink: 0, gap: 12, flexWrap: 'wrap',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.8rem', color: '#fb7185' }}>
                            ⚠️ Python backend not running.
                        </span>
                        <code style={{
                            fontSize: '0.75rem', color: '#7dd3fc',
                            background: 'rgba(0,0,0,0.3)', padding: '2px 10px',
                            borderRadius: 6, fontFamily: 'var(--font-mono)',
                        }}>
                            python -m uvicorn api.main:app --reload --port 8000
                        </code>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Auto-reconnecting every 5s...
                        </span>
                        <button
                            onClick={async () => {
                                try {
                                    const r = await fetch(`${API_BASE}/health`)
                                    if (r.ok) { setBackendOnline(true); setError(null) }
                                } catch { /* still offline */ }
                            }}
                            style={{
                                padding: '4px 14px', borderRadius: 8, cursor: 'pointer',
                                background: 'rgba(244,63,94,0.12)',
                                border: '1px solid rgba(244,63,94,0.25)',
                                color: '#fb7185', fontSize: '0.75rem', fontWeight: 600,
                                fontFamily: 'var(--font-sans)',
                                transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.22)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.12)' }}
                        >
                            Retry now
                        </button>
                    </div>
                </div>
            )}

            {/* ── Messages area ───────────────────────────────────── */}
            <div style={{
                flex: 1, overflowY: 'auto',
                padding: '24px 10%',
                display: 'flex', flexDirection: 'column', gap: 18,
            }}>

                {/* Empty state */}
                {isEmpty && !isLoading && (
                    <div className="animate-fade-in" style={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        flex: 1, gap: 18, textAlign: 'center',
                    }}>
                        <div style={{
                            fontSize: '3.5rem',
                            animation: 'float 4s ease-in-out infinite',
                        }}>🌊</div>
                        <div>
                            <h2 style={{
                                fontSize: '1.5rem', fontWeight: 700,
                                background: 'var(--gradient-primary)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                marginBottom: 8,
                            }}>
                                Ask the Ocean Anything
                            </h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: 460, lineHeight: 1.6 }}>
                                Query Argo float data in plain English. Every answer is AI-powered, SQL-backed and cryptographically logged on Polygon.
                            </p>
                        </div>

                        {/* Suggestion chips */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 540 }}>
                            {[
                                'What is the average salinity in the Bay of Bengal?',
                                'Show temperature trends at 500m depth in 2023',
                                'Which Argo floats recorded below 2°C last month?',
                                'Compare Indian Ocean vs Pacific salinity levels',
                            ].map(q => (
                                <button key={q} onClick={() => setInput(q)} style={{
                                    padding: '8px 14px',
                                    background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                                    color: 'var(--text-secondary)', borderRadius: 99,
                                    fontSize: '0.8rem', cursor: 'pointer',
                                    transition: 'all 0.18s ease',
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.3)'; e.currentTarget.style.color = 'var(--cyan)' }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Messages */}
                {messages.map(msg => (
                    <MessageBubble
                        key={msg.id}
                        role={msg.role}
                        content={msg.content}
                        sqlGenerated={msg.sql_generated}
                        txHash={msg.tx_hash}
                        createdAt={msg.created_at}
                    />
                ))}

                {isLoading && <TypingIndicator />}

                {/* Error — only show non-backend errors inline (backend has its own banner) */}
                {error && backendOnline && (
                    <div className="msg-error animate-slide-in-up">
                        ⚠️ {error}
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* ── Input bar ───────────────────────────────────────── */}
            <div style={{
                padding: '16px 10%',
                borderTop: '1px solid var(--glass-border)',
                background: 'var(--bg-surface)',
                flexShrink: 0,
            }}>
                <div style={{
                    display: 'flex', gap: 12, alignItems: 'flex-end',
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 16, padding: '8px 8px 8px 18px',
                    transition: 'all 0.2s ease',
                }}
                    onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(34,211,238,0.35)'}
                    onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                >
                    <textarea
                        id="chat-input"
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything about ocean data…"
                        rows={1}
                        style={{
                            flex: 1, background: 'transparent', border: 'none', outline: 'none',
                            color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
                            fontSize: '0.92rem', lineHeight: 1.5, resize: 'none',
                            maxHeight: 120, overflowY: 'auto',
                            paddingTop: 6,
                        }}
                        onInput={e => {
                            e.target.style.height = 'auto'
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                        }}
                    />
                    <button
                        id="btn-send"
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        style={{
                            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                            background: input.trim() && !isLoading
                                ? 'linear-gradient(135deg, #22d3ee, #3b82f6)'
                                : 'var(--glass-bg)',
                            border: '1px solid var(--glass-border)',
                            color: input.trim() && !isLoading ? '#fff' : 'var(--text-muted)',
                            cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.1rem', transition: 'all 0.2s ease',
                            boxShadow: input.trim() && !isLoading ? '0 0 16px rgba(34,211,238,0.25)' : 'none',
                        }}
                    >
                        {isLoading ? <div className="spinner" style={{ width: 18, height: 18 }} /> : '↑'}
                    </button>
                </div>

                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
                    Press <kbd style={{ background: 'var(--glass-bg)', padding: '1px 5px', borderRadius: 4, border: '1px solid var(--glass-border)', fontSize: '0.68rem' }}>Enter</kbd> to send · <kbd style={{ background: 'var(--glass-bg)', padding: '1px 5px', borderRadius: 4, border: '1px solid var(--glass-border)', fontSize: '0.68rem' }}>Shift+Enter</kbd> for new line
                </p>
            </div>
        </div>
    )
}
