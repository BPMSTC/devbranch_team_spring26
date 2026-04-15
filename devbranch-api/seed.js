require('dotenv').config();

const crypto = require('crypto');

const { connectToDatabase } = require('./config/db');
const Investigator = require('./models/Investigator');

const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEY_LENGTH = 64;
const PBKDF2_DIGEST = 'sha512';

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derivedKey = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LENGTH, PBKDF2_DIGEST)
    .toString('hex');

  return `${salt}:${derivedKey}`;
}

const sharedPassword = 'Devbranch123!';

const sampleAccounts = [
  {
    username: 'devbranch',
    email: 'devbranch@devbranch.local',
    displayName: 'Devbranch',
    avatarIcon: '🔍',
    avatarColor: '#2d3a5c',
    investigatorRank: 'Lead Investigator',
    friends: ['casey.martin', 'rudi.wells'],
    casesCompleted: ['enterpriseDatacenter-breach', 'server-room-blackout'],
  },
  {
    username: 'casey.martin',
    email: 'casey.martin@devbranch.local',
    displayName: 'Casey Martin',
    avatarIcon: '🕵️',
    avatarColor: '#5c2d2d',
    investigatorRank: 'Detective',
    friends: ['devbranch', 'nora.adele'],
    casesCompleted: ['network-outage-07'],
  },
  {
    username: 'rudi.wells',
    email: 'rudi.wells@devbranch.local',
    displayName: 'Rudi Wells',
    avatarIcon: '🧩',
    avatarColor: '#1e4d2d',
    investigatorRank: 'Senior Detective',
    friends: ['devbranch'],
    casesCompleted: ['evidence-locker-a'],
  },
  {
    username: 'nora.adele',
    email: 'nora.adele@devbranch.local',
    displayName: 'Nora Adele',
    avatarIcon: '📋',
    avatarColor: '#3a1e4d',
    investigatorRank: 'Rookie',
    friends: ['casey.martin'],
    casesCompleted: [],
  },
];

async function upsertSampleAccount(account) {
  const passwordHash = hashPassword(sharedPassword);

  await Investigator.updateOne(
    { username: account.username },
    {
      $set: {
        email: account.email,
        displayName: account.displayName,
        passwordHash,
        avatarIcon: account.avatarIcon,
        avatarColor: account.avatarColor,
        investigatorRank: account.investigatorRank,
        friends: account.friends,
        casesCompleted: account.casesCompleted,
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );
}

async function main() {
  await connectToDatabase();

  for (const account of sampleAccounts) {
    await upsertSampleAccount(account);
  }

  const total = await Investigator.countDocuments({
    username: { $in: sampleAccounts.map((account) => account.username) },
  });

  console.log(`Seeded ${total} sample investigator accounts.`);
  console.log(`Shared login password for all seeded accounts: ${sharedPassword}`);

  await Investigator.db.close();
}

main().catch(async (error) => {
  console.error('Seed failed:', error.message);
  await Investigator.db.close().catch(() => {});
  process.exit(1);
});