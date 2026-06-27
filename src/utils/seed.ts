import mongoose from 'mongoose';
import { User, UserRole, UserStatus } from '../models/User';
import { DailyQuiz, QuizStatus } from '../models/DailyQuiz';
import { MegaChallenge, ChallengeStatus } from '../models/MegaChallenge';
import { Winner, ContestType, WinnerStatus } from '../models/Winner';
import { env } from '../config/env';
import { logger } from './logger';
import { v4 as uuidv4 } from 'uuid';

const MOCK_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80'
];

const seedDatabase = async () => {
  try {
    const mongoUri = env.mongoUri;
    logger.info(`Connecting to database to seed: ${mongoUri.replace(/:([^@]+)@/, ':****@')}`);
    
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');

    // 1. Create or Find Admin
    let admin = await User.findOne({ mobile: '9999999999' });
    if (!admin) {
      admin = await User.create({
        name: 'Gyaan Chakra Admin',
        mobile: '9999999999',
        email: 'admin@gyaanchakra.com',
        password: 'AdminPassword123!', // This is hashed on model or just stored. Select is false by default.
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        referralCode: 'ADMINREF',
        walletBalance: 10000,
        isMobileVerified: true,
        isEmailVerified: true
      });
      logger.info('Created Super Admin User');
    } else {
      admin.role = UserRole.SUPER_ADMIN;
      await admin.save();
      logger.info('Found and updated Admin User');
    }

    // 2. Clear existing active quizzes/challenges to prevent duplicate conflicts
    await DailyQuiz.deleteMany({ status: QuizStatus.ACTIVE });
    await MegaChallenge.deleteMany({ status: ChallengeStatus.OPEN });
    logger.info('Cleared old active quizzes and challenges');

    // 3. Create Active Daily Quiz
    const dailyQuiz = await DailyQuiz.create({
      title: 'Daily Quiz #042',
      question: 'Which Indian festival is widely known as the festival of lights?',
      options: [
        { text: 'Holi', index: 0 },
        { text: 'Diwali', index: 1 },
        { text: 'Eid', index: 2 },
        { text: 'Navratri', index: 3 }
      ],
      correctAnswerIndex: 1,
      rewardAmount: 500,
      startTime: new Date(Date.now() - 3600 * 1000), // Started 1 hour ago
      endTime: new Date(Date.now() + 23 * 3600 * 1000), // Ends in 23 hours
      status: QuizStatus.ACTIVE,
      participantsCount: 142,
      correctAnswersCount: 98,
      createdBy: admin._id
    });
    logger.info(`Created active Daily Quiz: ${dailyQuiz.title}`);

    // 4. Create Active Mega Challenge
    const megaChallenge = await MegaChallenge.create({
      title: '₹1,00,000 Grand Showdown',
      description: 'Test your general knowledge with 10 challenging questions and qualify for the grand 1 Lakh prize!',
      rewardAmount: 100000,
      startDate: new Date(Date.now() - 3600 * 1000), // Started 1 hour ago
      endDate: new Date(Date.now() + 6 * 24 * 3600 * 1000), // Ends in 6 days
      status: ChallengeStatus.OPEN,
      totalParticipants: 356,
      shortlistedCount: 12,
      createdBy: admin._id,
      questions: [
        {
          question: 'What is the national animal of India?',
          options: ['Lion', 'Bengal Tiger', 'Elephant', 'Leopard'],
          correctAnswerIndex: 1,
          points: 10
        },
        {
          question: 'Which is the longest river in India?',
          options: ['Yamuna', 'Godavari', 'Ganges', 'Brahmaputra'],
          correctAnswerIndex: 2,
          points: 10
        },
        {
          question: 'Who is known as the Father of the Nation in India?',
          options: ['Jawaharlal Nehru', 'Mahatma Gandhi', 'Subhas Chandra Bose', 'B. R. Ambedkar'],
          correctAnswerIndex: 1,
          points: 10
        },
        {
          question: 'What is the capital of India?',
          options: ['Mumbai', 'Kolkata', 'Chennai', 'New Delhi'],
          correctAnswerIndex: 3,
          points: 10
        },
        {
          question: 'Which monument is one of the Seven Wonders of the World and located in Agra?',
          options: ['Red Fort', 'Taj Mahal', 'Qutub Minar', 'Hawa Mahal'],
          correctAnswerIndex: 1,
          points: 10
        },
        {
          question: 'Which Indian city is known as the Pink City?',
          options: ['Jaipur', 'Udaipur', 'Jodhpur', 'Jaisalmer'],
          correctAnswerIndex: 0,
          points: 10
        },
        {
          question: 'In which year did India gain independence from British rule?',
          options: ['1942', '1945', '1947', '1950'],
          correctAnswerIndex: 2,
          points: 10
        },
        {
          question: 'Which is the highest mountain peak in India?',
          options: ['Mount Everest', 'Kanchenjunga', 'Nanda Devi', 'K2'],
          correctAnswerIndex: 1,
          points: 10
        },
        {
          question: 'Who was the first President of India?',
          options: ['Dr. Rajendra Prasad', 'Dr. S. Radhakrishnan', 'Jawaharlal Nehru', 'Sardar Vallabhbhai Patel'],
          correctAnswerIndex: 0,
          points: 10
        },
        {
          question: 'What is the currency of India?',
          options: ['Indian Rupee', 'Dinar', 'Taka', 'Rupiah'],
          correctAnswerIndex: 0,
          points: 10
        }
      ]
    });
    logger.info(`Created active Mega Challenge: ${megaChallenge.title}`);

    // 5. Create Mock Winners
    await Winner.deleteMany({});
    
    // Create some mock users to be winners
    const winnersData = [
      { name: 'Arjun Sharma', city: 'Delhi', mobile: '9000000001' },
      { name: 'Priya Patel', city: 'Mumbai', mobile: '9000000002' },
      { name: 'Rohan Verma', city: 'Bangalore', mobile: '9000000003' },
      { name: 'Sneha Gupta', city: 'Kolkata', mobile: '9000000004' }
    ];

    for (let i = 0; i < winnersData.length; i++) {
      const wData = winnersData[i];
      let user = await User.findOne({ mobile: wData.mobile });
      if (!user) {
        user = await User.create({
          name: wData.name,
          mobile: wData.mobile,
          email: `${wData.name.toLowerCase().replace(' ', '')}@example.com`,
          password: 'Password123!',
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          city: wData.city,
          profilePhoto: MOCK_AVATARS[i % MOCK_AVATARS.length],
          referralCode: `MOCKREF${i}`,
          walletBalance: 250,
          isMobileVerified: true
        });
      }

      await Winner.create({
        contestType: ContestType.DAILY_QUIZ,
        contestId: dailyQuiz._id,
        userId: user._id,
        rewardAmount: 500,
        winnerStatus: WinnerStatus.ANNOUNCED,
        announcementDate: new Date(Date.now() - (i + 1) * 24 * 3600 * 1000), // Announced days ago
        drawId: uuidv4(),
        selectedBy: 'admin',
        selectedByAdminId: admin._id
      });
    }
    logger.info('Created mock winners history');

    logger.info('🎉 Database seeded successfully!');
  } catch (error) {
    logger.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
};

// If executing directly
if (require.main === module) {
  seedDatabase();
}
