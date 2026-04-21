const RAIN_DROPS = Array.from({ length: 24 }, (_, i) => ({
    left: `${(i * 4 + (i % 5) * 2 + 1) % 97}%`,
    delay: `${(i * 0.09) % 1.2}s`,
    duration: `${0.45 + (i % 5) * 0.06}s`,
}))

const SNOW_FLAKES = Array.from({ length: 16 }, (_, i) => ({
    left: `${(i * 7 + (i % 4) * 3 + 2) % 95}%`,
    delay: `${(i * 0.2) % 2.4}s`,
    duration: `${1.8 + (i % 6) * 0.3}s`,
    size: 4 + (i % 3),
}))

const MIST_BANDS = [
    { top: '15%', width: '70%', height: '10px', delay: '0s', duration: '6s', opacity: 0.45 },
    { top: '30%', width: '90%', height: '8px', delay: '1.5s', duration: '8s', opacity: 0.35 },
    { top: '50%', width: '60%', height: '12px', delay: '3s', duration: '7s', opacity: 0.4 },
    { top: '65%', width: '80%', height: '8px', delay: '0.8s', duration: '9s', opacity: 0.3 },
    { top: '80%', width: '50%', height: '10px', delay: '2.2s', duration: '6.5s', opacity: 0.35 },
]

function getWeatherType(id) {
    if (id >= 200 && id < 300) return 'thunderstorm'
    if (id >= 300 && id < 600) return 'rain'
    if (id >= 600 && id < 700) return 'snow'
    if (id >= 700 && id < 800) return 'mist'
    if (id === 800) return 'clear'
    if (id <= 802) return 'few-clouds'
    return 'cloudy'
}

function CloudShape({ style = {} }) {
    return (
        <div style={{ position: 'relative', width: '64px', height: '24px', ...style }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgb(156 163 175 / 0.6)', borderRadius: '9999px' }} />
            <div style={{ position: 'absolute', top: '-12px', left: '10px', width: '28px', height: '28px', background: 'rgb(156 163 175 / 0.6)', borderRadius: '9999px' }} />
            <div style={{ position: 'absolute', top: '-8px', left: '28px', width: '22px', height: '22px', background: 'rgb(156 163 175 / 0.6)', borderRadius: '9999px' }} />
        </div>
    )
}

export function WeatherBackground({ conditionId }) {
    const type = getWeatherType(conditionId)

    if (type === 'clear') {
        return (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div style={{ position: 'absolute', top: '-2.5rem', right: '-2.5rem', width: '9rem', height: '9rem', borderRadius: '9999px', background: 'rgb(254 240 138 / 0.4)', animation: 'sun-glow 3s ease-in-out infinite' }} />
                <div style={{ position: 'absolute', top: '-1.25rem', right: '-1.25rem', width: '5rem', height: '5rem', borderRadius: '9999px', background: 'rgb(253 230 138 / 0.3)', animation: 'sun-glow 3s ease-in-out infinite', animationDelay: '1s' }} />
            </div>
        )
    }

    if (type === 'rain' || type === 'thunderstorm') {
        return (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {RAIN_DROPS.map((drop, i) => (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            left: drop.left,
                            top: '-16px',
                            width: '1.5px',
                            height: '16px',
                            background: 'rgba(147, 197, 253, 0.85)',
                            borderRadius: '9999px',
                            animation: `rain-fall ${drop.duration} linear infinite`,
                            animationDelay: drop.delay,
                        }}
                    />
                ))}
                {type === 'thunderstorm' && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(220, 240, 255, 0.6)',
                        animation: 'lightning-flash 3s ease-in-out infinite',
                    }} />
                )}
            </div>
        )
    }

    if (type === 'snow') {
        return (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {SNOW_FLAKES.map((flake, i) => (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            left: flake.left,
                            top: `-${flake.size}px`,
                            width: `${flake.size}px`,
                            height: `${flake.size}px`,
                            borderRadius: '9999px',
                            background: 'rgba(219, 234, 254, 0.95)',
                            boxShadow: '0 0 4px rgba(219,234,254,0.6)',
                            animation: `snow-fall ${flake.duration} ease-in-out infinite`,
                            animationDelay: flake.delay,
                        }}
                    />
                ))}
            </div>
        )
    }

    if (type === 'few-clouds') {
        return (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', opacity: 0.6, animation: 'cloud-drift 7s ease-in-out infinite' }}>
                    <CloudShape />
                </div>
                <div style={{ position: 'absolute', top: '2.5rem', right: '4rem', opacity: 0.4, animation: 'cloud-drift 10s ease-in-out infinite', animationDelay: '2s' }}>
                    <CloudShape style={{ width: '42px', height: '16px' }} />
                </div>
            </div>
        )
    }

    if (type === 'cloudy') {
        return (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div style={{ position: 'absolute', top: '0.75rem', right: '0.5rem', opacity: 0.65, animation: 'cloud-drift 8s ease-in-out infinite' }}>
                    <CloudShape />
                </div>
                <div style={{ position: 'absolute', top: '2rem', right: '3.5rem', opacity: 0.45, animation: 'cloud-drift 6s ease-in-out infinite', animationDelay: '1.5s' }}>
                    <CloudShape style={{ width: '48px', height: '18px' }} />
                </div>
                <div style={{ position: 'absolute', top: '3.5rem', right: '6rem', opacity: 0.3, animation: 'cloud-drift 11s ease-in-out infinite', animationDelay: '3s' }}>
                    <CloudShape style={{ width: '36px', height: '14px' }} />
                </div>
            </div>
        )
    }

    if (type === 'mist') {
        return (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {MIST_BANDS.map((band, i) => (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            top: band.top,
                            left: 0,
                            width: band.width,
                            height: band.height,
                            background: 'rgba(203, 213, 225, 0.9)',
                            borderRadius: '9999px',
                            filter: 'blur(6px)',
                            opacity: band.opacity,
                            animation: `mist-band ${band.duration} ease-in-out infinite`,
                            animationDelay: band.delay,
                        }}
                    />
                ))}
            </div>
        )
    }

    return null
}
