import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchTrip, updateTrip } from '../services/api.js'
import { MagicCard } from '@/components/ui/magic-card'

function EditTrip() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [form, setForm] = useState({
        cityDisplay: '',
        city: '',
        country: '',
        startDate: '',
        endDate: '',
        budget: '',
        currency: 'TWD',
        accommodation: '',
        transportation: '',
        notes: '',
    })

    useEffect(() => {
        const loadTrip = async () => {
            const data = await fetchTrip(id)
            setForm({
                cityDisplay: data.city_display || '',
                city: data.city || '',
                country: data.country || '',
                startDate: data.start_date ? data.start_date.split('T')[0] : '',
                endDate: data.end_date ? data.end_date.split('T')[0] : '',
                budget: data.budget || '',
                currency: data.currency || 'TWD',
                accommodation: data.accommodation || '',
                transportation: data.transportation || '',
                notes: data.notes || '',
            })
        }
        loadTrip()
    }, [id])

    const [errors, setErrors] = useState({});

    function validate(fields) {
        const newErrors = {};
        if (!fields.city?.trim()) newErrors.city = '城市名稱不能為空'
        if (!fields.country?.trim()) newErrors.country = '國家不能為空'
        if (!fields.startDate) newErrors.startDate = '出發日期不能為空'
        if (!fields.endDate) newErrors.endDate = '回程日期不能為空'

        return newErrors;
    }

    function handleChange(e) {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const fieldErrors = validate(form);
        if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
            return;
        }
        await updateTrip(id, form);
        navigate(`/trip/${id}`);
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <MagicCard
            className="w-full max-w-md rounded-2xl"
            gradientFrom="#1B3F6B99"
            gradientTo="#C4603A99"
        >
            <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => navigate(`/trip/${id}`)} className="text-sm px-3 py-1 border border-border rounded-lg hover:opacity-80 cursor-pointer">← 返回</button>
                    <h1 className="text-2xl font-bold text-primary">編輯旅程</h1>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm text-muted-foreground">城市名稱（中文）</label>
                    <input name="cityDisplay" placeholder='e.g. 東京' value={form.cityDisplay} onChange={handleChange} className='border border-border rounded-lg px-3 py-2 bg-background'/>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-sm text-muted-foreground">城市名稱（英文）</label>
                    <input name='city' placeholder='e.g. Tokyo' value={form.city} onChange={handleChange} className='border border-border rounded-lg px-3 py-2 bg-background'
                        onBlur={() => {
                            const fieldErrors = validate(form)
                            if (fieldErrors.city) {
                                setErrors(prev => ({ ...prev, city: fieldErrors.city }))
                            } else {
                                setErrors(prev => ({ ...prev, city: undefined }))
                            }
                        }}
                    />
                    {errors.city && <p className="text-sm text-red-400">{errors.city}</p>}
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-sm text-muted-foreground">國家（英文）</label>
                    <input name='country' placeholder='e.g. Japan' value={form.country} onChange={handleChange} className='border border-border rounded-lg px-3 py-2 bg-background'
                        onBlur={() => {
                            const fieldErrors = validate(form)
                            if (fieldErrors.country) {
                                setErrors(prev => ({ ...prev, country: fieldErrors.country }))
                            } else {
                                setErrors(prev => ({ ...prev, country: undefined }))
                            }
                        }}
                    />
                    {errors.country && <p className="text-sm text-red-400">{errors.country}</p>}
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-sm text-muted-foreground">出發日期</label>
                    <input name='startDate' type='date' value={form.startDate} onChange={handleChange} className='border border-border rounded-lg px-3 py-2 bg-background'
                        onBlur={() => {
                            const fieldErrors = validate(form)
                            if (fieldErrors.startDate) {
                                setErrors(prev => ({ ...prev, startDate: fieldErrors.startDate }))
                            } else {
                                setErrors(prev => ({ ...prev, startDate: undefined }))
                            }
                        }}
                    />
                    {errors.startDate && <p className="text-sm text-red-400">{errors.startDate}</p>}
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-sm text-muted-foreground">回程日期</label>
                    <input name='endDate' type="date" value={form.endDate} onChange={handleChange} className='border border-border rounded-lg px-3 py-2 bg-background'
                        onBlur={() => {
                            const fieldErrors = validate(form)
                            if (fieldErrors.endDate) {
                                setErrors(prev => ({ ...prev, endDate: fieldErrors.endDate }))
                            } else {
                                setErrors(prev => ({ ...prev, endDate: undefined }))
                            }
                        }}
                    />
                    {errors.endDate && <p className="text-sm text-red-400">{errors.endDate}</p>}
                </div>
                <div className="flex flex-col md:flex-row gap-2">
                    <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm text-muted-foreground">預算</label>
                        <input name='budget' placeholder='e.g. 50000' type="number" value={form.budget} onChange={handleChange} className='border border-border rounded-lg px-3 py-2 bg-background' />
                    </div>
                    <div className="flex flex-col gap-1 md:w-28">
                        <label className="text-sm text-muted-foreground">貨幣</label>
                        <input name='currency' placeholder='e.g. JPY' value={form.currency} onChange={handleChange} className='border border-border rounded-lg px-3 py-2 bg-background' />
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-sm text-muted-foreground">住宿</label>
                    <input name="accommodation" placeholder='e.g. 新宿格蘭貝爾酒店' value={form.accommodation} onChange={handleChange} className='border border-border rounded-lg px-3 py-2 bg-background' />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-sm text-muted-foreground">交通方式</label>
                    <input name='transportation' placeholder='e.g. 飛機' value={form.transportation} onChange={handleChange} className='border border-border rounded-lg px-3 py-2 bg-background' />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-sm text-muted-foreground">備註</label>
                    <textarea name='notes' placeholder='其他備註...' value={form.notes} onChange={handleChange} className='border border-border rounded-lg px-3 py-2 bg-background resize-none' rows={3} />
                </div>
                <button type="submit" className="bg-primary text-primary-foreground rounded-lg py-2 font-semibold hover:opacity-90 transition-opacity">
                    儲存變更
                </button>
            </form>
        </MagicCard>
        </div>
    )
}

export default EditTrip