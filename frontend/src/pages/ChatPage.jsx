import { useEffect, useState } from 'react'
import ChatWindow from '../components/ChatWindow'
import OceanLoader from '../components/OceanLoader'
import Sidebar from '../components/Sidebar'
import UsernameModal from '../components/UsernameModal'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function ChatPage() {
    const { user } = useAuth()

    const [conversations, setConversations] = useState([])
    const [activeConvId, setActiveConvId] = useState(null)
    const [username, setUsername] = useState(null)
    const [profileLoading, setProfileLoading] = useState(true)

    /* ── Fetch profile on mount ─────────────────────────────── */
    useEffect(() => {
        if (user) fetchProfile()
    }, [user])

    const fetchProfile = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single()

        setUsername(data?.username ?? null)
        setProfileLoading(false)
    }

    const handleUsernameSet = (name) => {
        setUsername(name)
    }

    const handleNewChat = () => setActiveConvId(null)

    /* Show loader while we check if profile exists */
    if (profileLoading) {
        return <OceanLoader message="Loading your research space…" />
    }

    return (
        <div style={{
            display: 'flex', height: '100vh',
            background: 'var(--bg-root)',
            fontFamily: 'var(--font-sans)',
            overflow: 'hidden',
        }}>
            {/* Username popup — shown once after first login */}
            {!username && (
                <UsernameModal onComplete={handleUsernameSet} />
            )}

            {/* ── Sidebar ──────────────────────────────────────── */}
            <Sidebar
                username={username}
                conversations={conversations}
                setConversations={setConversations}
                activeConvId={activeConvId}
                setActiveConvId={setActiveConvId}
                onNewChat={handleNewChat}
            />

            {/* ── Chat area ────────────────────────────────────── */}
            <ChatWindow
                conversationId={activeConvId}
                setConversationId={setActiveConvId}
                conversations={conversations}
                setConversations={setConversations}
            />
        </div>
    )
}
