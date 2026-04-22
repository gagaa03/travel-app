import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchTrip, fetchExpenses, createExpense, updateExpense, deleteExpense } from '../services/api.js'
import { RippleButton } from '@/components/ui/ripple-button'
import { Skeleton } from '@/components/ui/skeleton'

const CATEGORIES = [
    { value: 'food', label: '餐飲' },
    { value: 'transport', label: '交通' },
    { value: 'accommodation', label: '住宿' },
    { value: 'shopping', label: '購物' },
    { value: 'attraction', label: '景點' },
    { value: 'other', label: '其他' },
]

function Expenses() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [trip, setTrip] = useState(null)
    const [expenses, setExpenses] = useState([])
    const [showForm, setShowForm] = useState(false)
    const [filterCategory, setFilterCategory] = useState('all')
    const [editingId, setEditingId] = useState(null)
    const [editForm, setEditForm] = useState({})
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState({
        name: '',
        amount: '',
        category: 'food',
        date: '',
        notes: '',
    })

    useEffect(() => {
        async function load() {
            const [tripResult, expensesResult] = await Promise.allSettled([
                fetchTrip(id),
                fetchExpenses(id),
            ])
            if (tripResult.status === 'fulfilled') setTrip(tripResult.value)
            if (expensesResult.status === 'fulfilled') setExpenses(expensesResult.value)
            setLoading(false)
        }
        load()
    }, [id])

    const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
    const budget = Number(trip?.budget) || 0
    const percentage = budget > 0 ? Math.min(Math.round((totalSpent / budget) * 100), 100) : 0

    async function handleSubmit(e) {
        e.preventDefault()
        if (!form.name.trim() || !form.amount) return
        if (Number(form.amount) <= 0) { alert('金額必須大於 0'); return }
        try {
            const newExpense = await createExpense(id, form)
            setExpenses(prev => [...prev, newExpense])
            setForm({ name: '', amount: '', category: 'food', date: '', notes: '' })
            setShowForm(false)
        } catch { alert('新增失敗，請稍後再試') }
    }

    function handleEdit(expense) {
        setEditingId(expense.id)
        setEditForm({
            name: expense.name,
            amount: expense.amount,
            category: expense.category,
            date: expense.date ? expense.date.slice(0, 10) : '',
            notes: expense.notes,
        })
    }

    async function handleSave(expenseId) {
        try {
            const updated = await updateExpense(id, expenseId, editForm)
            setExpenses(prev => prev.map(e => e.id === expenseId ? updated : e))
            setEditingId(null)
        } catch { alert('儲存失敗，請稍後再試') }
    }

    async function handleDelete(expenseId) {
        try {
            await deleteExpense(id, expenseId)
            setExpenses(prev => prev.filter(e => e.id !== expenseId))
        } catch { alert('刪除失敗，請稍後再試') }
    }

    const filteredExpenses = expenses.filter(e =>
        filterCategory === 'all' || e.category === filterCategory
    )

    if (loading) return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto p-4 md:p-8 flex flex-col gap-6">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-20 rounded-xl" />
                    <Skeleton className="h-8 w-48" />
                </div>
                <Skeleton className="h-40 w-full rounded-2xl" />
                <Skeleton className="h-64 w-full rounded-2xl" />
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
                    <h1 className="text-xl md:text-3xl font-bold text-primary">{trip.city_display} · 花費記錄</h1>
                </div>

                <div className="bg-card rounded-2xl p-6 flex flex-col gap-4">
                    <h2 className="font-bold text-lg text-primary">預算概覽</h2>
                    {budget === 0 ? (
                        <p className="text-sm text-muted-foreground">尚未設定預算，請至編輯旅程新增預算</p>
                    ) : (
                        <>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">已花費</span>
                                <span className="font-semibold">{totalSpent.toLocaleString()} {trip.currency}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">總預算</span>
                                <span className="font-semibold">{budget.toLocaleString()} {trip.currency}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">剩餘</span>
                                <span className={`font-semibold ${budget - totalSpent < 0 ? 'text-destructive' : 'text-green-500'}`}>
                                    {(budget - totalSpent).toLocaleString()} {trip.currency}
                                </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                                <div
                                    className={`h-3 rounded-full transition-all duration-500 ${percentage >= 100 ? 'bg-destructive' : percentage >= 80 ? 'bg-yellow-400' : 'bg-primary'}`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground text-right">{percentage}% 已使用</p>
                        </>
                    )}
                </div>

                <div className="bg-card rounded-2xl p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-lg text-primary">新增花費</h2>
                        <button
                            type="button"
                            onClick={() => setShowForm(prev => !prev)}
                            className="text-sm px-3 py-1 border border-border rounded-lg cursor-pointer hover:opacity-90"
                        >
                            {showForm ? '收起' : '+ 新增'}
                        </button>
                    </div>
                    {showForm && (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-muted-foreground">名稱</label>
                                <input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. 築地市場午餐" className="border border-border rounded-lg px-3 py-2 bg-background text-sm" />
                            </div>
                            <div className="flex gap-2">
                                <div className="flex flex-col gap-1 flex-1">
                                    <label className="text-sm text-muted-foreground">金額（{trip.currency}）</label>
                                    <input type="number" value={form.amount} onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))} placeholder="e.g. 1200" className="border border-border rounded-lg px-3 py-2 bg-background text-sm" />
                                </div>
                                <div className="flex flex-col gap-1 flex-1">
                                    <label className="text-sm text-muted-foreground">分類</label>
                                    <select value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))} className="border border-border rounded-lg px-3 py-2 bg-background text-sm">
                                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-muted-foreground">日期</label>
                                <input type="date" value={form.date} onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))} className="border border-border rounded-lg px-3 py-2 bg-background text-sm" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-muted-foreground">備註</label>
                                <input value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="選填" className="border border-border rounded-lg px-3 py-2 bg-background text-sm" />
                            </div>
                            <button type="submit" className="bg-primary text-primary-foreground rounded-lg py-2 font-semibold hover:opacity-90 transition-opacity cursor-pointer">新增</button>
                        </form>
                    )}
                </div>

                <div className="overflow-x-auto pb-1 scrollbar-hide">
                <div className="flex gap-2 w-max">
                    {['all', ...CATEGORIES.map(c => c.value)].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={`text-sm px-3 py-1 rounded-full cursor-pointer transition-colors ${filterCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:opacity-80'}`}
                        >
                            {cat === 'all' ? '全部' : CATEGORIES.find(c => c.value === cat)?.label}
                        </button>
                    ))}
                </div>
                </div>

                <div className="flex flex-col gap-3">
                    {filteredExpenses.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground text-sm">
                            <p>還沒有花費記錄</p>
                        </div>
                    ) : (
                        filteredExpenses.map(e => (
                            <div key={e.id} className="bg-card rounded-2xl p-4 flex flex-col gap-3">
                                {editingId === e.id ? (
                                    <>
                                        <div className="flex gap-2">
                                            <input value={editForm.name} onChange={ev => setEditForm(prev => ({ ...prev, name: ev.target.value }))} className="flex-1 border border-border rounded-lg px-3 py-1.5 bg-background text-sm" />
                                            <input type="number" value={editForm.amount} onChange={ev => setEditForm(prev => ({ ...prev, amount: ev.target.value }))} className="w-28 border border-border rounded-lg px-3 py-1.5 bg-background text-sm" />
                                        </div>
                                        <div className="flex gap-2">
                                            <select value={editForm.category} onChange={ev => setEditForm(prev => ({ ...prev, category: ev.target.value }))} className="flex-1 border border-border rounded-lg px-3 py-1.5 bg-background text-sm">
                                                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                            </select>
                                            <input type="date" value={editForm.date} onChange={ev => setEditForm(prev => ({ ...prev, date: ev.target.value }))} className="flex-1 border border-border rounded-lg px-3 py-1.5 bg-background text-sm" />
                                        </div>
                                        <input value={editForm.notes || ''} onChange={ev => setEditForm(prev => ({ ...prev, notes: ev.target.value }))} placeholder="備註（選填）" className="border border-border rounded-lg px-3 py-1.5 bg-background text-sm" />
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => setEditingId(null)} className="text-sm px-3 py-1 border border-border rounded-lg cursor-pointer hover:opacity-80">取消</button>
                                            <button onClick={() => handleSave(e.id)} className="text-sm px-3 py-1 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:opacity-90">儲存</button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground shrink-0">
                                                    {CATEGORIES.find(c => c.value === e.category)?.label}
                                                </span>
                                                <p className="font-medium">{e.name}</p>
                                            </div>
                                            <p className="font-semibold text-sm">{Number(e.amount).toLocaleString()} {trip.currency}</p>
                                            {e.date && <p className="text-xs text-muted-foreground">{e.date.slice(0, 10)}</p>}
                                            {e.notes && <p className="text-xs text-muted-foreground">{e.notes}</p>}
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <button onClick={() => handleEdit(e)} className="text-xs text-muted-foreground cursor-pointer hover:opacity-70">編輯</button>
                                            <button onClick={() => handleDelete(e.id)} className="text-xs text-destructive cursor-pointer hover:opacity-70">刪除</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    )
}

export default Expenses
