import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Bell } from 'lucide-react'

export default function NotificationBell({ userId }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const hasShownUnreadToast = useRef(false)

  useEffect(() => {
    fetchNotifications()

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        const n = payload.new
        setNotifications(prev => [n, ...prev].slice(0, 10))
        setUnreadCount(prev => prev + 1)
        toast(n.title, { icon: getNotifEmoji(n.type), duration: 4000 })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function fetchNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
    const all = data || []
    setNotifications(all)
    const unread = all.filter(n => !n.is_read).length
    setUnreadCount(unread)

    if (unread > 0 && !hasShownUnreadToast.current) {
      hasShownUnreadToast.current = true
      toast(`You have ${unread} unread notification${unread > 1 ? 's' : ''}`, { icon: '🔔', duration: 3000 })
    }
  }

  async function markAsRead(id) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  async function markAllRead() {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (!unreadIds.length) return
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  function getNotifEmoji(type) {
    const map = { job_offer: '🛺', proof_uploaded: '📸', campaign_expiring: '⏰', proof_approved: '✅', payout_sent: '💸', campaign_paid: '💳', driver_assigned: '👤' }
    return map[type] || '🔔'
  }

  function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: '6px', display: 'flex', alignItems: 'center' }}
      >
        <Bell size={20} color="#666" />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '2px', right: '2px',
            background: '#E53935', color: '#fff', fontSize: '0.6rem', fontWeight: 800,
            width: '16px', height: '16px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div style={{
          position: 'absolute', top: '42px', right: 0, width: '320px',
          background: '#fff', border: '1px solid #E8E8E8', borderRadius: '14px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden',
          animation: 'notifSlideIn .2s ease-out'
        }}>
          <style>{`@keyframes notifSlideIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #F0F0F0' }}>
            <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>Notifications</div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#D49800', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                Mark all read
              </button>
            )}
          </div>
          <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
            {notifications.length === 0
              ? <div style={{ padding: '30px 16px', textAlign: 'center', color: '#bbb' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔕</div>
                <div style={{ fontSize: '0.84rem' }}>No notifications yet</div>
              </div>
              : notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && markAsRead(n.id)}
                  style={{
                    padding: '12px 16px', borderBottom: '1px solid #F5F5F5',
                    background: n.is_read ? '#fff' : '#FFFBEB',
                    cursor: n.is_read ? 'default' : 'pointer',
                    transition: 'background .2s'
                  }}
                >
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.2rem', flexShrink: 0, marginTop: '2px' }}>{getNotifEmoji(n.type)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.84rem', marginBottom: '2px' }}>{n.title}</div>
                      <div style={{ fontSize: '0.78rem', color: '#666', lineHeight: 1.4 }}>{n.message}</div>
                      <div style={{ fontSize: '0.68rem', color: '#aaa', marginTop: '4px' }}>{timeAgo(n.created_at)}</div>
                    </div>
                    {!n.is_read && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFBF00', flexShrink: 0, marginTop: '6px' }} />}
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  )
}
