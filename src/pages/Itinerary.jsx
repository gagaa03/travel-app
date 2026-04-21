import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchTrip, fetchItinerary, createItineraryItem, updateItineraryItem, deleteItineraryItem } from '../services/api.js'
import { searchPlaces } from '../services/geoService.js'
import { RippleButton } from '@/components/ui/ripple-button'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Train, Bus, Car, Plane, Footprints, Plus, MapPin } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const CATEGORIES = [
    { value: 'food',          label: '餐飲',   color: '#b45309' },
    { value: 'attraction',    label: '景點',   color: '#0e7490' },
    { value: 'transport',     label: '交通',   color: '#71717a' },
    { value: 'shopping',      label: '購物',   color: '#592C63' },
    { value: 'accommodation', label: '住宿',   color: '#0f766e' },
    { value: 'other',         label: '其他',   color: '#a8a29e' },
]

const TRANSPORT_OPTIONS = [
    { value: 'walk',  label: '步行',       Icon: Footprints },
    { value: 'train', label: '地鐵/火車',   Icon: Train },
    { value: 'bus',   label: '巴士',       Icon: Bus },
    { value: 'car',   label: '計程車/租車', Icon: Car },
    { value: 'plane', label: '飛機',       Icon: Plane },
]

function getCategoryColor(category) {
    return CATEGORIES.find(c => c.value === category)?.color || '#a8a29e'
}

function parseLocation(loc) {
    if (!loc) return { name: '', lat: null, lon: null }
    try {
        const parsed = JSON.parse(loc)
        if (parsed.name) return parsed
    } catch { /* plain text */ }
    return { name: loc, lat: null, lon: null }
}

function createNumberedIcon(number, color) {
    return L.divIcon({
        html: `<div style="background:${color};width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:bold;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35)">${number}</div>`,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    })
}

function MapFitBounds({ positions }) {
    const map = useMap()
    useEffect(() => {
        if (positions.length > 1) {
            map.fitBounds(L.latLngBounds(positions), { padding: [40, 40] })
        } else if (positions.length === 1) {
            map.setView(positions[0], 15)
        }
    }, [positions, map])
    return null
}

function DayMap({ items }) {
    const [routes, setRoutes] = useState([])

    const locatedItems = items
        .map(item => {
            const loc = parseLocation(item.location)
            if (!loc.lat || !loc.lon) return null
            return { item, lat: loc.lat, lon: loc.lon }
        })
        .filter(Boolean)

    useEffect(() => {
        if (locatedItems.length < 2) { setRoutes([]); return }

        const ROUTE_COLORS = {
            walk:  '#16a34a',
            train: '#4f46e5',
            bus:   '#ea580c',
            car:   '#64748b',
            plane: '#0284c7',
        }

        async function fetchRoutes() {
            const results = []
            for (let i = 0; i < locatedItems.length - 1; i++) {
                const from = locatedItems[i]
                const to = locatedItems[i + 1]
                const method = from.item.transport_after?.method || 'walk'
                const color = ROUTE_COLORS[method] || ROUTE_COLORS.walk

                if (method === 'walk' || method === 'car') {
                    const profile = method === 'walk' ? 'foot' : 'driving'
                    try {
                        const res = await fetch(
                            `https://router.project-osrm.org/route/v1/${profile}/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson`
                        )
                        const data = await res.json()
                        if (data.code === 'Ok') {
                            const positions = data.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon])
                            results.push({ positions, dashed: false, color })
                            continue
                        }
                    } catch { /* fallback */ }
                }
                results.push({ positions: [[from.lat, from.lon], [to.lat, to.lon]], dashed: true, color })
            }
            setRoutes(results)
        }

        fetchRoutes()
    }, [items])

    if (locatedItems.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground text-center px-6">
                新增行程時加上地點，<br />這裡會自動顯示地圖路線
            </div>
        )
    }

    const allPositions = locatedItems.map(({ lat, lon }) => [lat, lon])

    return (
        <MapContainer
            center={allPositions[0]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapFitBounds positions={allPositions} />
            {locatedItems.map(({ item, lat, lon }, i) => (
                <Marker
                    key={item.id}
                    position={[lat, lon]}
                    icon={createNumberedIcon(i + 1, getCategoryColor(item.category || 'other'))}
                >
                    <Popup>
                        <strong>{item.title}</strong>
                        {item.location && <><br /><span style={{ fontSize: 12, color: '#6b7280' }}>{item.location}</span></>}
                    </Popup>
                </Marker>
            ))}
            {routes.map((route, i) => (
                <Polyline
                    key={i}
                    positions={route.positions}
                    color={route.color}
                    dashArray={route.dashed ? '6 8' : undefined}
                    weight={3}
                    opacity={0.75}
                />
            ))}
        </MapContainer>
    )
}

function LocationInput({ value, onChange, city }) {
    const [suggestions, setSuggestions] = useState([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const debounceRef = useRef(null)
    const wrapperRef = useRef(null)

    useEffect(() => {
        function handleClickOutside(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    function handleChange(e) {
        const val = e.target.value
        onChange(val)
        clearTimeout(debounceRef.current)
        if (!val.trim()) { setSuggestions([]); return }
        debounceRef.current = setTimeout(async () => {
            const results = await searchPlaces(val, city)
            setSuggestions(results)
            setShowSuggestions(true)
        }, 300)
    }

    const displayValue = parseLocation(value).name

    return (
        <div ref={wrapperRef} className="relative">
            <input
                value={displayValue}
                onChange={handleChange}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="地點（選填），e.g. 築地市場"
                className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm"
            />
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => {
                                onChange(JSON.stringify({ name: s.name, lat: s.lat, lon: s.lon }))
                                setShowSuggestions(false)
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors cursor-pointer"
                        >
                            <p className="font-medium">{s.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{s.full}</p>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

function TransportConnector({ item, onSave }) {
    const [editing, setEditing] = useState(false)
    const [form, setForm] = useState(item.transport_after || { method: 'walk', duration: '' })

    const transport = item.transport_after
    const Option = transport ? TRANSPORT_OPTIONS.find(o => o.value === transport.method) : null

    function handleSave() {
        onSave(item.id, form.duration ? form : null)
        setEditing(false)
    }

    return (
        <div className="flex gap-3">
            <div className="w-10 md:w-14 shrink-0" />
            <div className="w-4 flex flex-col items-center shrink-0">
                <div className="w-px flex-1 bg-border" />
            </div>
            <div className="flex-1 py-2">
                {editing ? (
                    <div className="flex items-center gap-2 flex-wrap">
                        <select
                            value={form.method}
                            onChange={e => setForm(prev => ({ ...prev, method: e.target.value }))}
                            className="border border-border rounded-lg px-2 py-1 bg-background text-xs"
                        >
                            {TRANSPORT_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                        <input
                            type="number"
                            value={form.duration}
                            onChange={e => setForm(prev => ({ ...prev, duration: e.target.value }))}
                            placeholder="分鐘"
                            className="border border-border rounded-lg px-2 py-1 bg-background text-xs w-20"
                        />
                        <button onClick={handleSave} className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:opacity-90">儲存</button>
                        {transport && <button onClick={() => { onSave(item.id, null); setEditing(false) }} className="text-xs px-2 py-1 border border-border rounded-lg cursor-pointer hover:opacity-80">移除</button>}
                        <button onClick={() => setEditing(false)} className="text-xs text-muted-foreground cursor-pointer hover:opacity-70">取消</button>
                    </div>
                ) : transport && Option ? (
                    <button
                        onClick={() => { setForm(transport); setEditing(true) }}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                        <Option.Icon size={12} />
                        <span>{Option.label} · {transport.duration} 分鐘</span>
                    </button>
                ) : (
                    <button
                        onClick={() => { setForm({ method: 'walk', duration: '' }); setEditing(true) }}
                        className="flex items-center gap-1 text-xs text-muted-foreground/30 hover:text-muted-foreground transition-colors cursor-pointer"
                    >
                        <Plus size={10} />
                        <span>交通</span>
                    </button>
                )}
            </div>
        </div>
    )
}

function ItineraryItem({ item, onDelete, onEdit, isFirst, isLast, city }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({
        title: item.title,
        time: item.time || '',
        notes: item.notes || '',
        category: item.category || 'other',
        location: item.location || '',
    })

    const style = { transform: CSS.Translate.toString(transform), transition }
    const dotColor = getCategoryColor(item.category || 'other')


    function handleSave() {
        onEdit(item.id, { ...editForm, transport_after: item.transport_after })
        setIsEditing(false)
    }

    return (
        <div ref={setNodeRef} style={style} className="flex gap-3 items-center">
            <div className="w-10 md:w-14 shrink-0 text-right">
                <span className="text-sm font-mono font-semibold text-primary">
                    {item.time || ''}
                </span>
            </div>

            <div className="w-4 flex flex-col items-center shrink-0 self-stretch">
                {isFirst
                    ? <div className="flex-1" />
                    : <div className="w-px flex-1 bg-border" />
                }
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                {isLast
                    ? <div className="flex-1" />
                    : <div className="w-px flex-1 bg-border" />
                }
            </div>

            <div className="flex-1 rounded-xl px-3 py-3 flex flex-col gap-2 group/item hover:bg-muted/50 transition-colors">
                {isEditing ? (
                    <>
                        <div className="flex gap-2">
                            <select
                                value={editForm.category}
                                onChange={e => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                                className="border border-border rounded-lg px-2 py-1.5 bg-background text-xs"
                            >
                                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                            <input
                                value={editForm.title}
                                onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="行程名稱"
                                className="flex-1 border border-border rounded-lg px-3 py-1.5 bg-background text-sm"
                            />
                        </div>
                        <input
                            type="time"
                            value={editForm.time}
                            onChange={e => setEditForm(prev => ({ ...prev, time: e.target.value }))}
                            className="border border-border rounded-lg px-3 py-1.5 bg-background text-sm"
                        />
                        <LocationInput
                            value={editForm.location}
                            onChange={val => setEditForm(prev => ({ ...prev, location: val }))}
                            city={city}
                        />
                        <input
                            value={editForm.notes}
                            onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="備註"
                            className="border border-border rounded-lg px-3 py-1.5 bg-background text-sm"
                        />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setIsEditing(false)} className="text-xs px-3 py-1 border border-border rounded-lg cursor-pointer hover:opacity-80">取消</button>
                            <button onClick={handleSave} className="text-xs px-3 py-1 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:opacity-90">儲存</button>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center gap-2">
                        <div className="flex-1">
                            <p className="font-medium">{item.title}</p>
                            {item.location && (
                                <div className="flex items-center gap-1 mt-0.5">
                                    <MapPin size={10} className="text-muted-foreground shrink-0" />
                                    <p className="text-xs text-muted-foreground">{parseLocation(item.location).name}</p>
                                </div>
                            )}
                            {item.notes && <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">⠿</button>
                            <button onClick={() => setIsEditing(true)} className="text-xs text-muted-foreground cursor-pointer hover:opacity-70">編輯</button>
                            <button onClick={() => onDelete(item.id)} className="text-xs text-destructive cursor-pointer hover:opacity-70">刪除</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function Itinerary() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [trip, setTrip] = useState(null)
    const [itinerary, setItinerary] = useState({})
    const [activeDay, setActiveDay] = useState(1)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ title: '', time: '', notes: '', category: 'other', location: '' })

    useEffect(() => {
        async function load() {
            const [tripData, items] = await Promise.all([
                fetchTrip(id),
                fetchItinerary(id),
            ])
            setTrip(tripData)
            const grouped = items.reduce((acc, item) => {
                if (!acc[item.day]) acc[item.day] = []
                acc[item.day].push(item)
                return acc
            }, {})
            setItinerary(grouped)
        }
        load()
    }, [id])

    const sensors = useSensors(useSensor(PointerSensor))

    if (!trip) return null

    const start = new Date(trip.start_date)
    const end = new Date(trip.end_date)
    const totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1
    const dayItems = itinerary[activeDay] || []

    async function handleAdd() {
        if (!form.title.trim()) return
        const newItem = await createItineraryItem(id, { ...form, day: activeDay })
        setItinerary(prev => ({
            ...prev,
            [activeDay]: [...(prev[activeDay] || []), newItem],
        }))
        setForm({ title: '', time: '', notes: '', category: 'other', location: '' })
        setShowForm(false)
    }

    async function handleDelete(itemId) {
        await deleteItineraryItem(id, itemId)
        setItinerary(prev => ({
            ...prev,
            [activeDay]: (prev[activeDay] || []).filter(i => i.id !== itemId),
        }))
    }

    async function handleEdit(itemId, updatedData) {
        const updated = await updateItineraryItem(id, itemId, { ...updatedData, day: activeDay })
        setItinerary(prev => ({
            ...prev,
            [activeDay]: (prev[activeDay] || []).map(i => i.id === itemId ? updated : i),
        }))
    }

    async function handleSaveTransport(itemId, transportData) {
        const item = dayItems.find(i => i.id === itemId)
        const updated = await updateItineraryItem(id, itemId, { ...item, day: activeDay, transport_after: transportData })
        setItinerary(prev => ({
            ...prev,
            [activeDay]: (prev[activeDay] || []).map(i => i.id === itemId ? updated : i),
        }))
    }

    async function handleDragEnd(event) {
        const { active, over } = event
        if (!over || active.id === over.id) return
        const oldIndex = dayItems.findIndex(i => i.id === active.id)
        const newIndex = dayItems.findIndex(i => i.id === over.id)
        const newOrder = arrayMove(dayItems, oldIndex, newIndex)
        setItinerary(prev => ({ ...prev, [activeDay]: newOrder }))
        await Promise.all(
            newOrder.map((item, idx) =>
                updateItineraryItem(id, item.id, { ...item, day: activeDay, sort_order: idx })
            )
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col gap-6">
                <div className="flex items-center gap-3">
                    <RippleButton onClick={() => navigate(`/trip/${id}`)} className="text-sm border-border">
                        ← 返回
                    </RippleButton>
                    <h1 className="text-3xl font-bold text-primary">{trip.city_display} · 行程表</h1>
                </div>

                <div className="overflow-x-auto pb-1 scrollbar-hide">
                    <div className="flex gap-2 w-max">
                        {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
                            const date = new Date(start)
                            date.setDate(date.getDate() + (day - 1))
                            const label = `${date.getMonth() + 1}/${date.getDate()}`
                            return (
                                <button
                                    key={day}
                                    onClick={() => setActiveDay(day)}
                                    className={`px-4 py-1.5 rounded-full text-sm cursor-pointer transition-colors whitespace-nowrap ${
                                        activeDay === day
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-secondary text-secondary-foreground hover:opacity-80'
                                    }`}
                                >
                                    Day {day} · {label}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
                    <div className="flex flex-col gap-4">
                        <div className="bg-card rounded-2xl p-6 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <h2 className="font-bold text-primary">新增行程</h2>
                                <button
                                    onClick={() => setShowForm(prev => !prev)}
                                    className="text-sm px-3 py-1 border border-border rounded-lg cursor-pointer hover:opacity-90"
                                >
                                    {showForm ? '收起' : '+ 新增'}
                                </button>
                            </div>
                            {showForm && (
                                <>
                                    <div className="flex gap-2">
                                        <select
                                            value={form.category}
                                            onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                                            className="border border-border rounded-lg px-2 py-2 bg-background text-sm"
                                        >
                                            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                        </select>
                                        <input
                                            value={form.title}
                                            onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                                            placeholder="行程名稱，e.g. 參觀東京鐵塔"
                                            className="flex-1 border border-border rounded-lg px-3 py-2 bg-background text-sm"
                                        />
                                    </div>
                                    <input
                                        type="time"
                                        value={form.time}
                                        onChange={e => setForm(prev => ({ ...prev, time: e.target.value }))}
                                        className="border border-border rounded-lg px-3 py-2 bg-background text-sm"
                                    />
                                    <LocationInput
                                        value={form.location}
                                        onChange={val => setForm(prev => ({ ...prev, location: val }))}
                                        city={trip.city}
                                    />
                                    <input
                                        value={form.notes}
                                        onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="備註"
                                        className="border border-border rounded-lg px-3 py-2 bg-background text-sm"
                                    />
                                    <button
                                        onClick={handleAdd}
                                        className="bg-primary text-primary-foreground rounded-lg py-2 font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                                    >
                                        新增
                                    </button>
                                </>
                            )}
                        </div>

                        <div className="flex flex-col">
                            {dayItems.length === 0 && (
                                <p className="text-center py-12 text-muted-foreground text-sm">還沒有行程，點右上角新增第一筆吧！</p>
                            )}
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={dayItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                    {dayItems.map((item, index) => (
                                        <div key={item.id}>
                                            <ItineraryItem
                                                item={item}
                                                isFirst={index === 0}
                                                isLast={index === dayItems.length - 1}
                                                onDelete={handleDelete}
                                                onEdit={handleEdit}
                                                city={trip.city}
                                            />
                                            {index < dayItems.length - 1 && (
                                                <TransportConnector
                                                    item={item}
                                                    onSave={handleSaveTransport}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </SortableContext>
                            </DndContext>
                        </div>
                    </div>

                    <div className="sticky top-6 h-[300px] lg:h-[600px] rounded-2xl overflow-hidden border border-border bg-card">
                        <DayMap
                            key={dayItems.map(i => `${i.id}|${i.location || ''}|${JSON.stringify(i.transport_after)}`).join(',')}
                            items={dayItems}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Itinerary
