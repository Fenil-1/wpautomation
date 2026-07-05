import { PrismaClient } from '@prisma/client';

/**
 * Seed: 500 realistic Indian contacts, 20 groups, and random memberships.
 *
 * Idempotent: clears the three tables first, then regenerates. This dataset is
 * intended to back all later stages (broadcasts, analytics, etc.).
 *
 * Note: uses Math.random / Date.now — fine here (a one-off Node script, not a
 * deterministic workflow).
 */
const prisma = new PrismaClient();

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Krishna', 'Ishaan', 'Rohan',
  'Ananya', 'Diya', 'Aadhya', 'Saanvi', 'Pari', 'Anika', 'Navya', 'Myra', 'Aarohi', 'Ira',
  'Rahul', 'Amit', 'Priya', 'Sneha', 'Karan', 'Nikhil', 'Pooja', 'Deepak', 'Meera', 'Kavya',
  'Manish', 'Suresh', 'Ramesh', 'Anjali', 'Divya', 'Sanjay', 'Neha', 'Vikram', 'Isha', 'Tara',
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Gupta', 'Singh', 'Kumar', 'Reddy', 'Nair', 'Iyer', 'Rao',
  'Joshi', 'Mehta', 'Shah', 'Desai', 'Chopra', 'Malhotra', 'Bose', 'Das', 'Banerjee', 'Chauhan',
  'Agarwal', 'Kapoor', 'Menon', 'Pillai', 'Bhat', 'Naidu', 'Mishra', 'Yadav', 'Jain', 'Saxena',
];

const CITIES: Array<{ city: string; state: string }> = [
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'Delhi', state: 'Delhi' },
  { city: 'Bengaluru', state: 'Karnataka' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Kolkata', state: 'West Bengal' },
  { city: 'Ahmedabad', state: 'Gujarat' },
  { city: 'Surat', state: 'Gujarat' },
  { city: 'Jaipur', state: 'Rajasthan' },
  { city: 'Lucknow', state: 'Uttar Pradesh' },
  { city: 'Indore', state: 'Madhya Pradesh' },
  { city: 'Kochi', state: 'Kerala' },
  { city: 'Chandigarh', state: 'Punjab' },
  { city: 'Nagpur', state: 'Maharashtra' },
];

const BUSINESS_TYPES = [
  'Traders', 'Enterprises', 'Textiles', 'Electronics', 'Provisions', 'Jewellers', 'Motors',
  'Pharma', 'Hardware', 'Furniture', 'Agencies', 'Exports', 'Foods', 'Garments', 'Industries',
];

const GROUP_DEFS: Array<{ name: string; description: string; color: string }> = [
  { name: 'VIP Customers', description: 'High-value repeat customers', color: '#25D366' },
  { name: 'Wholesale Buyers', description: 'Bulk order clients', color: '#128C7E' },
  { name: 'Retail Buyers', description: 'Walk-in and small orders', color: '#34B7F1' },
  { name: 'Mumbai Region', description: 'Contacts based in Mumbai', color: '#FF6B6B' },
  { name: 'Delhi Region', description: 'Contacts based in Delhi NCR', color: '#F0A500' },
  { name: 'South Zone', description: 'Southern India contacts', color: '#6C5CE7' },
  { name: 'New Leads', description: 'Recently added prospects', color: '#00B894' },
  { name: 'Festive Offers', description: 'Festival campaign recipients', color: '#E17055' },
  { name: 'Loyalty Program', description: 'Enrolled loyalty members', color: '#FDCB6E' },
  { name: 'Pharma Clients', description: 'Pharmaceutical sector', color: '#0984E3' },
  { name: 'Textile Clients', description: 'Textile and garment sector', color: '#D63031' },
  { name: 'Electronics Dealers', description: 'Electronics resellers', color: '#00CEC9' },
  { name: 'Distributors', description: 'Regional distributors', color: '#A29BFE' },
  { name: 'Inactive', description: 'No interaction in 60+ days', color: '#B2BEC3' },
  { name: 'Premium Support', description: 'Priority support tier', color: '#E84393' },
  { name: 'Newsletter', description: 'Opted in for newsletters', color: '#55EFC4' },
  { name: 'Beta Testers', description: 'Early feature testers', color: '#74B9FF' },
  { name: 'Corporate', description: 'Corporate accounts', color: '#636E72' },
  { name: 'North Zone', description: 'Northern India contacts', color: '#FAB1A0' },
  { name: 'West Zone', description: 'Western India contacts', color: '#81ECEC' },
];

const CONTACT_COUNT = 500;
const GROUP_COUNT = GROUP_DEFS.length; // 20

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Random Indian 10-digit mobile number (starts 6–9). */
function randomPhone(): string {
  const first = pick(['6', '7', '8', '9']);
  let rest = '';
  for (let i = 0; i < 9; i += 1) rest += randomInt(0, 9);
  return `${first}${rest}`;
}

function daysAgo(maxDays: number): Date {
  return new Date(Date.now() - randomInt(0, maxDays) * 24 * 60 * 60 * 1000);
}

async function main(): Promise<void> {
  console.log('Clearing existing contacts/groups...');
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.contact.deleteMany();

  // --- Contacts ---
  const usedPhones = new Set<string>();
  const contactData = Array.from({ length: CONTACT_COUNT }, () => {
    let phone = randomPhone();
    while (usedPhones.has(phone)) phone = randomPhone();
    usedPhones.add(phone);

    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const location = pick(CITIES);
    const hasBusiness = Math.random() < 0.7;
    const messageCount = randomInt(0, 200);

    return {
      name: `${first} ${last}`,
      phoneNumber: phone,
      countryCode: '+91',
      businessName: hasBusiness ? `${last} ${pick(BUSINESS_TYPES)}` : null,
      city: location.city,
      state: location.state,
      notes: Math.random() < 0.2 ? 'Prefers WhatsApp over calls' : null,
      isBlocked: Math.random() < 0.05,
      isOptedOut: Math.random() < 0.08,
      lastInteractionAt: Math.random() < 0.8 ? daysAgo(90) : null,
      engagementScore: randomInt(0, 100),
      messageCount,
      replyCount: randomInt(0, messageCount),
      lastMessageAt: messageCount > 0 ? daysAgo(60) : null,
      lastReplyAt: Math.random() < 0.5 ? daysAgo(60) : null,
    };
  });

  await prisma.contact.createMany({ data: contactData });
  console.log(`Created ${CONTACT_COUNT} contacts.`);

  // --- Groups ---
  await prisma.group.createMany({ data: GROUP_DEFS });
  console.log(`Created ${GROUP_COUNT} groups.`);

  // --- Memberships (random assignments) ---
  const contacts = await prisma.contact.findMany({ select: { id: true } });
  const groups = await prisma.group.findMany({ select: { id: true } });

  const memberships: Array<{ contactId: string; groupId: string }> = [];
  for (const contact of contacts) {
    const groupCount = randomInt(0, 4);
    const shuffled = [...groups].sort(() => Math.random() - 0.5).slice(0, groupCount);
    for (const group of shuffled) {
      memberships.push({ contactId: contact.id, groupId: group.id });
    }
  }
  const created = await prisma.groupMember.createMany({
    data: memberships,
    skipDuplicates: true,
  });
  console.log(`Created ${created.count} group memberships.`);

  console.log('Seed complete.');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
