import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    await prisma.intakeLog.deleteMany();
    await prisma.dailyGoal.deleteMany();
    await prisma.supplement.deleteMany();

    // Create supplements
    const supplements = [
        {
            name: '維生素 D3',
            brand: 'NOW Foods',
            dosageUnit: 'IU',
            defaultDose: 2000,
            icon: '☀️',
            color: '#f59e0b',
            category: 'vitamin',
            notes: '飯後服用，搭配油脂吸收更佳',
            order: 0,
        },
        {
            name: '魚油 Omega-3',
            brand: 'Nordic Naturals',
            dosageUnit: 'mg',
            defaultDose: 1000,
            icon: '🐟',
            color: '#3b82f6',
            category: 'fatty-acid',
            notes: '餐後服用',
            order: 1,
        },
        {
            name: '維生素 B 群',
            brand: 'Thorne',
            dosageUnit: '顆',
            defaultDose: 1,
            icon: '⚡',
            color: '#f97316',
            category: 'vitamin',
            notes: '早餐後服用，提升一天精力',
            order: 2,
        },
        {
            name: '鎂',
            brand: 'Doctor\'s Best',
            dosageUnit: 'mg',
            defaultDose: 400,
            icon: '🌙',
            color: '#8b5cf6',
            category: 'mineral',
            notes: '睡前服用，幫助放鬆與睡眠',
            order: 3,
        },
        {
            name: '益生菌',
            brand: 'Culturelle',
            dosageUnit: '顆',
            defaultDose: 1,
            icon: '🦠',
            color: '#10b981',
            category: 'probiotic',
            notes: '空腹服用效果最佳',
            order: 4,
        },
        {
            name: '維生素 C',
            brand: 'Nature\'s Way',
            dosageUnit: 'mg',
            defaultDose: 500,
            icon: '🍊',
            color: '#ef4444',
            category: 'vitamin',
            notes: '隨餐服用',
            order: 5,
        },
        {
            name: '葉黃素',
            brand: 'FloraGLO',
            dosageUnit: 'mg',
            defaultDose: 20,
            icon: '👁️',
            color: '#eab308',
            category: 'other',
            notes: '飯後服用，保護眼睛',
            order: 6,
        },
        {
            name: '鋅',
            brand: 'Solgar',
            dosageUnit: 'mg',
            defaultDose: 15,
            icon: '🛡️',
            color: '#6366f1',
            category: 'mineral',
            notes: '隨餐服用，增強免疫力',
            order: 7,
        },
    ];

    const created: { id: string; name: string }[] = [];

    for (const s of supplements) {
        const supp = await prisma.supplement.create({ data: s });
        created.push({ id: supp.id, name: supp.name });
    }

    // Create daily goals
    const goalMappings = [
        { name: '維生素 D3', timeSlot: 'morning' },
        { name: '魚油 Omega-3', timeSlot: 'morning' },
        { name: '維生素 B 群', timeSlot: 'morning' },
        { name: '鎂', timeSlot: 'bedtime' },
        { name: '益生菌', timeSlot: 'morning' },
        { name: '維生素 C', timeSlot: 'afternoon' },
        { name: '葉黃素', timeSlot: 'morning' },
        { name: '鋅', timeSlot: 'evening' },
    ];

    for (const goal of goalMappings) {
        const supp = created.find((s) => s.name === goal.name);
        if (!supp) continue;
        const suppData = supplements.find((s) => s.name === goal.name)!;
        await prisma.dailyGoal.create({
            data: {
                supplementId: supp.id,
                targetDose: suppData.defaultDose,
                timeSlot: goal.timeSlot,
            },
        });
    }

    // Create intake logs for the past 7 days (simulate some history)
    const now = new Date();
    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
        const date = new Date(now);
        date.setDate(date.getDate() - dayOffset);
        date.setHours(8, 0, 0, 0);

        // Simulate taking some supplements (not all, to make it realistic)
        const takenCount = dayOffset === 0 ? 3 : Math.floor(Math.random() * 5) + 3;
        const shuffled = [...created].sort(() => Math.random() - 0.5).slice(0, takenCount);

        for (const supp of shuffled) {
            const suppData = supplements.find((s) => s.name === supp.name)!;
            const goalMap = goalMappings.find((g) => g.name === supp.name);
            const takenAt = new Date(date);

            // Set time based on time slot
            if (goalMap?.timeSlot === 'morning') takenAt.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60));
            else if (goalMap?.timeSlot === 'afternoon') takenAt.setHours(12 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60));
            else if (goalMap?.timeSlot === 'evening') takenAt.setHours(18 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60));
            else if (goalMap?.timeSlot === 'bedtime') takenAt.setHours(22 + Math.floor(Math.random() * 1), Math.floor(Math.random() * 60));

            await prisma.intakeLog.create({
                data: {
                    supplementId: supp.id,
                    dose: suppData.defaultDose,
                    takenAt,
                    timeSlot: goalMap?.timeSlot || 'morning',
                },
            });
        }
    }

    const logCount = await prisma.intakeLog.count();
    console.log('✅ Seed completed!');
    console.log(`   Supplements: ${created.length}`);
    console.log(`   Daily Goals: ${goalMappings.length}`);
    console.log(`   Intake Logs: ${logCount}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
