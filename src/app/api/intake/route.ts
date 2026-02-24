import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const period = searchParams.get('period');
        const date = searchParams.get('date');

        let where = {};

        if (period === 'today' || (!period && !date)) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            where = {
                takenAt: { gte: today, lt: tomorrow },
            };
        } else if (date) {
            const d = new Date(date + 'T00:00:00');
            const next = new Date(d);
            next.setDate(next.getDate() + 1);
            where = {
                takenAt: { gte: d, lt: next },
            };
        }

        const logs = await prisma.intakeLog.findMany({
            where,
            include: {
                supplement: {
                    select: { name: true, icon: true, color: true, dosageUnit: true },
                },
            },
            orderBy: { takenAt: 'desc' },
        });

        return NextResponse.json({ success: true, data: logs });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { supplementId, dose, timeSlot } = body;

        const log = await prisma.intakeLog.create({
            data: {
                supplementId,
                dose,
                timeSlot: timeSlot || 'morning',
                takenAt: new Date(),
            },
            include: {
                supplement: {
                    select: { name: true, icon: true, color: true, dosageUnit: true },
                },
            },
        });

        return NextResponse.json({ success: true, data: log });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });

        await prisma.intakeLog.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
