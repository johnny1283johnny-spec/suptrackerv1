import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const supplements = await prisma.supplement.findMany({
            orderBy: { order: 'asc' },
            include: {
                _count: { select: { intakeLogs: true } },
            },
        });
        return NextResponse.json({ success: true, data: supplements });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, brand, dosageUnit, defaultDose, icon, color, category, notes, timeSlot } = body;

        const maxOrder = await prisma.supplement.aggregate({ _max: { order: true } });
        const nextOrder = (maxOrder._max.order ?? -1) + 1;

        const supplement = await prisma.supplement.create({
            data: {
                name, brand, dosageUnit, defaultDose, icon, color, category, notes,
                order: nextOrder,
            },
        });

        // Also create a daily goal if timeSlot provided
        if (timeSlot) {
            await prisma.dailyGoal.create({
                data: {
                    supplementId: supplement.id,
                    targetDose: defaultDose,
                    timeSlot,
                },
            });
        }

        return NextResponse.json({ success: true, data: supplement });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, name, brand, dosageUnit, defaultDose, icon, color, category, notes } = body;

        const supplement = await prisma.supplement.update({
            where: { id },
            data: { name, brand, dosageUnit, defaultDose, icon, color, category, notes },
        });

        return NextResponse.json({ success: true, data: supplement });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });

        await prisma.supplement.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
