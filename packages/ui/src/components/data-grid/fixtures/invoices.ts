/**
 * Demo data for DataGrid stories and tests: realistic invoices, 20 fields each.
 * Seeded, so every run produces the same rows (stable tests and screenshots).
 * Not exported from the package.
 */

export type Invoice = {
  id: string;
  number: string;
  customer: string;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Draft';
  issued: Date;
  due: Date;
  subtotal: number;
  tax: number;
  total: number;
  currency: 'CAD' | 'USD' | 'EUR';
  region: string;
  country: string;
  city: string;
  salesRep: string;
  terms: string;
  poNumber: string;
  category: string;
  items: number;
  marginPct: number;
  daysOutstanding: number;
};

/** Small deterministic PRNG (mulberry32). Same seed → same sequence. */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const customers = [
  'Northwind Traders',
  'Il1 Logistics Ltd.',
  'O0 Holdings Inc.',
  'Rocky Mtn Supply',
  'Prairie Grain Co-op',
  'Bow Valley Energy',
  'Chinook Analytics',
  'Peace River Freight',
  'Athabasca Tooling',
  'Lakeshore Medical',
  'Boreal Timber',
  'Aurora Software',
];
const statuses: Invoice['status'][] = [
  'Paid',
  'Paid',
  'Paid',
  'Pending',
  'Pending',
  'Overdue',
  'Draft',
];
const places = [
  ['West', 'Canada', 'Edmonton'],
  ['West', 'Canada', 'Calgary'],
  ['West', 'Canada', 'Vancouver'],
  ['Central', 'Canada', 'Toronto'],
  ['East', 'Canada', 'Montréal'],
  ['West', 'USA', 'Seattle'],
  ['Central', 'USA', 'Chicago'],
  ['East', 'USA', 'Boston'],
  ['EMEA', 'Germany', 'Berlin'],
  ['EMEA', 'Ireland', 'Dublin'],
] as const;
const reps = [
  'A. Okafor',
  'B. Nguyen',
  'C. Tremblay',
  'D. Singh',
  'E. Larsen',
  'F. Morales',
];
const terms = ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Due on receipt'];
const categories = [
  'Software',
  'Hardware',
  'Services',
  'Freight',
  'Consulting',
  'Maintenance',
];

export function makeInvoices(count: number, seed = 42): Invoice[] {
  const rand = mulberry32(seed);
  const pick = <T>(list: readonly T[]) =>
    list[Math.floor(rand() * list.length)] as T;
  const start = Date.UTC(2025, 0, 1);
  const today = Date.UTC(2026, 9, 3);

  return Array.from({ length: count }, (_, i) => {
    const issued = new Date(start + Math.floor(rand() * 640) * 86_400_000);
    const term = pick(terms);
    const termDays = term === 'Due on receipt' ? 0 : Number(term.split(' ')[1]);
    const due = new Date(issued.getTime() + termDays * 86_400_000);
    const subtotal = Math.round((50 + rand() * 49_950) * 100) / 100;
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const [region, country, city] = pick(places);
    return {
      id: `inv-${i + 1}`,
      number: `INV-${String(10_000 + i + 1)}`,
      customer: pick(customers),
      status: pick(statuses),
      issued,
      due,
      subtotal,
      tax,
      total: Math.round((subtotal + tax) * 100) / 100,
      currency:
        country === 'Canada' ? 'CAD' : country === 'USA' ? 'USD' : 'EUR',
      region,
      country,
      city,
      salesRep: pick(reps),
      terms: term,
      poNumber: `PO-${Math.floor(100_000 + rand() * 899_999)}`,
      category: pick(categories),
      items: 1 + Math.floor(rand() * 40),
      marginPct: Math.round((5 + rand() * 45) * 10) / 10,
      daysOutstanding: Math.max(
        0,
        Math.round((today - due.getTime()) / 86_400_000),
      ),
    };
  });
}
