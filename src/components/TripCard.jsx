import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPhoto } from '../services/unsplashService'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'


export function TripCard({ trip, index, onDelete }) {
    const navigate = useNavigate()
    const [photoUrl, setPhotoUrl] = useState(null)

    useEffect(() => {
        getPhoto(trip.city).then(data => setPhotoUrl(data.urls.regular))
    }, [trip.city])

    return (
        <div
            onClick={() => navigate(`/trip/${trip.id}`)}
            className={cn(
                "group relative flex flex-col justify-between overflow-hidden rounded-xl cursor-pointer h-40 md:h-full",
                "bg-card [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
                "hover:shadow-lg transition-all duration-300",
                index % 3 === 0 ? "md:col-span-2" : "md:col-span-1"
            )}
        >
            {photoUrl ? (
                <img
                    src={photoUrl}
                    alt={trip.city_display}
                    className="absolute inset-0 w-full h-full object-cover"
                />
            ) : (
                <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            <div className="relative z-10 p-6 flex flex-col gap-2 mt-auto">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">{trip.city_display}</h2>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        trip.status === 'planning' ? 'bg-white/20 text-white' :
                        trip.status === 'ongoing' ? 'bg-accent text-accent-foreground' :
                        'bg-primary text-primary-foreground'
                    }`}>
                        {trip.status === 'planning' ? '計畫中' :
                        trip.status === 'ongoing' ? '進行中' : '已完成'}
                    </span>
                </div>
                <p className="text-white/70 text-sm">{trip.country}</p>
                {/* 手機 S：兩行 */}
                <div className="text-white/80 text-sm xs:hidden">
                    <p>{trip.start_date?.slice(0, 10)}</p>
                    <p>
                        → {trip.end_date?.slice(0, 10)}
                        {trip.start_date && trip.end_date && (
                            <span className="text-white/50 text-xs ml-2">
                                ({Math.round((new Date(trip.end_date) - new Date(trip.start_date)) / (1000 * 60 * 60 * 24))} 天)
                            </span>
                        )}
                    </p>
                </div>
                {/* sm 以上：一行 */}
                <p className="hidden xs:block text-white/80 text-sm">
                    {trip.start_date?.slice(0, 10)} → {trip.end_date?.slice(0, 10)}
                    {trip.start_date && trip.end_date && (
                        <span className="text-white/50 text-xs ml-2">
                            ({Math.round((new Date(trip.end_date) - new Date(trip.start_date)) / (1000 * 60 * 60 * 24))} 天)
                        </span>
                    )}
                </p>
                {trip.start_date && (() => {
                    const days = Math.round((new Date(trip.start_date) - new Date()) / (1000 * 60 * 60 * 24))
                    if (days > 0) return <p className="text-sm text-accent font-medium">還有 {days} 天出發</p>
                    if (days === 0) return <p className="text-sm text-accent font-medium">今天出發！</p>
                    if (days > -30) return <p className="text-sm text-white/50">已結束 {Math.abs(days)} 天</p>
                    return null
                })()}
                {trip.outbound?.flightNumber && (
                    <p className="text-white/60 text-xs">
                        去程：{trip.outbound.flightNumber} · {trip.outbound.from} → {trip.outbound.to}
                    </p>
                )}
                {trip.inbound?.flightNumber && (
                    <p className="text-white/60 text-xs">
                        回程：{trip.inbound.flightNumber} · {trip.inbound.from} → {trip.inbound.to}
                    </p>
                )}
            </div>

            <button
                onClick={(e) => { e.stopPropagation(); onDelete(e, trip.id) }}
                className="hidden md:block cursor-pointer absolute top-4 right-4 text-xs px-2 py-1 rounded-full bg-red-950/80 text-red-200 border border-red-800/60 backdrop-blur-sm transition-opacity opacity-0 group-hover:opacity-100 z-10"
            >
                刪除
            </button>
        </div>
    )
}
