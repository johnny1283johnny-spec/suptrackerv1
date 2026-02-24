'use client';

import { useState, useEffect, useCallback } from 'react';

interface LogEntry {
    id: string;
    supplementId: string;
    dose: number;
    takenAt: string;
    timeSlot: string;
    supplement: {
        name: string;
        icon: string;
        color: string;
        dosageUnit: string;
    };
}

interface DayData {
    date: string;
    count: number;
    total: number;
    ratio: number;
}

const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

export default function LogPage() {
    const [calendarData, setCalendarData] = useState<DayData[]>([]);
    const [dayLogs, setDayLogs] = useState<LogEntry[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    );
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() };
    });

    const fetchCalendar = useCallback(async () => {
        try {
            const res = await fetch(
                `/api/stats?type=calendar&year=${currentMonth.year}&month=${currentMonth.month + 1}`
            );
            const data = await res.json();
            setCalendarData(data.data || []);
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [currentMonth]);

    const fetchDayLogs = useCallback(async () => {
        try {
            const res = await fetch(`/api/intake?date=${selectedDate}`);
            const data = await res.json();
            setDayLogs(data.data || []);
        } catch (e) { console.error(e); }
    }, [selectedDate]);

    useEffect(() => { fetchCalendar(); }, [fetchCalendar]);
    useEffect(() => { fetchDayLogs(); }, [fetchDayLogs]);

    const getHeatLevel = (ratio: number): number => {
        if (ratio === 0) return 0;
        if (ratio <= 0.25) return 1;
        if (ratio <= 0.5) return 2;
        if (ratio <= 0.75) return 3;
        return 4;
    };

    // Generate calendar cells
    const generateCalendar = () => {
        const firstDay = new Date(currentMonth.year, currentMonth.month, 1);
        const lastDay = new Date(currentMonth.year, currentMonth.month + 1, 0);
        const startDayOfWeek = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        const today = new Date().toISOString().split('T')[0];
        const cells = [];

        // Empty cells for days before the first
        for (let i = 0; i < startDayOfWeek; i++) {
            cells.push({ day: 0, dateStr: '', isToday: false, heat: 0 });
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayData = calendarData.find((cd) => cd.date === dateStr);
            cells.push({
                day: d,
                dateStr,
                isToday: dateStr === today,
                heat: dayData ? getHeatLevel(dayData.ratio) : 0,
            });
        }

        return cells;
    };

    const cells = generateCalendar();
    const monthName = new Date(currentMonth.year, currentMonth.month).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
    });

    const prevMonth = () => {
        setCurrentMonth((prev) => {
            if (prev.month === 0) return { year: prev.year - 1, month: 11 };
            return { ...prev, month: prev.month - 1 };
        });
    };

    const nextMonth = () => {
        setCurrentMonth((prev) => {
            if (prev.month === 11) return { year: prev.year + 1, month: 0 };
            return { ...prev, month: prev.month + 1 };
        });
    };

    const formatSelectedDate = () => {
        const d = new Date(selectedDate + 'T00:00:00');
        return d.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' });
    };

    if (loading) {
        return <div className="page"><div className="loading"><div className="loading-spinner" /></div></div>;
    }

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-title">服用紀錄 📅</div>
                <div className="page-subtitle">查看你的歷史服用數據</div>
            </div>

            {/* Calendar */}
            <div className="calendar-container card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <button className="supp-action-btn" onClick={prevMonth}>◀</button>
                    <div className="calendar-month">{monthName}</div>
                    <button className="supp-action-btn" onClick={nextMonth}>▶</button>
                </div>

                <div className="calendar-grid">
                    {DAY_LABELS.map((label) => (
                        <div key={label} className="calendar-day-label">{label}</div>
                    ))}
                    {cells.map((cell, i) => (
                        <div
                            key={i}
                            className={`calendar-cell${cell.isToday ? ' today' : ''}${cell.day === 0 ? ' empty' : ''}`}
                            onClick={() => cell.day > 0 && setSelectedDate(cell.dateStr)}
                            style={{
                                background: cell.day === 0
                                    ? 'transparent'
                                    : cell.heat === 0
                                        ? 'var(--bg-glass)'
                                        : `rgba(16, 185, 129, ${cell.heat * 0.2})`,
                                color: cell.dateStr === selectedDate ? 'var(--accent-light)' : undefined,
                                fontWeight: cell.dateStr === selectedDate ? 700 : undefined,
                                border: cell.dateStr === selectedDate ? '2px solid var(--accent)' : cell.isToday ? '2px solid var(--accent)' : 'none',
                            }}
                        >
                            {cell.day > 0 ? cell.day : ''}
                        </div>
                    ))}
                </div>

                <div className="heat-legend">
                    <span>少</span>
                    {[0, 1, 2, 3, 4].map((level) => (
                        <div
                            key={level}
                            className="heat-swatch"
                            style={{ background: level === 0 ? 'var(--bg-glass)' : `rgba(16, 185, 129, ${level * 0.2})` }}
                        />
                    ))}
                    <span>多</span>
                </div>
            </div>

            {/* Day Detail */}
            <div className="day-detail">
                <div className="day-detail-header">
                    📋 {formatSelectedDate()}
                </div>
                {dayLogs.length > 0 ? (
                    <div className="card">
                        {dayLogs.map((log) => (
                            <div key={log.id} className="day-log-item">
                                <span className="day-log-icon">{log.supplement.icon}</span>
                                <div className="day-log-info">
                                    <div className="day-log-name">{log.supplement.name}</div>
                                    <div className="day-log-dose">
                                        {log.dose} {log.supplement.dosageUnit}
                                    </div>
                                </div>
                                <div className="day-log-time">
                                    {new Date(log.takenAt).toLocaleTimeString('zh-TW', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: false,
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🍃</div>
                        <div>這天沒有服用紀錄</div>
                    </div>
                )}
            </div>
        </div>
    );
}
