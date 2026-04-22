import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchTrip, deleteTrip, updateTrip } from "../services/api.js";

import { getCountry } from "../services/countryService";
import { getExchangeRate } from "../services/exchangeService";
import { getPhoto } from "../services/unsplashService";

import { BlurFade } from "../components/ui/blur-fade";
import { Skeleton } from "@/components/ui/skeleton";

import { useWeather } from '../hooks/useWeather';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { getCoordinates } from '../services/geoService';
import { RippleButton } from "../components/ui/ripple-button";

import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { ChecklistItem } from '../components/ChecklistItem'
import { WeatherBackground } from '../components/WeatherBackground';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';



function TripDetail() {
    const {id} =useParams();
    const navigate = useNavigate();

    const { isDark, toggleTheme } = useTheme();
    const [trip, setTrip] = useState(null);
    const [moreMenuOpen, setMoreMenuOpen] = useState(false);
    const [converterAmount, setConverterAmount] = useState('')
    const moreMenuRef = useRef(null);
    const [tripStatus, setTripStatus] = useState('');
    const [country, setCountry] = useState(null);
    const [exchange, setExchange] = useState(null);
    const [photo, setPhoto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [coords, setCoords] = useState(null);
    const [checklist, setChecklist] = useState([]);
    const [newItem, setNewItem] = useState({ name: '', category: 'attraction', notes: '' });
    const [transport, setTransport] = useState({
        outbound: { type: 'flight', flightNumber: '', from: '', to: '', departureTime: '', arrivalTime: '' },
        inbound: { type: 'flight', flightNumber: '', from: '', to: '', departureTime: '', arrivalTime: '' },
    })
    const [editingTransport, setEditingTransport] = useState(false)

    // 從後端載入旅程資料，並初始化所有 state
    useEffect(() => {
        async function loadTrip() {
            const data = await fetchTrip(id)
            setTrip(data)
            setTripStatus(data.status || 'planning')
            setChecklist(data.checklist || [])
            if (data.outbound && Object.keys(data.outbound).length > 0) {
                setTransport({ outbound: data.outbound, inbound: data.inbound })
            }
        }
        loadTrip()
    }, [id])

    const { weather, loading: weatherLoading, weatherError } = useWeather(trip?.city);

    async function handleDelete() {
        await deleteTrip(id);
        navigate('/');
    }

    async function handleStatusChange(e) {
        const newStatus = e.target.value
        setTripStatus(newStatus)
        await updateTrip(id, { ...trip, cityDisplay: trip.city_display, startDate: trip.start_date, endDate: trip.end_date, status: newStatus, checklist, outbound: transport.outbound, inbound: transport.inbound })
    }

    async function changeStatus(newStatus) {
        setTripStatus(newStatus)
        setMoreMenuOpen(false)
        await updateTrip(id, { ...trip, cityDisplay: trip.city_display, startDate: trip.start_date, endDate: trip.end_date, status: newStatus, checklist, outbound: transport.outbound, inbound: transport.inbound })
    }

    async function handleSaveTransport() {
        await updateTrip(id, { ...trip, cityDisplay: trip.city_display, startDate: trip.start_date, endDate: trip.end_date, checklist, outbound: transport.outbound, inbound: transport.inbound })
        setEditingTransport(false)
    }

    async function handleAddItem(e) {
        e.preventDefault();
        if (!newItem.name.trim()) return;
        const newChecklistItem = { id: Date.now(), done: false, ...newItem }
        const newChecklist = [...checklist, newChecklistItem]
        setChecklist(newChecklist)
        setNewItem({ name: '', category: 'attraction', notes: '' });
        await updateTrip(id, { ...trip, cityDisplay: trip.city_display, startDate: trip.start_date, endDate: trip.end_date, checklist: newChecklist, outbound: transport.outbound, inbound: transport.inbound })
    }

    async function handleDeleteItem(itemId) {
        const newChecklist = checklist.filter(item => item.id !== itemId)
        setChecklist(newChecklist)
        await updateTrip(id, { ...trip, cityDisplay: trip.city_display, startDate: trip.start_date, endDate: trip.end_date, checklist: newChecklist, outbound: transport.outbound, inbound: transport.inbound })
    }

    async function handleToggleItem(itemId) {
        const newChecklist = checklist.map(item => item.id === itemId ? { ...item, done: !item.done } : item)
        setChecklist(newChecklist)
        await updateTrip(id, { ...trip, cityDisplay: trip.city_display, startDate: trip.start_date, endDate: trip.end_date, checklist: newChecklist, outbound: transport.outbound, inbound: transport.inbound })
    }

    async function handleEditItem(itemId, updatedData) {
        const newChecklist = checklist.map(item => item.id === itemId ? { ...item, ...updatedData } : item)
        setChecklist(newChecklist)
        await updateTrip(id, { ...trip, cityDisplay: trip.city_display, startDate: trip.start_date, endDate: trip.end_date, checklist: newChecklist, outbound: transport.outbound, inbound: transport.inbound })
    }

    async function handleDragEnd(event) {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = checklist.findIndex(item => item.id === active.id);
            const newIndex = checklist.findIndex(item => item.id === over.id);
            const newChecklist = arrayMove(checklist, oldIndex, newIndex);
            setChecklist(newChecklist);
            await updateTrip(id, { ...trip, cityDisplay: trip.city_display, startDate: trip.start_date, endDate: trip.end_date, checklist: newChecklist, outbound: transport.outbound, inbound: transport.inbound })
        }
    }

    useEffect(() => {
        if (!trip) return
        async function fetchData() {
            const [countryResult, exchangeResult, photoResult] = await Promise.allSettled([
                getCountry(trip.country),
                getExchangeRate(trip.currency),
                getPhoto(trip.city),
            ]);

            setCountry(countryResult.status === 'fulfilled' ? countryResult.value : null);
            setExchange(exchangeResult.status === 'fulfilled' ? exchangeResult.value : null);
            setPhoto(photoResult.status === 'fulfilled' ? photoResult.value : null);
            getCoordinates(trip.city).then(data => setCoords(data)).catch(() => {});
            setLoading(false);
        }

        fetchData();
    },[trip])

    useEffect(() => {
        function handleClickOutside(e) {
            if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
                setMoreMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!trip || loading || weatherLoading) return (
        <div className="min-h-screen bg-background">
            <div className="max-w-6xl mx-auto p-4 md:p-8 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-20 rounded-xl" />
                        <Skeleton className="h-9 w-36" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <Skeleton className="h-9 w-24 rounded-lg" />
                        <Skeleton className="h-9 w-9 rounded-lg" />
                    </div>
                </div>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-80 w-full rounded-2xl" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 flex flex-col gap-6">
                        <Skeleton className="h-40 w-full rounded-2xl" />
                        <Skeleton className="h-64 w-full rounded-2xl" />
                    </div>
                    <div className="flex flex-col gap-6">
                        <Skeleton className="h-32 w-full rounded-2xl" />
                        <Skeleton className="h-48 w-full rounded-2xl" />
                        <Skeleton className="h-40 w-full rounded-2xl" />
                    </div>
                </div>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <div className="bg-destructive/10 border border-destructive rounded-xl p-8 flex flex-col items-center gap-3 max-w-sm text-center">
                <p className="text-destructive font-semibold text-lg">⚠️ {error}</p>
                <p className="text-muted-foreground text-sm">請確認網路連線或是稍後再試</p>
                <button
                    onClick={() => navigate('/')}
                    className="mt-2 px-4 py-2 rounded-lg bg-destructive text-white text-sm hover:opacity-90 transition-opacity cursor-pointer"
                >
                    ←
                </button>
            </div>
        </div>
    );


    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-6xl mx-auto p-8 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <RippleButton onClick={() => navigate('/')} className="text-sm border-border">
                            ← 返回
                        </RippleButton>
                        <div className="flex items-center gap-2 relative">
                        <button
                            onClick={toggleTheme}
                            className="p-2 px-3 border border-border rounded-full hover:bg-muted cursor-pointer transition-colors"
                        >
                            <span key={String(isDark)} style={{ display: 'block', animation: 'icon-swap 0.3s ease-out' }}>
                                {isDark ? <Sun size={16} /> : <Moon size={16} />}
                            </span>
                        </button>
                        <select
                            value={tripStatus}
                            onChange={handleStatusChange}
                            className="hidden md:block border border-border rounded-lg px-3 py-2 bg-background text-sm cursor-pointer"
                        >
                            <option value="planning">計畫中</option>
                            <option value="ongoing">進行中</option>
                            <option value="completed">已完成</option>
                        </select>
                        <div className="relative" ref={moreMenuRef}>
                            <button
                                onClick={() => setMoreMenuOpen(prev => !prev)}
                                className="cursor-pointer border border-border rounded-lg px-3 py-2 text-sm hover:opacity-90 transition-opacity"
                            >
                                ⋯
                            </button>
                            {moreMenuOpen && (
                                <div className="absolute right-0 top-10 bg-card border border-border rounded-xl shadow-lg z-10 flex flex-col overflow-hidden min-w-32">
                                    <div className="md:hidden border-b border-border">
                                        <p className="px-4 pt-3 pb-1 text-xs text-muted-foreground">狀態</p>
                                        {[['planning','計畫中'],['ongoing','進行中'],['completed','已完成']].map(([val, label]) => (
                                            <button key={val} onClick={() => changeStatus(val)} className={`w-full px-4 py-2 text-sm text-left hover:bg-muted cursor-pointer ${tripStatus === val ? 'font-semibold text-primary' : ''}`}>{label}</button>
                                        ))}
                                    </div>
                                    <button onClick={() => { navigate(`/trip/${id}/edit`); setMoreMenuOpen(false) }} className="px-4 py-3 text-sm text-left hover:bg-muted cursor-pointer">編輯旅程</button>
                                    <button onClick={() => { navigate(`/trip/${id}/itinerary`); setMoreMenuOpen(false) }} className="px-4 py-3 text-sm text-left hover:bg-muted cursor-pointer">行程表</button>
                                    <button onClick={() => { navigate(`/trip/${id}/reservations`); setMoreMenuOpen(false) }} className="px-4 py-3 text-sm text-left hover:bg-muted cursor-pointer">訂位資訊</button>
                                    <button onClick={() => { navigate(`/trip/${id}/expenses`); setMoreMenuOpen(false) }} className="px-4 py-3 text-sm text-left hover:bg-muted cursor-pointer">消費紀錄</button>
                                    <button onClick={() => { handleDelete(); setMoreMenuOpen(false) }} className="px-4 py-3 text-sm text-left text-destructive hover:bg-muted cursor-pointer">刪除旅程</button>
                                </div>
                            )}
                        </div>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-primary mt-5">{trip.city_display}</h1>
                </div>

                {photo && (
                    <BlurFade delay={0.1}>
                        <div className="relative w-full h-80 rounded-2xl overflow-hidden">
                            <img
                                src={photo.urls.regular}
                                alt={photo.alt_description}
                                className="w-full h-full object-cover"
                            />
                            <p className="absolute bottom-2 right-3 text-white text-xs opacity-70">
                                Photo by <a href={photo.user.links.html} target="_blank">{photo.user.name}</a> on Unsplash
                            </p>
                        </div>
                    </BlurFade>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* 左欄：交通 + 清單 */}
                    <div className="md:col-span-2 flex flex-col gap-6 min-h-0">

                        <BlurFade delay={0.3}>
                            <div className="bg-card rounded-2xl p-6 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="font-bold text-lg text-primary">交通資訊</h2>
                                    {editingTransport ? (
                                        <button onClick={handleSaveTransport} className="text-sm px-3 py-1 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:opacity-90">儲存</button>
                                    ) : (
                                        <button onClick={() => setEditingTransport(true)} className="text-sm px-3 py-1 border border-border rounded-lg cursor-pointer hover:opacity-90">編輯</button>
                                    )}
                                </div>
                                {editingTransport ? (
                                    <div className="flex flex-col gap-6">
                                        {['outbound', 'inbound'].map(direction => (
                                            <div key={direction} className="flex flex-col gap-3">
                                                <h3 className="font-medium text-sm text-muted-foreground border-b border-border pb-1">{direction === 'outbound' ? '去程' : '回程'}</h3>
                                                <select
                                                    value={transport[direction].type}
                                                    onChange={e => setTransport(prev => ({ ...prev, [direction]: { ...prev[direction], type: e.target.value }}))}
                                                    className="border border-border rounded-lg px-3 py-2 bg-background text-sm"
                                                >
                                                    <option value="flight">飛機</option>
                                                    <option value="train">火車</option>
                                                    <option value="other">其他</option>
                                                </select>
                                                <input placeholder="班次號碼" value={transport[direction].flightNumber} onChange={e => setTransport(prev => ({ ...prev, [direction]: { ...prev[direction], flightNumber: e.target.value }}))} className="border border-border rounded-lg px-3 py-2 bg-background text-sm" />
                                                <div className="flex gap-2">
                                                    <input placeholder="出發地" value={transport[direction].from} onChange={e => setTransport(prev => ({ ...prev, [direction]: { ...prev[direction], from: e.target.value }}))} className="border border-border rounded-lg px-3 py-2 bg-background text-sm flex-1" />
                                                    <input placeholder="目的地" value={transport[direction].to} onChange={e => setTransport(prev => ({ ...prev, [direction]: { ...prev[direction], to: e.target.value }}))} className="border border-border rounded-lg px-3 py-2 bg-background text-sm flex-1" />
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className="flex flex-col gap-1 flex-1">
                                                        <label className="text-xs text-muted-foreground">出發時間</label>
                                                        <input type="datetime-local" value={transport[direction].departureTime} onChange={e => setTransport(prev => ({ ...prev, [direction]: { ...prev[direction], departureTime: e.target.value }}))} className="border border-border rounded-lg px-3 py-2 bg-background text-sm" />
                                                    </div>
                                                    <div className="flex flex-col gap-1 flex-1">
                                                        <label className="text-xs text-muted-foreground">抵達時間</label>
                                                        <input type="datetime-local" value={transport[direction].arrivalTime} onChange={e => setTransport(prev => ({ ...prev, [direction]: { ...prev[direction], arrivalTime: e.target.value }}))} className="border border-border rounded-lg px-3 py-2 bg-background text-sm" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        {['outbound', 'inbound'].map(direction => (
                                            <div key={direction} className="flex flex-col gap-2">
                                                <h3 className="font-medium text-sm text-muted-foreground">{direction === 'outbound' ? '去程' : '回程'}</h3>
                                                {transport[direction].flightNumber ? (
                                                    <>
                                                        <p className="text-sm"><span className="text-muted-foreground">班次：</span>{transport[direction].flightNumber}</p>
                                                        <p className="text-sm"><span className="text-muted-foreground">路線：</span>{transport[direction].from} → {transport[direction].to}</p>
                                                        <p className="text-sm"><span className="text-muted-foreground">出發：</span>{transport[direction].departureTime?.replace('T', ' ')}</p>
                                                        <p className="text-sm"><span className="text-muted-foreground">抵達：</span>{transport[direction].arrivalTime?.replace('T', ' ')}</p>
                                                    </>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground">尚未填寫</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </BlurFade>

                        {/* 手機版：天氣 + 匯率插在願望清單前 */}
                        <div className="md:hidden flex flex-col gap-6">
                            <BlurFade delay={0.4}>
                                <div className="bg-card rounded-2xl p-6 flex flex-col gap-3 relative overflow-hidden">
                                    {!weatherError && weather && <WeatherBackground conditionId={weather.weather[0].id} />}
                                    <h2 className="font-bold text-lg text-primary relative z-10">天氣</h2>
                                    {weatherError || !weather ? (
                                        <p className="text-sm text-muted-foreground">天氣資料無法載入</p>
                                    ) : (
                                        <div className="flex items-center gap-4 relative z-10">
                                            <p className="text-3xl font-bold">{weather.main.temp}°C</p>
                                            <div className="flex flex-col gap-1 text-sm">
                                                <p className="font-medium capitalize">{weather.weather[0].description}</p>
                                                <p className="text-muted-foreground">濕度 {weather.main.humidity}%</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </BlurFade>
                            <BlurFade delay={0.5}>
                                <div className="bg-card rounded-2xl p-6 flex flex-col gap-4">
                                    <h2 className="font-bold text-lg text-primary">匯率資訊</h2>
                                    {!exchange ? (
                                        <p className="text-sm text-muted-foreground">匯率資料無法載入</p>
                                    ) : (
                                        <>
                                            <div className="flex flex-col gap-3">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">1 {trip.currency} → 台幣</p>
                                                    <p className="text-2xl font-semibold">{exchange.rates.TWD.toFixed(2)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">1 TWD → {trip.currency}</p>
                                                    <p className="text-2xl font-semibold">{(1 / exchange.rates.TWD).toFixed(4)}</p>
                                                </div>
                                            </div>
                                            <div className="border-t border-border pt-3 flex flex-col gap-2">
                                                <input type="number" value={converterAmount} onChange={e => setConverterAmount(e.target.value)} placeholder={`輸入 ${trip.currency} 金額`} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                                                <p className="text-sm font-medium text-right">
                                                    {converterAmount ? `≈ ${Math.round(converterAmount * exchange.rates.TWD).toLocaleString()} TWD` : <span className="text-muted-foreground">輸入金額換算</span>}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </BlurFade>
                        </div>

                        <BlurFade delay={0.5} className="flex-1 flex flex-col">
                            <div className="bg-card rounded-2xl p-4 md:p-6 flex flex-col gap-4 flex-1">
                                <h2 className="font-bold text-lg text-primary">願望清單</h2>
                                <form onSubmit={handleAddItem} className="flex flex-col gap-2">
                                    <div className="flex gap-2">
                                        <select
                                            value={newItem.category}
                                            onChange={e => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                                            className="border border-border rounded-lg px-3 py-2 text-sm bg-background shrink-0"
                                        >
                                            <option value="attraction">景點</option>
                                            <option value="restaurant">餐廳</option>
                                            <option value="shopping">購物</option>
                                            <option value="other">其他</option>
                                        </select>
                                        <input
                                            type="text"
                                            value={newItem.name}
                                            onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="景點名稱"
                                            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newItem.notes}
                                            onChange={e => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                                            placeholder="備註（地址、開放時間...）"
                                            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background"
                                        />
                                        <RippleButton type="submit" className="bg-primary text-primary-foreground border-primary text-sm shrink-0 whitespace-nowrap">
                                            新增
                                        </RippleButton>
                                    </div>
                                </form>
                                {checklist.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">還沒有任何景點，新增第一筆吧！</p>
                                )}
                                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <SortableContext items={checklist.map(item => item.id)} strategy={verticalListSortingStrategy}>
                                        <div className="flex flex-col gap-2">
                                            {checklist.map(item => (
                                                <ChecklistItem
                                                    key={item.id}
                                                    item={item}
                                                    onToggle={handleToggleItem}
                                                    onDelete={handleDeleteItem}
                                                    onEdit={handleEditItem}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </div>
                        </BlurFade>

                    </div>

                    {/* 右欄：天氣 + 匯率 + 國家 */}
                    <div className="flex flex-col gap-6">

                        <BlurFade delay={0.4} className="hidden md:block">
                            <div className="bg-card rounded-2xl p-6 flex flex-col gap-3 relative overflow-hidden">
                                {!weatherError && weather && (
                                    <WeatherBackground conditionId={weather.weather[0].id} />
                                )}
                                <h2 className="font-bold text-lg text-primary relative z-10">天氣</h2>
                                {weatherError || !weather ? (
                                    <p className="text-sm text-muted-foreground">天氣資料無法載入</p>
                                ) : (
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="flex-shrink-0">
                                            <p className="text-3xl font-bold">{weather.main.temp}°C</p>
                                        </div>
                                        <div className="flex flex-col gap-1 text-sm">
                                            <p className="font-medium capitalize">{weather.weather[0].description}</p>
                                            <p className="text-muted-foreground">濕度 {weather.main.humidity}%</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </BlurFade>

                        <BlurFade delay={0.5} className="hidden md:block">
                            <div className="bg-card rounded-2xl p-6 flex flex-col gap-4">
                                <h2 className="font-bold text-lg text-primary">匯率資訊</h2>
                                {!exchange ? (
                                    <p className="text-sm text-muted-foreground">匯率資料無法載入</p>
                                ) : (
                                    <>
                                        <div className="flex flex-col gap-3">
                                            <div>
                                                <p className="text-xs text-muted-foreground">1 {trip.currency} → 台幣</p>
                                                <p className="text-2xl font-semibold">{exchange.rates.TWD.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">1 TWD → {trip.currency}</p>
                                                <p className="text-2xl font-semibold">{(1 / exchange.rates.TWD).toFixed(4)}</p>
                                            </div>                                            
                                        </div>
                                        <div className="border-t border-border pt-3 flex flex-col gap-2">
                                            <input
                                                type="number"
                                                value={converterAmount}
                                                onChange={e => setConverterAmount(e.target.value)}
                                                placeholder={`輸入 ${trip.currency} 金額`}
                                                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                                            />
                                            <p className="text-sm font-medium text-right">
                                                {converterAmount
                                                    ? `≈ ${Math.round(converterAmount * exchange.rates.TWD).toLocaleString()} TWD`
                                                    : <span className="text-muted-foreground">輸入金額換算</span>
                                                }
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </BlurFade>

                        <BlurFade delay={0.6}>
                            <div className="bg-card rounded-2xl p-6 flex flex-col gap-3 relative overflow-hidden">
                                {country && (
                                    <>
                                        <img src={country.flags.svg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-10" />
                                        <div className="absolute inset-0 bg-gradient-to-br from-card/80 to-card/50" />
                                    </>
                                )}
                                <h2 className="font-bold text-lg text-primary relative z-10">國家資訊</h2>
                                {!country ? (
                                    <div className="relative z-10">
                                        <p className="text-sm text-muted-foreground mb-2">國家資料無法載入，請確認國家名稱是否正確。</p>
                                        <button onClick={() => navigate(`/trip/${id}/edit`)} className="text-sm px-3 py-1 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:opacity-90">
                                            編輯旅程
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3 relative z-10">
                                        <div>
                                            <p className="text-xs text-muted-foreground">國家</p>
                                            <p className="font-medium">{country.name.official}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">首都</p>
                                            <p className="font-medium">{country.capital?.[0] ?? '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">人口</p>
                                            <p className="font-medium">{country.population.toLocaleString()}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </BlurFade>

                    </div>

                </div>

                {coords && (
                    <BlurFade delay={0.7}>
                        <div className="bg-card rounded-2xl p-6 flex flex-col gap-4">
                            <h2 className="font-bold text-lg text-primary">地圖位置</h2>
                            <div className="rounded-xl overflow-hidden h-64">
                                <MapContainer
                                    center={[coords.lat, coords.lon]}
                                    zoom={12}
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; OpenStreetMap contributors'
                                    />
                                    <Marker position={[coords.lat, coords.lon]}>
                                        <Popup>{trip.city_display}</Popup>
                                    </Marker>
                                </MapContainer>
                            </div>
                        </div>
                    </BlurFade>
                )}
            </div>
        </div>
    )
}



export default TripDetail;