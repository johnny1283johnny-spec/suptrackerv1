'use client';

import { useState, useEffect, useCallback } from 'react';

interface Supplement {
    id: string;
    name: string;
    brand: string;
    dosageUnit: string;
    defaultDose: number;
    icon: string;
    color: string;
    category: string;
    notes: string;
    isActive: boolean;
    order: number;
    _count?: { intakeLogs: number };
}

const CATEGORIES = [
    { key: 'all', label: '全部', icon: '📋' },
    { key: 'vitamin', label: '維生素', icon: '💛' },
    { key: 'mineral', label: '礦物質', icon: '⚙️' },
    { key: 'fatty-acid', label: '脂肪酸', icon: '🐟' },
    { key: 'probiotic', label: '益生菌', icon: '🦠' },
    { key: 'other', label: '其他', icon: '✨' },
];

const ICONS = ['💊', '☀️', '🐟', '⚡', '🌙', '🦠', '🍊', '👁️', '🛡️', '🌿', '💪', '🧠', '❤️', '🦴', '🔬'];

const DEFAULT_FORM = {
    name: '',
    brand: '',
    dosageUnit: 'mg',
    defaultDose: 1,
    icon: '💊',
    color: '#10b981',
    category: 'other',
    notes: '',
    timeSlot: 'morning',
};

export default function SupplementsPage() {
    const [supplements, setSupplements] = useState<Supplement[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState(DEFAULT_FORM);
    const [toast, setToast] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/supplements');
            const data = await res.json();
            setSupplements(data.data || []);
        } catch (e) { console.error(e); }
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filtered = filter === 'all'
        ? supplements
        : supplements.filter((s) => s.category === filter);

    const openAdd = () => {
        setEditId(null);
        setForm(DEFAULT_FORM);
        setShowModal(true);
    };

    const openEdit = (s: Supplement) => {
        setEditId(s.id);
        setForm({
            name: s.name,
            brand: s.brand,
            dosageUnit: s.dosageUnit,
            defaultDose: s.defaultDose,
            icon: s.icon,
            color: s.color,
            category: s.category,
            notes: s.notes,
            timeSlot: 'morning',
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) return;

        const method = editId ? 'PUT' : 'POST';
        const body = editId ? { ...form, id: editId } : form;

        await fetch('/api/supplements', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        setShowModal(false);
        setToast(editId ? '已更新品項' : '✓ 已新增品項');
        setTimeout(() => setToast(''), 2000);
        fetchData();
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`確定要刪除「${name}」嗎？`)) return;
        await fetch(`/api/supplements?id=${id}`, { method: 'DELETE' });
        setToast(`已刪除 ${name}`);
        setTimeout(() => setToast(''), 2000);
        fetchData();
    };

    if (loading) {
        return <div className="page"><div className="loading"><div className="loading-spinner" /></div></div>;
    }

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-title">我的保健品 💊</div>
                <div className="page-subtitle">管理你的保健食品品項</div>
            </div>

            <div className="category-filters">
                {CATEGORIES.map((c) => (
                    <button
                        key={c.key}
                        className={`category-chip${filter === c.key ? ' active' : ''}`}
                        onClick={() => setFilter(c.key)}
                    >
                        {c.icon} {c.label}
                    </button>
                ))}
            </div>

            <div className="supp-list">
                {filtered.map((s, i) => (
                    <div
                        key={s.id}
                        className="supp-card"
                        style={{ animation: `fadeIn 0.3s ease-out ${i * 0.05}s backwards` }}
                    >
                        <div className="supp-icon" style={{ background: `${s.color}20` }}>
                            {s.icon}
                        </div>
                        <div className="supp-info">
                            <div className="supp-name">{s.name}</div>
                            <div className="supp-meta">{s.brand} • {s.defaultDose} {s.dosageUnit}</div>
                        </div>
                        <div className="supp-actions">
                            <button className="supp-action-btn" onClick={() => openEdit(s)} title="編輯">
                                ✏️
                            </button>
                            <button className="supp-action-btn danger" onClick={() => handleDelete(s.id, s.name)} title="刪除">
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}

                {filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📦</div>
                        <div>尚無品項</div>
                    </div>
                )}
            </div>

            <button className="fab" onClick={openAdd}>+</button>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-handle" />
                        <div className="modal-title">{editId ? '編輯品項' : '新增保健品'}</div>

                        <div className="form-group">
                            <label className="form-label">名稱</label>
                            <input
                                className="form-input"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="例：維生素 D3"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">品牌</label>
                            <input
                                className="form-input"
                                value={form.brand}
                                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                                placeholder="例：NOW Foods"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">劑量</label>
                                <input
                                    className="form-input"
                                    type="number"
                                    value={form.defaultDose}
                                    onChange={(e) => setForm({ ...form, defaultDose: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">單位</label>
                                <select
                                    className="form-select"
                                    value={form.dosageUnit}
                                    onChange={(e) => setForm({ ...form, dosageUnit: e.target.value })}
                                >
                                    <option value="mg">mg</option>
                                    <option value="g">g</option>
                                    <option value="IU">IU</option>
                                    <option value="mcg">mcg</option>
                                    <option value="顆">顆</option>
                                    <option value="ml">ml</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">分類</label>
                                <select
                                    className="form-select"
                                    value={form.category}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                >
                                    {CATEGORIES.filter((c) => c.key !== 'all').map((c) => (
                                        <option key={c.key} value={c.key}>{c.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">服用時段</label>
                                <select
                                    className="form-select"
                                    value={form.timeSlot}
                                    onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                                >
                                    <option value="morning">早上</option>
                                    <option value="afternoon">下午</option>
                                    <option value="evening">晚上</option>
                                    <option value="bedtime">睡前</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">圖示</label>
                            <div className="icon-picker">
                                {ICONS.map((icon) => (
                                    <div
                                        key={icon}
                                        className={`icon-option${form.icon === icon ? ' selected' : ''}`}
                                        onClick={() => setForm({ ...form, icon })}
                                    >
                                        {icon}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">備註</label>
                            <input
                                className="form-input"
                                value={form.notes}
                                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                placeholder="例：飯後服用"
                            />
                        </div>

                        <div className="btn-row">
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>取消</button>
                            <button className="btn btn-accent" onClick={handleSave}>
                                {editId ? '更新' : '新增'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <div className="toast">{toast}</div>}
        </div>
    );
}
