import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

/* ── Date grouping helper ────────────────────────────────────── */
function groupByDate(conversations) {
    const today = new Date()
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)

    const fmt = d => d.toDateString()

    const groups = { Today: [], Yesterday: [], Older: [] }
    conversations.forEach(c => {
        const d = new Date(c.updated_at)
        if (fmt(d) === fmt(today)) groups.Today.push(c)
        else if (fmt(d) === fmt(yesterday)) groups.Yesterday.push(c)
        else groups.Older.push(c)
    })
    return groups
}

/* ── Single conversation item ────────────────────────────────── */
function ConvItem({ conv, isActive, onClick, onDelete }) {
    const [hover, setHover] = useState(false)
    const [menuVisible, setMenuVisible] = useState(false)

    return (
        <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => { setHover(false); setMenuVisible(false) }}
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                background: isActive
                    ? 'rgba(34,211,238,0.10)'
                    : hover ? 'var(--glass-bg-hover)' : 'transparent',
                border: isActive ? '1px solid rgba(34,211,238,0.20)' : '1px solid transparent',
                transition: 'all 0.18s ease',
                marginBottom: 2,
            }}
        >
            <span style={{
                fontSize: '0.83rem', color: isActive ? 'var(--cyan)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 400,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                flex: 1,
            }}>
                💬 {conv.title}
            </span>

            {/* Delete button on hover */}
            {hover && (
                <button
                    onClick={e => { e.stopPropagation(); onDelete(conv.id) }}
                    style={{
                        background: 'transparent', border: 'none',
                        color: 'var(--text-muted)', cursor: 'pointer',
                        padding: '2px 6px', borderRadius: 6, fontSize: '0.8rem',
                        flexShrink: 0, transition: 'color 0.15s ease',
                    }}
                    onMouseEnter={e => e.target.style.color = '#f43f5e'}
                    onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
                >
                    ✕
                </button>
            )}
        </div>
    )
}

/* ── Main Sidebar ────────────────────────────────────────────── */
export default function Sidebar({
    username,
    conversations, setConversations,
    activeConvId, setActiveConvId,
    onNewChat,
}) {
    const { user, signOut } = useAuth()
    const navigate = useNavigate()

    /* Load conversations on mount */
    useEffect(() => {
        fetchConversations()
    }, [])

    const fetchConversations = async () => {
        const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .order('updated_at', { ascending: false })

        if (!error && data) setConversations(data)
    }

    /* Delete a conversation */
    const handleDelete = async (id) => {
        await supabase.from('conversations').delete().eq('id', id)
        setConversations(prev => prev.filter(c => c.id !== id))
        if (activeConvId === id) {
            setActiveConvId(null)
            onNewChat()
        }
    }

    /* Sign out */
    const handleSignOut = async () => {
        await signOut()
        navigate('/')
    }

    const groups = groupByDate(conversations)

    return (
        <aside style={{
            width: 'var(--sidebar-width)', flexShrink: 0,
            height: '100vh', display: 'flex', flexDirection: 'column',
            background: 'var(--bg-surface)',
            borderRight: '1px solid var(--glass-border)',
        }}>

            {/* ── Logo ─────────────────────────────────────────────── */}
            <div style={{
                padding: '20px 16px 16px',
                borderBottom: '1px solid var(--glass-border)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: 10,
                        background: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1rem', boxShadow: '0 0 16px rgba(34,211,238,0.3)',
                    }}>
                        🌊
                    </div>
                    <span style={{
                        fontSize: '1.05rem', fontWeight: 700,
                        background: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                        FloatChat
                    </span>
                </div>

                {/* New Chat */}
                <button
                    id="btn-new-chat"
                    onClick={onNewChat}
                    style={{
                        width: '100%', padding: '10px 14px',
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-secondary)',
                        borderRadius: 10, cursor: 'pointer',
                        fontSize: '0.85rem', fontWeight: 500,
                        display: 'flex', alignItems: 'center', gap: 8,
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--glass-bg-hover)'
                        e.currentTarget.style.borderColor = 'var(--glass-border-hover)'
                        e.currentTarget.style.color = 'var(--text-primary)'
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'var(--glass-bg)'
                        e.currentTarget.style.borderColor = 'var(--glass-border)'
                        e.currentTarget.style.color = 'var(--text-secondary)'
                    }}
                >
                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>+</span>
                    New conversation
                </button>
            </div>

            {/* ── History list ───────────────────────────────────────── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
                {conversations.length === 0 ? (
                    <p style={{
                        fontSize: '0.8rem', color: 'var(--text-muted)',
                        textAlign: 'center', marginTop: 32, lineHeight: 1.6,
                    }}>
                        No chats yet.<br />Ask the ocean something 🌊
                    </p>
                ) : (
                    Object.entries(groups).map(([label, convs]) =>
                        convs.length > 0 && (
                            <div key={label} style={{ marginBottom: 18 }}>
                                <p style={{
                                    fontSize: '0.68rem', fontWeight: 700,
                                    color: 'var(--text-muted)',
                                    letterSpacing: '0.08em', textTransform: 'uppercase',
                                    padding: '0 4px', marginBottom: 6,
                                }}>
                                    {label}
                                </p>
                                {convs.map(conv => (
                                    <ConvItem
                                        key={conv.id}
                                        conv={conv}
                                        isActive={activeConvId === conv.id}
                                        onClick={() => setActiveConvId(conv.id)}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        )
                    )
                )}
            </div>

            {/* ── User footer ────────────────────────────────────────── */}
            <div style={{
                padding: '14px 16px',
                borderTop: '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 10,
            }}>
                <div style={{ overflow: 'hidden' }}>
                    <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {username ?? user?.email?.split('@')[0]}
                    </p>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user?.email}
                    </p>
                </div>
                <button
                    id="btn-sign-out"
                    onClick={handleSignOut}
                    title="Sign out"
                    style={{
                        background: 'transparent', border: '1px solid var(--glass-border)',
                        color: 'var(--text-muted)', borderRadius: 8,
                        padding: '6px 10px', cursor: 'pointer', fontSize: '0.8rem',
                        flexShrink: 0, transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#f43f5e'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.3)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--glass-border)' }}
                >
                    ⏻
                </button>
            </div>
        </aside>
    )
}
