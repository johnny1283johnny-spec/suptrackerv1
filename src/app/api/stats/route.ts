import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');

        if (type === 'calendar') {
            return handleCalendar(searchParams);
        }

        if (type === 'overview') {
            return handleOverview();
        }

        return NextResponse.json({ success: false, error: 'Unknown type' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

async function handleCalendar(params: URLSearchParams) {
    const year = parseInt(params.get('year') || String(new Date().getFullYear()));
    const month = parseInt(params.get('month') || String(new Date().getMonth() + 1));

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const goalCount = await prisma.dailyGoal.count({ where: { isActive: true } });

    const logs = await prisma.intakeLog.findMany({
        where: {
            takenAt: { gte: startDate, lte: endDate },
        },
        select: { takenAt: true, supplementId: true },
    });

    // Group by day
    const dayMap: Record<string, Set<string>> = {};
    for (const log of logs) {
        const dateStr = log.takenAt.toISOString().split('T')[0];
        if (!dayMap[dateStr]) dayMap[dateStr] = new Set();
        dayMap[dateStr].add(log.supplementId);
    }

    const data = Object.entries(dayMap).map(([date, supps]) => ({
        date,
        count: supps.size,
        total: goalCount,
        ratio: goalCount > 0 ? supps.size / goalCount : 0,
    }));

    return NextResponse.json({ success: true, data });
}

async function handleOverview() {
    const goalCount = await prisma.dailyGoal.count({ where: { isActive: true } });
    const totalLogs = await prisma.intakeLog.count();

    // Weekly chart (last 7 days)
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const weekLabels = ['日', '一', '二', '三', '四', '五', '六'];
    const weeklyChart = [];

    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const start = new Date(d);
        start.setHours(0, 0, 0, 0);
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);

        const count = await prisma.intakeLog.count({
            where: { takenAt: { gte: start, lte: end } },
        });

        weeklyChart.push({
            day: start.toISOString().split('T')[0],
            count,
            label: weekLabels[start.getDay()],
        });
    }

    // Weekly rate
    const weekTotal = weeklyChart.reduce((sum, d) => sum + d.count, 0);
    const weeklyRate = goalCount > 0 ? Math.round((weekTotal / (7 * goalCount)) * 100) : 0;

    // Monthly rate
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const daysSoFar = today.getDate();
    const monthLogs = await prisma.intakeLog.count({
        where: { takenAt: { gte: monthStart, lte: today } },
    });
    const monthlyRate = goalCount > 0 ? Math.round((monthLogs / (daysSoFar * goalCount)) * 100) : 0;

    // Streak calculation
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < 60; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const start = new Date(d); start.setHours(0, 0, 0, 0);
        const end = new Date(d); end.setHours(23, 59, 59, 999);

        const count = await prisma.intakeLog.count({
            where: { takenAt: { gte: start, lte: end } },
        });

        if (count > 0) {
            tempStreak++;
            if (i <= currentStreak) currentStreak = tempStreak;
            longestStreak = Math.max(longestStreak, tempStreak);
        } else {
            if (i === 0) { /* skip today if no logs yet */ }
            else {
                tempStreak = 0;
            }
        }
    }

    // Most missed supplements
    const goals = await prisma.dailyGoal.findMany({
        where: { isActive: true },
        include: { supplement: { select: { name: true, icon: true } } },
    });

    const mostMissed: MissedItem[] = [];
    for (const goal of goals) {
        let missed = 0;
        const checkDays = 14;
        for (let i = 0; i < checkDays; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const start = new Date(d); start.setHours(0, 0, 0, 0);
            const end = new Date(d); end.setHours(23, 59, 59, 999);

            const found = await prisma.intakeLog.count({
                where: {
                    supplementId: goal.supplementId,
                    takenAt: { gte: start, lte: end },
                },
            });
            if (found === 0) missed++;
        }
        if (missed > 0) {
            mostMissed.push({
                name: goal.supplement.name,
                icon: goal.supplement.icon,
                missedCount: missed,
                totalDays: checkDays,
            });
        }
    }

    mostMissed.sort((a, b) => b.missedCount - a.missedCount);

    return NextResponse.json({
        success: true,
        data: {
            weeklyRate: Math.min(weeklyRate, 100),
            monthlyRate: Math.min(monthlyRate, 100),
            currentStreak,
            longestStreak,
            totalLogs,
            weeklyChart,
            mostMissed: mostMissed.slice(0, 5),
        },
    });
}

interface MissedItem {
    name: string;
    icon: string;
    missedCount: number;
    totalDays: number;
}
