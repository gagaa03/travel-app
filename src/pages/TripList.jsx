import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTrips, deleteTrip as deleteTripAPI } from '../services/api.js';

import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { BentoGrid } from '@/components/ui/bento-grid';
import { NumberTicker } from '@/components/ui/number-ticker';
import { Plane, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

import { TripCard } from '../components/TripCard';
import { useTheme } from '../context/ThemeContext';


function TripList() {
    const navigate = useNavigate();
    const [trips, setTrips] = useState([]);
    const [sortBy, setSortBy] = useState('createdAt');
    const { isDark, toggleTheme } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');


    const totalTrips = trips.length;
    const completedTrips = trips.filter( t => t.status === 'completed').length;
    const uniqueCountries = new Set(trips.map(t => t.country)).size;

    async function handleDelete(e, id) {
        e.stopPropagation();
        await deleteTripAPI(id);
        const data = await fetchTrips();
        setTrips(data);
    }

    useEffect(() => {
        const loadTrips = async () => {
            const data = await fetchTrips()
            setTrips(data)
        }
        loadTrips()
    }, [])


    const filteredTrips = trips.filter(trip => {
        if (!searchQuery) return true
        const q = searchQuery.toLowerCase()
        return (
            trip.cityDisplay?.toLowerCase().includes(q) ||
            trip.city?.toLowerCase().includes(q) ||
            trip.country?.toLowerCase().includes(q)
        )
    })

    const sortedTrips = [...filteredTrips].sort((a, b) => {
        if (sortBy === 'createdAt') return (b.createdAt || '').localeCompare(a.createdAt || '')
        if (sortBy === 'startDate') return (a.startDate || '').localeCompare(b.startDate || '')
        if (sortBy === 'cityDisplay') return (a.cityDisplay || '').localeCompare(b.cityDisplay || '')
        return 0;
    })

    return (
        <div className='min-h-screen bg-background p-8'>
            <div className='max-w-4xl mx-auto'>
                <div className="flex flex-col gap-4 mb-8">
                    <div className="flex items-center justify-between">
                        <h1 className="text-4xl font-bold text-primary">旅程列表</h1>
                        <button
                            onClick={toggleTheme}
                            className="p-2 px-3 border border-border rounded-full hover:bg-muted cursor-pointer transition-colors"
                        >
                            <span key={String(isDark)} style={{ display: 'block', animation: 'icon-swap 0.3s ease-out' }}>
                                {isDark ? <Sun size={16} /> : <Moon size={16} />}
                            </span>
                        </button>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-3">
                        <input
                            type="text"
                            placeholder="搜尋城市或國家..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="hidden md:block border border-border rounded-lg px-3 py-1 bg-background text-sm flex-1"
                        />
                        <div className="flex items-center gap-2">
                            <span className="hidden md:inline text-sm text-muted-foreground">排序：</span>
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="border border-border rounded-lg px-3 py-1 bg-background text-sm"
                            >
                                <option value="createdAt">建立時間</option>
                                <option value="startDate">出發日期</option>
                                <option value="cityDisplay">城市名稱</option>
                            </select>
                        </div>
                        <InteractiveHoverButton
                            onClick={() => navigate('/add')}
                            className="border-primary text-primary"
                        >
                            <span className="hidden md:inline">新增旅程</span>
                            <span className="md:hidden">新增</span>
                        </InteractiveHoverButton>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2 md:gap-4 mb-8">
                    <div className="bg-card rounded-2xl p-4 md:p-6 flex flex-col gap-1 items-center">
                        <p className="text-[10px] md:text-xs text-muted-foreground">旅程總數</p>
                        <p className="text-3xl md:text-4xl font-bold text-primary">
                            <NumberTicker key={`total-${totalTrips}`} value={totalTrips} />
                        </p>
                    </div>
                    <div className="bg-card rounded-2xl p-4 md:p-6 flex flex-col gap-1 items-center">
                        <p className="text-[10px] md:text-xs text-muted-foreground">已完成</p>
                        <p className="text-3xl md:text-4xl font-bold text-primary">
                            <NumberTicker key={`completed-${completedTrips}`} value={completedTrips} />
                        </p>
                    </div>
                    <div className="bg-card rounded-2xl p-4 md:p-6 flex flex-col gap-1 items-center">
                        <p className="text-[10px] md:text-xs text-muted-foreground">
                            <span className="md:hidden">國家數</span>
                            <span className="hidden md:inline">去過的國家</span>
                        </p>
                        <p className="text-3xl md:text-4xl font-bold text-primary">
                            <NumberTicker key={`countries-${uniqueCountries}`} value={uniqueCountries} />
                        </p>
                    </div>
                </div>

                <input
                    type="text"
                    placeholder="搜尋城市或國家..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="md:hidden w-full border border-border rounded-xl px-4 py-2 bg-background text-sm mb-6"
                />


                {sortedTrips.length === 0 ? (
                    <div className='flex flex-col items-center justify-center py-24 gap-4'>
                        <Plane className="w-12 h-12 text-muted-foreground" />
                        <h2 className='text-xl font-semibold text-primary'>還沒有任何旅程</h2>
                        <p className='text-muted-foreground text-sm'>開啟你的第一趟旅程吧！</p>
                        <InteractiveHoverButton 
                            onClick={() => navigate('/add')}
                            className="border-primary text-primary mt-2"
                        >
                            GOGO！
                        </InteractiveHoverButton>
                    </div>
                ) : (
                    <BentoGrid className="grid-cols-1 md:grid-cols-3 auto-rows-auto md:auto-rows-[22rem]">
                        {sortedTrips.map((trip, index) => (
                            <TripCard key={trip.id} trip={trip} index={index} onDelete={handleDelete} />
                        ))}
                    </BentoGrid>
                )}
                
            </div>
        </div>
        
    )
}

export default TripList
