import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchTrip, fetchReservations, createReservation, updateReservation, deleteReservation } from '../services/api.js'
import { RippleButton } from '@/components/ui/ripple-button'
import { Skeleton } from '@/components/ui/skeleton'


function Reservations() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [trip, setTrip] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [filterType, setFilterType] = useState('all')
    const [editingId, setEditingId] = useState(null)
    const [editForm, setEditForm] = useState({})
    const [reservations, setReservations] = useState([])
    const [form, setForm] = useState({
        type: 'hotel',
        name: '',
        location: '',
        confirmationCode: '',
        date: '',
        endDate: '',
        notes: '',
    })

    useEffect(() => {
        async function load() {
            const [tripResult, reservationsResult] = await Promise.allSettled([
                fetchTrip(id),
                fetchReservations(id),
            ])
            if (tripResult.status === 'fulfilled') setTrip(tripResult.value)
            if (reservationsResult.status === 'fulfilled') setReservations(reservationsResult.value)
            setLoading(false)
        }
        load()
    }, [id])

    async function handleSubmit(e) {
        e.preventDefault()
        if (!form.name.trim()) { alert('名稱不能為空'); return }
        try {
            const newReservation = await createReservation(id, form)
            setReservations(prev => [...prev, newReservation])
            setForm({ type: 'hotel', name: '', location: '', confirmationCode: '', date: '', endDate: '', notes: '' })
            setShowForm(false)
        } catch { alert('新增失敗，請稍後再試') }
    }

    function handleEdit(r) {
        setEditingId(r.id)
        setEditForm({
            type: r.type || 'hotel',
            name: r.name,
            location: r.location,
            confirmationCode: r.confirmation_code,
            date: r.date ? r.date.slice(0, 10) : '',
            endDate: r.end_date ? r.end_date.slice(0, 10) : '',
            notes: r.notes,
        })
    }

    async function handleSave(reservationId) {
        try {
            const updated = await updateReservation(id, reservationId, editForm)
            setReservations(prev => prev.map(r => r.id === reservationId ? updated : r))
            setEditingId(null)
        } catch { alert('儲存失敗，請稍後再試') }
    }

    async function handleDelete(reservationId) {
        try {
            await deleteReservation(id, reservationId)
            setReservations(prev => prev.filter(r => r.id !== reservationId))
        } catch { alert('刪除失敗，請稍後再試') }
    }

    if (loading) return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto p-4 md:p-8 flex flex-col gap-6">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-20 rounded-xl" />
                    <Skeleton className="h-8 w-48" />
                </div>
                <Skeleton className="h-40 w-full rounded-2xl" />
                <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
        </div>
    )

    if (!trip) return null

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto p-4 md:p-8 flex flex-col gap-6">
                <div className="flex items-center gap-3">
                    <RippleButton onClick={() => navigate(`/trip/${id}`)} className="text-sm border-border">
                        ← 返回
                    </RippleButton>
                    <h1 className="text-xl md:text-3xl font-bold text-primary">{trip.city_display} · 訂位資訊</h1>
                </div>

                <div className="bg-card rounded-2xl p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-lg text-primary">新增訂位</h2>
                        <button
                            type="button"
                            onClick={() => setShowForm(prev => !prev)}
                            className="text-sm px-3 py-1 border border-border rounded-lg cursor-pointer hover:opacity-90"
                        >
                            {showForm ? '收起' : '+ 新增'}
                        </button>
                    </div>
                    {showForm && <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-muted-foreground">類型</label>
                            <select value={form.type} onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))} className="border border-border rounded-lg px-3 py-2 bg-background text-sm">
                                <option value="hotel">飯店</option>
                                <option value="restaurant">餐廳</option>
                                <option value="attraction">景點</option>
                                <option value="other">其他</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-muted-foreground">名稱</label>
                            <input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. 新宿格蘭貝爾酒店" className="border border-border rounded-lg px-3 py-2 bg-background text-sm" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-muted-foreground">地點</label>
                            <input value={form.location} onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))} placeholder="e.g. 新宿三丁目" className="border border-border rounded-lg px-3 py-2 bg-background text-sm" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-muted-foreground">確認碼</label>
                            <input value={form.confirmationCode} onChange={e => setForm(prev => ({ ...prev, confirmationCode: e.target.value }))} placeholder="e.g. ABC123" className="border border-border rounded-lg px-3 py-2 bg-background text-sm" />
                        </div>
                        <div className="flex gap-2">
                            <div className="flex flex-col gap-1 flex-1">
                                <label className="text-sm text-muted-foreground">{form.type === 'hotel' ? '入住日期' : '日期'}</label>
                                <input type="date" value={form.date} onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))} className="border border-border rounded-lg px-3 py-2 bg-background text-sm" />
                            </div>
                            {form.type === 'hotel' && (
                                <div className="flex flex-col gap-1 flex-1">
                                    <label className="text-sm text-muted-foreground">退房日期</label>
                                    <input type="date" value={form.endDate} onChange={e => setForm(prev => ({ ...prev, endDate: e.target.value }))} className="border border-border rounded-lg px-3 py-2 bg-background text-sm" />
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-muted-foreground">備註</label>
                            <textarea value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} className="border border-border rounded-lg px-3 py-2 bg-background text-sm resize-none" rows={2} />
                        </div>
                        <button type="submit" className="bg-primary text-primary-foreground rounded-lg py-2 font-semibold hover:opacity-90 transition-opacity cursor-pointer">新增</button>
                    </form>}
                </div>

                <div className="overflow-x-auto pb-1 scrollbar-hide">
                    <div className="flex gap-2 w-max">
                        {['all', 'hotel', 'restaurant', 'attraction', 'other'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`text-sm px-3 py-1 rounded-full cursor-pointer transition-colors whitespace-nowrap ${
                                    filterType === type
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-secondary text-secondary-foreground hover:opacity-80'
                                }`}
                            >
                                {type === 'all' ? '全部' : type === 'hotel' ? '飯店' : type === 'restaurant' ? '餐廳' : type === 'attraction' ? '景點' : '其他'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    {reservations.filter(r => filterType === 'all' || r.type === filterType).length === 0 && (
                        <div className="text-center py-12 text-muted-foreground text-sm">
                            <p>還沒有任何訂位記錄</p>
                            <p>使用上方表單新增第一筆</p>
                        </div>
                    )}
                    {reservations.filter(r => filterType === 'all' || r.type === filterType).map(r => (
                        <div key={r.id} className="bg-card rounded-2xl p-6 flex flex-col gap-3">
                            {editingId === r.id ? (
                                <>
                                    <div className="flex gap-2">
                                        <select value={editForm.type} onChange={e => setEditForm(prev => ({ ...prev, type: e.target.value }))} className="border border-border rounded-lg px-3 py-1.5 bg-background text-sm">
                                            <option value="hotel">飯店</option>
                                            <option value="restaurant">餐廳</option>
                                            <option value="attraction">景點</option>
                                            <option value="other">其他</option>
                                        </select>
                                        <input value={editForm.name} onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))} placeholder="名稱" className="flex-1 border border-border rounded-lg px-3 py-1.5 bg-background text-sm" />
                                    </div>
                                    <input value={editForm.location} onChange={e => setEditForm(prev => ({ ...prev, location: e.target.value }))} placeholder="地點" className="border border-border rounded-lg px-3 py-1.5 bg-background text-sm" />
                                    <input value={editForm.confirmationCode} onChange={e => setEditForm(prev => ({ ...prev, confirmationCode: e.target.value }))} placeholder="確認碼" className="border border-border rounded-lg px-3 py-1.5 bg-background text-sm" />
                                    <div className="flex gap-2">
                                        <input type="date" value={editForm.date} onChange={e => setEditForm(prev => ({ ...prev, date: e.target.value }))} className="flex-1 border border-border rounded-lg px-3 py-1.5 bg-background text-sm" />
                                        {editForm.type === 'hotel' && <input type="date" value={editForm.endDate} onChange={e => setEditForm(prev => ({ ...prev, endDate: e.target.value }))} className="flex-1 border border-border rounded-lg px-3 py-1.5 bg-background text-sm" />}
                                    </div>
                                    <input value={editForm.notes || ''} onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="備註" className="border border-border rounded-lg px-3 py-1.5 bg-background text-sm" />
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => setEditingId(null)} className="text-sm px-3 py-1 border border-border rounded-lg cursor-pointer hover:opacity-80">取消</button>
                                        <button onClick={() => handleSave(r.id)} className="text-sm px-3 py-1 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:opacity-90">儲存</button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">
                                                {r.type === 'hotel' ? '飯店' : r.type === 'restaurant' ? '餐廳' : r.type === 'attraction' ? '景點' : '其他'}
                                            </span>
                                            <h3 className="font-semibold">{r.name}</h3>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit(r)} className="text-xs text-muted-foreground cursor-pointer hover:opacity-70">編輯</button>
                                            <button onClick={() => handleDelete(r.id)} className="text-xs text-destructive cursor-pointer hover:opacity-70">刪除</button>
                                        </div>
                                    </div>
                                    {r.location && <p className="text-sm text-muted-foreground">地點：{r.location}</p>}
                                    {r.confirmation_code && <p className="text-sm text-muted-foreground">確認碼：{r.confirmation_code}</p>}
                                    {r.date && <p className="text-sm text-muted-foreground">{r.type === 'hotel' ? `入住：${r.date.slice(0, 10)}` : `日期：${r.date.slice(0, 10)}`}</p>}
                                    {r.end_date && <p className="text-sm text-muted-foreground">退房：{r.end_date.slice(0, 10)}</p>}
                                    {r.notes && <p className="text-sm text-muted-foreground">備註：{r.notes}</p>}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )

}

export default Reservations
