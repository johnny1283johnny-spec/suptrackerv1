'use client';

import { useState, useEffect, useCallback } from 'react';

interface Supplement {
  id: string;
  name: string;
  icon: string;
  color: string;
  defaultDose: number;
  dosageUnit: string;
}

interface Goal {
  id: string;
  supplementId: string;
  targetDose: number;
  timeSlot: string;
  supplement: Supplement;
}

interface IntakeLog {
  id: string;
  supplementId: string;
  dose: number;
  takenAt: string;
  timeSlot: string;
}

const TIME_SLOTS = [
  { key: 'morning', label: '早上', icon: '🌅', time: '07:00-11:00' },
  { key: 'afternoon', label: '下午', icon: '☀️', time: '11:00-17:00' },
  { key: 'evening', label: '晚上', icon: '🌆', time: '17:00-21:00' },
  { key: 'bedtime', label: '睡前', icon: '🌙', time: '21:00+' },
];

export default function TodayPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [todayLogs, setTodayLogs] = useState<IntakeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [goalsRes, logsRes] = await Promise.all([
        fetch('/api/goals'),
        fetch('/api/intake?period=today'),
      ]);
      const goalsData = await goalsRes.json();
      const logsData = await logsRes.json();
      setGoals(goalsData.data || []);
      setTodayLogs(logsData.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isTaken = (goalId: string, supplementId: string) => {
    return todayLogs.some((log) => log.supplementId === supplementId);
  };

  const toggleIntake = async (goal: Goal) => {
    const taken = isTaken(goal.id, goal.supplementId);

    if (taken) {
      // Remove log for today
      const log = todayLogs.find((l) => l.supplementId === goal.supplementId);
      if (log) {
        await fetch(`/api/intake?id=${log.id}`, { method: 'DELETE' });
        setTodayLogs(todayLogs.filter((l) => l.id !== log.id));
        setToast(`已取消 ${goal.supplement.name}`);
      }
    } else {
      // Create log
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplementId: goal.supplementId,
          dose: goal.targetDose,
          timeSlot: goal.timeSlot,
        }),
      });
      const data = await res.json();
      if (data.data) {
        setTodayLogs([...todayLogs, data.data]);
        setToast(`✓ 已記錄 ${goal.supplement.name}`);
      }
    }

    setTimeout(() => setToast(''), 2000);
  };

  const totalGoals = goals.length;
  const completedCount = goals.filter((g) => isTaken(g.id, g.supplementId)).length;
  const percentage = totalGoals > 0 ? Math.round((completedCount / totalGoals) * 100) : 0;

  // SVG ring calc
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const ringOffset = circumference - (percentage / 100) * circumference;

  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const hour = now.getHours();
  const greetingText = hour < 12 ? '早安' : hour < 18 ? '午安' : '晚安';

  if (loading) {
    return (
      <div className="page">
        <div className="loading"><div className="loading-spinner" /></div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="today-header">
        <div className="today-date">{dateStr}</div>
        <div className="today-greeting">{greetingText}，<span>保持健康</span> 💪</div>
      </div>

      {/* Progress Ring */}
      <div className="progress-ring-container">
        <div className="progress-ring-wrapper">
          <svg className="progress-ring-svg" viewBox="0 0 140 140">
            <defs>
              <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
            <circle className="progress-ring-bg" cx="70" cy="70" r={radius} />
            <circle
              className="progress-ring-fill"
              cx="70" cy="70" r={radius}
              strokeDasharray={circumference}
              strokeDashoffset={ringOffset}
            />
          </svg>
          <div className="progress-ring-text">
            <div className="progress-ring-pct">{percentage}%</div>
            <div className="progress-ring-label">今日完成</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-pill">
          <div className="stat-pill-value" style={{ color: 'var(--accent)' }}>{completedCount}</div>
          <div className="stat-pill-label">已服用</div>
        </div>
        <div className="stat-pill">
          <div className="stat-pill-value">{totalGoals - completedCount}</div>
          <div className="stat-pill-label">待服用</div>
        </div>
        <div className="stat-pill">
          <div className="stat-pill-value">{totalGoals}</div>
          <div className="stat-pill-label">總計</div>
        </div>
      </div>

      {/* Time Slot Sections */}
      {TIME_SLOTS.map((slot) => {
        const slotGoals = goals.filter((g) => g.timeSlot === slot.key);
        if (slotGoals.length === 0) return null;

        return (
          <div key={slot.key} className="time-slot">
            <div className="time-slot-header">
              <span className="time-slot-icon">{slot.icon}</span>
              {slot.label}
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '11px' }}>
                {slot.time}
              </span>
            </div>
            {slotGoals.map((goal, i) => {
              const taken = isTaken(goal.id, goal.supplementId);
              return (
                <div
                  key={goal.id}
                  className={`intake-item${taken ? ' taken' : ''}`}
                  onClick={() => toggleIntake(goal)}
                  style={{ animationDelay: `${i * 0.05}s`, animation: 'fadeIn 0.3s ease-out backwards' }}
                >
                  <div className="intake-checkbox">
                    {taken && '✓'}
                  </div>
                  <div
                    className="intake-icon"
                    style={{ background: `${goal.supplement.color}20` }}
                  >
                    {goal.supplement.icon}
                  </div>
                  <div className="intake-info">
                    <div className="intake-name">{goal.supplement.name}</div>
                    <div className="intake-dose">
                      {goal.targetDose} {goal.supplement.dosageUnit}
                    </div>
                  </div>
                  {taken && (
                    <div className="intake-time">
                      {new Date(todayLogs.find((l) => l.supplementId === goal.supplementId)?.takenAt || '').toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
