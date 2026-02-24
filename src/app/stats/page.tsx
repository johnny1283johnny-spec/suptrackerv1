'use client';

import { useState, useEffect, useCallback } from 'react';

interface WeeklyStats {
    day: string;
    count: number;
    label: string;
}

interface MissedItem {
    name: string;
    icon: string;
    missedCount: number;
    totalDays: number;
}

interface StatsData {
    weeklyRate: number;
    monthlyRate: number;
    currentStreak: number;
    longestStreak: number;
    totalLogs: number;
    weeklyChart: WeeklyStats[];
    mostMissed: MissedItem[];
}

export default function StatsPage() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch('/api/stats?type=overview');
            const data = await res.json();
            setStats(data.data);
        } catch (e) { console.error(e); }
        setLoading(false);
    }, []);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    if (loading || !stats) {
        return <div className="page"><div className="loading"><div className="loading-spinner" /></div></div>;
    }

    const maxBarCount = Math.max(...stats.weeklyChart.map((d) => d.count), 1);

    return (
        <div className="page">
            <div className="page-header">
                <div className="page-title">統計分析 📊</div>
                <div className="page-subtitle">你的保健習慣數據</div>
            </div>

            {/* Streak + Total */}
            <div className="stats-row" style={{ marginBottom: 'var(--sp-md)' }}>
                <div className="stats-mini-card">
                    <div className="stats-mini-icon">🔥</div>
                    <div className="stats-mini-value" style={{ color: 'var(--warning)' }}>{stats.currentStreak}</div>
                    <div className="stats-mini-label">連續天數</div>
                </div>
                <div className="stats-mini-card">
                    <div className="stats-mini-icon">🏆</div>
                    <div className="stats-mini-value" style={{ color: 'var(--accent-light)' }}>{stats.longestStreak}</div>
                    <div className="stats-mini-label">最長紀錄</div>
                </div>
                <div className="stats-mini-card">
                    <div className="stats-mini-icon">📝</div>
                    <div className="stats-mini-value">{stats.totalLogs}</div>
                    <div className="stats-mini-label">總紀錄</div>
                </div>
            </div>

            {/* Weekly Rate */}
            <div className="stats-card" style={{ animation: 'fadeIn 0.3s ease-out 0.1s backwards' }}>
                <div className="stats-card-title">本週完成率</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <div className="stats-big-number">{stats.weeklyRate}%</div>
                    <div className="stats-label">平均每日完成度</div>
                </div>

                <div className="stats-bar-chart">
                    {stats.weeklyChart.map((day, i) => (
                        <div key={i} className="stats-bar-item">
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{day.count}</span>
                            <div
                                className="stats-bar"
                                style={{
                                    height: `${(day.count / maxBarCount) * 80 + 4}px`,
                                    background: day.count > 0
                                        ? `linear-gradient(180deg, var(--accent-light), var(--accent))`
                                        : 'var(--bg-glass)',
                                    animation: `fadeIn 0.3s ease-out ${i * 0.05}s backwards`,
                                }}
                            />
                            <span className="stats-bar-label">{day.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Monthly Rate */}
            <div className="stats-card" style={{ animation: 'fadeIn 0.3s ease-out 0.2s backwards' }}>
                <div className="stats-card-title">本月完成率</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <div className="stats-big-number">{stats.monthlyRate}%</div>
                    <div className="stats-label">平均每日完成度</div>
                </div>
                <div style={{
                    marginTop: '12px',
                    height: '8px',
                    background: 'var(--bg-glass)',
                    borderRadius: 'var(--r-full)',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        width: `${stats.monthlyRate}%`,
                        height: '100%',
                        background: 'var(--accent-gradient)',
                        borderRadius: 'var(--r-full)',
                        transition: 'width 0.8s ease-out',
                    }} />
                </div>
            </div>

            {/* Most Missed */}
            {stats.mostMissed.length > 0 && (
                <div className="stats-card" style={{ animation: 'fadeIn 0.3s ease-out 0.3s backwards' }}>
                    <div className="stats-card-title">最常遺漏的品項</div>
                    <div className="missed-list">
                        {stats.mostMissed.map((item, i) => (
                            <div key={i} className="missed-item">
                                <span className="missed-icon">{item.icon}</span>
                                <div className="missed-info">
                                    <div className="missed-name">{item.name}</div>
                                    <div className="missed-count">{item.missedCount} 天未服用 / {item.totalDays} 天</div>
                                </div>
                                <div className="missed-bar-bg">
                                    <div
                                        className="missed-bar-fill"
                                        style={{ width: `${(item.missedCount / Math.max(item.totalDays, 1)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
