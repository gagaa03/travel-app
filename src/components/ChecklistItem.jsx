import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export function ChecklistItem({ item, onToggle, onDelete, onEdit }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({ name: item.name, notes: item.notes, category: item.category })

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    }

    function handleSave() {
        onEdit(item.id, editForm)
        setIsEditing(false)
    }

    return (
        <div ref={setNodeRef} style={style} className="flex items-start gap-3 p-3 rounded-lg bg-background">
            <button {...attributes} {...listeners} className="cursor-grab mt-1 text-muted-foreground hover:text-foreground">
                ⠿
            </button>
            <input
                type="checkbox"
                checked={item.done}
                onChange={() => onToggle(item.id)}
                className="cursor-pointer mt-1"
            />
            <div className="flex-1 flex flex-col gap-1">
                {isEditing ? (
                    <>
                        <div className="flex gap-2">
                            <input
                                value={editForm.name}
                                onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                className="flex-1 border border-border rounded-lg px-2 py-1 bg-card text-sm"
                            />
                            <select
                                value={editForm.category}
                                onChange={e => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                                className="border border-border rounded-lg px-2 py-1 bg-card text-sm"
                            >
                                <option value="attraction">景點</option>
                                <option value="restaurant">餐廳</option>
                                <option value="shopping">購物</option>
                                <option value="other">其他</option>
                            </select>
                        </div>
                        <input
                            value={editForm.notes}
                            onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="備註"
                            className="border border-border rounded-lg px-2 py-1 bg-card text-sm"
                        />
                        <div className="flex gap-2 mt-1">
                            <button onClick={() => setIsEditing(false)} className="text-xs px-2 py-0.5 border border-border rounded cursor-pointer hover:opacity-80">取消</button>
                            <button onClick={handleSave} className="text-xs px-2 py-0.5 bg-primary text-primary-foreground rounded cursor-pointer hover:opacity-90">儲存</button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                                {item.category === 'attraction' ? '景點' : item.category === 'restaurant' ? '餐廳' : item.category === 'shopping' ? '購物' : '其他'}
                            </span>
                            <span className={item.done ? 'line-through text-muted-foreground' : ''}>
                                {item.name}
                            </span>
                        </div>
                        {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                    </>
                )}
            </div>
            {!isEditing && (
                <div className="flex gap-2">
                    <button onClick={() => setIsEditing(true)} className="text-xs text-muted-foreground cursor-pointer hover:opacity-70">編輯</button>
                    <button onClick={() => onDelete(item.id)} className="text-xs text-destructive cursor-pointer hover:opacity-70">刪除</button>
                </div>
            )}
        </div>
    )
}
