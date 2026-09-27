/**
 * Prisma Database Seed Script for ExamPro
 * 
 * Run with:
 *   npx prisma db seed
 * or:
 *   npm run db:seed
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import {
  SEED_USERS,
  SEED_SUBJECTS,
  SEED_CATEGORIES,
  SEED_CHAPTERS,
  SEED_QUIZZES,
  SEED_QUESTIONS,
  SEED_SUBSCRIPTIONS,
  SEED_PAYMENTS,
  SEED_ATTEMPTS,
  SEED_LEADERBOARD,
  SEED_BOOKMARKS,
  SEED_NOTIFICATIONS,
} from './seedData';

// Handle default PostgreSQL URL if environment has file:./dev.db from container sandbox
const targetDbUrl =
  process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:')
    ? process.env.DATABASE_URL
    : 'postgresql://postgres:postgres@localhost:5432/exampro_quiz?schema=public';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: targetDbUrl,
    },
  },
  log: ['info', 'warn', 'error'],
});

async function main() {
  const startTime = Date.now();
  console.log('\n======================================================');
  console.log('🌱 Starting Prisma Database Seed: ExamPro BCS Platform');
  console.log('======================================================\n');

  const dbUrl = process.env.DATABASE_URL;
  console.log(`📡 Target Database URL: ${dbUrl ? dbUrl.replace(/:[^:@]+@/, ':****@') : 'Not defined'}`);

  try {
    // Test connectivity
    await prisma.$connect();
    console.log('✅ Successfully connected to database engine.\n');

    // 1. Seed Subjects
    console.log(`📚 Seeding ${SEED_SUBJECTS.length} Subjects...`);
    for (const sub of SEED_SUBJECTS) {
      await prisma.subject.upsert({
        where: { id: sub.id },
        update: {
          name: sub.name,
          code: sub.code,
          description: sub.description,
          icon: sub.icon,
        },
        create: {
          id: sub.id,
          name: sub.name,
          code: sub.code,
          description: sub.description,
          icon: sub.icon,
        },
      });
    }
    console.log('   ✔ Subjects seeded.');

    // 2. Seed Categories
    console.log(`📂 Seeding ${SEED_CATEGORIES.length} Categories...`);
    for (const cat of SEED_CATEGORIES) {
      await prisma.category.upsert({
        where: { id: cat.id },
        update: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          subjectId: cat.subjectId,
        },
        create: {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          subjectId: cat.subjectId,
        },
      });
    }
    console.log('   ✔ Categories seeded.');

    // 3. Seed Chapters
    console.log(`📑 Seeding ${SEED_CHAPTERS.length} Chapters...`);
    for (const chap of SEED_CHAPTERS) {
      await prisma.chapter.upsert({
        where: { id: chap.id },
        update: {
          name: chap.name,
          order: chap.order,
          categoryId: chap.categoryId,
        },
        create: {
          id: chap.id,
          name: chap.name,
          order: chap.order,
          categoryId: chap.categoryId,
        },
      });
    }
    console.log('   ✔ Chapters seeded.');

    // 4. Seed Quizzes
    console.log(`📝 Seeding ${SEED_QUIZZES.length} Model Tests / Quizzes...`);
    for (const q of SEED_QUIZZES) {
      await prisma.quiz.upsert({
        where: { id: q.id },
        update: {
          title: q.title,
          slug: q.slug,
          description: q.description,
          durationMinutes: q.durationMinutes,
          totalMarks: q.totalMarks,
          passMarks: q.passMarks,
          negativeMarkRate: q.negativeMarkRate,
          isPaid: q.isPaid,
          price: q.price,
          difficulty: q.difficulty,
          isPublished: q.isPublished,
          subjectId: q.subjectId,
          categoryId: q.categoryId,
          chapterId: q.chapterId,
        },
        create: {
          id: q.id,
          title: q.title,
          slug: q.slug,
          description: q.description,
          durationMinutes: q.durationMinutes,
          totalMarks: q.totalMarks,
          passMarks: q.passMarks,
          negativeMarkRate: q.negativeMarkRate,
          isPaid: q.isPaid,
          price: q.price,
          difficulty: q.difficulty,
          isPublished: q.isPublished,
          subjectId: q.subjectId,
          categoryId: q.categoryId,
          chapterId: q.chapterId,
        },
      });
    }
    console.log('   ✔ Quizzes seeded.');

    // 5. Seed Questions & Options
    console.log(`❓ Seeding ${SEED_QUESTIONS.length} Questions with Options & Explanations...`);
    for (const q of SEED_QUESTIONS) {
      await prisma.question.upsert({
        where: { id: q.id },
        update: {
          quizId: q.quizId,
          chapterId: q.chapterId,
          text: q.text,
          explanation: q.explanation,
          marks: q.marks,
          negativeMarks: q.negativeMarks,
          difficulty: q.difficulty,
        },
        create: {
          id: q.id,
          quizId: q.quizId,
          chapterId: q.chapterId,
          text: q.text,
          explanation: q.explanation,
          marks: q.marks,
          negativeMarks: q.negativeMarks,
          difficulty: q.difficulty,
        },
      });

      // Seed options for this question
      for (const opt of q.options) {
        await prisma.option.upsert({
          where: { id: opt.id },
          update: {
            questionId: q.id,
            optionLetter: opt.optionLetter,
            text: opt.text,
            isCorrect: opt.isCorrect,
          },
          create: {
            id: opt.id,
            questionId: q.id,
            optionLetter: opt.optionLetter,
            text: opt.text,
            isCorrect: opt.isCorrect,
          },
        });
      }
    }
    console.log('   ✔ Questions and Options seeded.');

    // 6. Seed Users
    console.log(`👥 Seeding ${SEED_USERS.length} Users (Admin, Instructors, Aspirants)...`);
    for (const user of SEED_USERS) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {
          name: user.name,
          email: user.email,
          phone: user.phone,
          passwordHash: user.passwordHash,
          avatarUrl: user.avatarUrl,
          role: user.role,
          isPremium: user.isPremium,
        },
        create: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          passwordHash: user.passwordHash,
          avatarUrl: user.avatarUrl,
          role: user.role,
          isPremium: user.isPremium,
        },
      });
    }
    console.log('   ✔ Users seeded.');

    // 7. Seed Subscriptions
    console.log(`💎 Seeding ${SEED_SUBSCRIPTIONS.length} Subscriptions...`);
    for (const sub of SEED_SUBSCRIPTIONS) {
      await prisma.subscription.upsert({
        where: { id: sub.id },
        update: {
          userId: sub.userId,
          planType: sub.planType,
          price: sub.price,
          status: sub.status,
          startDate: sub.startDate,
          endDate: sub.endDate,
          autoRenew: sub.autoRenew,
        },
        create: {
          id: sub.id,
          userId: sub.userId,
          planType: sub.planType,
          price: sub.price,
          status: sub.status,
          startDate: sub.startDate,
          endDate: sub.endDate,
          autoRenew: sub.autoRenew,
        },
      });
    }
    console.log('   ✔ Subscriptions seeded.');

    // 8. Seed Payments
    console.log(`💳 Seeding ${SEED_PAYMENTS.length} Payments (bKash, Nagad, Upay)...`);
    for (const pay of SEED_PAYMENTS) {
      await prisma.payment.upsert({
        where: { id: pay.id },
        update: {
          userId: pay.userId,
          subscriptionId: pay.subscriptionId,
          quizId: pay.quizId,
          amount: pay.amount,
          currency: pay.currency,
          provider: pay.provider,
          transactionId: pay.transactionId,
          status: pay.status,
        },
        create: {
          id: pay.id,
          userId: pay.userId,
          subscriptionId: pay.subscriptionId,
          quizId: pay.quizId,
          amount: pay.amount,
          currency: pay.currency,
          provider: pay.provider,
          transactionId: pay.transactionId,
          status: pay.status,
        },
      });
    }
    console.log('   ✔ Payments seeded.');

    // 9. Seed Quiz Attempts
    console.log(`📊 Seeding ${SEED_ATTEMPTS.length} Quiz Attempts...`);
    for (const att of SEED_ATTEMPTS) {
      await prisma.quizAttempt.upsert({
        where: { id: att.id },
        update: {
          userId: att.userId,
          quizId: att.quizId,
          score: att.score,
          totalMarks: att.totalMarks,
          correctCount: att.correctCount,
          wrongCount: att.wrongCount,
          skippedCount: att.skippedCount,
          negativeDeducted: att.negativeDeducted,
          accuracyPercentage: att.accuracyPercentage,
          timeSpentSeconds: att.timeSpentSeconds,
          passed: att.passed,
          status: att.status,
        },
        create: {
          id: att.id,
          userId: att.userId,
          quizId: att.quizId,
          score: att.score,
          totalMarks: att.totalMarks,
          correctCount: att.correctCount,
          wrongCount: att.wrongCount,
          skippedCount: att.skippedCount,
          negativeDeducted: att.negativeDeducted,
          accuracyPercentage: att.accuracyPercentage,
          timeSpentSeconds: att.timeSpentSeconds,
          passed: att.passed,
          status: att.status,
        },
      });
    }
    console.log('   ✔ Quiz Attempts seeded.');

    // 10. Seed Leaderboards
    console.log(`🏆 Seeding ${SEED_LEADERBOARD.length} Leaderboard Entries...`);
    for (const lb of SEED_LEADERBOARD) {
      await prisma.leaderboard.upsert({
        where: {
          quizId_userId: {
            quizId: lb.quizId,
            userId: lb.userId,
          },
        },
        update: {
          score: lb.score,
          accuracy: lb.accuracy,
          timeSpentSeconds: lb.timeSpentSeconds,
          rank: lb.rank,
        },
        create: {
          id: lb.id,
          quizId: lb.quizId,
          userId: lb.userId,
          score: lb.score,
          accuracy: lb.accuracy,
          timeSpentSeconds: lb.timeSpentSeconds,
          rank: lb.rank,
        },
      });
    }
    console.log('   ✔ Leaderboard seeded.');

    // 11. Seed Bookmarks & Notifications
    console.log(`🔖 Seeding Bookmarks and Notifications...`);
    for (const bm of SEED_BOOKMARKS) {
      await prisma.bookmark.upsert({
        where: { id: bm.id },
        update: {
          userId: bm.userId,
          quizId: bm.quizId,
          questionId: bm.questionId,
        },
        create: {
          id: bm.id,
          userId: bm.userId,
          quizId: bm.quizId,
          questionId: bm.questionId,
        },
      });
    }

    for (const n of SEED_NOTIFICATIONS) {
      await prisma.notification.upsert({
        where: { id: n.id },
        update: {
          userId: n.userId,
          title: n.title,
          message: n.message,
          type: n.type,
          isRead: n.isRead,
        },
        create: {
          id: n.id,
          userId: n.userId,
          title: n.title,
          message: n.message,
          type: n.type,
          isRead: n.isRead,
        },
      });
    }
    console.log('   ✔ Bookmarks and Notifications seeded.');

    const elapsed = Date.now() - startTime;
    console.log('\n======================================================');
    console.log(`🎉 Prisma Seed Completed Successfully in ${elapsed}ms!`);
    console.log('======================================================');
    console.log('\nNow you can inspect all tables in Prisma Studio:');
    console.log('👉 Run: npx prisma studio');
    console.log('👉 Open: http://localhost:5555 in your local browser\n');
  } catch (err: any) {
    console.warn('\n⚠️  Could not connect to live PostgreSQL server.');
    console.warn('Reason:', err.message || err);

    // Save fallback snapshot so the application has exported data ready
    const exportPath = path.join(process.cwd(), 'prisma', 'seed-data-export.json');
    const snapshot = {
      timestamp: new Date().toISOString(),
      models: {
        User: SEED_USERS,
        Subject: SEED_SUBJECTS,
        Category: SEED_CATEGORIES,
        Chapter: SEED_CHAPTERS,
        Quiz: SEED_QUIZZES,
        Question: SEED_QUESTIONS,
        Subscription: SEED_SUBSCRIPTIONS,
        Payment: SEED_PAYMENTS,
        QuizAttempt: SEED_ATTEMPTS,
        Leaderboard: SEED_LEADERBOARD,
        Bookmark: SEED_BOOKMARKS,
        Notification: SEED_NOTIFICATIONS,
      },
    };
    fs.writeFileSync(exportPath, JSON.stringify(snapshot, null, 2), 'utf-8');
    console.log(`📦 Fallback data exported to: ${exportPath}`);
    console.log('\n💡 TO CONNECT TO A REAL POSTGRESQL DATABASE & RUN PRISMA STUDIO:');
    console.log('1. Set your DATABASE_URL in .env:');
    console.log('   DATABASE_URL="postgresql://username:password@localhost:5432/exampro?schema=public"');
    console.log('2. Push schema to PostgreSQL:');
    console.log('   npx prisma db push');
    console.log('3. Run Seed again:');
    console.log('   npx prisma db seed');
    console.log('4. Launch Prisma Studio:');
    console.log('   npx prisma studio --port 5555\n');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
