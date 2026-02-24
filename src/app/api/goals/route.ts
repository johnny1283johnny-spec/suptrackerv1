import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const goals = await prisma.dailyGoal.findMany({
            where: { isActive: true },
            include: {
                supplement: {
                    select: {
                        id: true,
                        name: true,
                        icon: true,
                        color: true,
                        defaultDose: true,
                        dosageUnit: true,
                    },
                },
            },
            orderBy: [
                { timeSlot: 'asc' },
                { supplement: { order: 'asc' } },
            ],
        });

        return NextResponse.json({ success: true, data: goals });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
