import type { MessageItem } from '../../components/message-list';

/** A message in the demo mailbox: MessageItem plus where it lives and its body. */
export type Mail = MessageItem & {
  folder: FolderId;
  /** Who it went to, for the reading pane. */
  to: string;
  /** Paragraphs of the body. */
  body: string[];
};

export type FolderId = 'inbox' | 'sent' | 'drafts' | 'archive';

export const folders: { id: FolderId; label: string }[] = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'sent', label: 'Sent' },
  { id: 'drafts', label: 'Drafts' },
  { id: 'archive', label: 'Archive' },
];

const senders = [
  'Ana Ruiz',
  'Northwind Traders',
  'Sam Lee',
  'Acme Corp',
  'Kim Park',
  'Globex Billing',
  'Initech',
  'Wonka Foods',
];
const subjects = [
  ['INV-{n} paid', 'Thanks! Payment went out this morning.'],
  [
    'Question about the tax line',
    'The invoice shows GST twice, can you check?',
  ],
  ['New PO for next month', 'Attached is a new PO. Same terms as last time.'],
  ['Remittance advice', 'Please find attached our remittance for this week.'],
  ['Re: Late fee', 'Understood, we will pay the balance by Friday.'],
  [
    'Your statement is ready',
    'Your monthly statement is available in the portal.',
  ],
  ['Dispute: INV-{n}', 'We were charged for 12 licences but only use 10.'],
  [
    'Change of billing address',
    'From next month, please send invoices to our new office.',
  ],
] as const;

/**
 * A predictable demo mailbox (no randomness, so screenshots and tests are stable):
 * 60 inbox messages, newest first, every third one unread, plus a few in other folders.
 */
export function makeMailbox(): Mail[] {
  const inbox = Array.from({ length: 60 }, (_, i): Mail => {
    const [subject, preview] = subjects[i % subjects.length];
    const n = 1100 - i;
    const day = 30 - Math.floor(i / 3);
    return {
      id: `m${i + 1}`,
      folder: 'inbox',
      from: senders[i % senders.length],
      to: 'billing@acme.example',
      subject: subject.replace('{n}', String(n)),
      preview,
      date: i < 3 ? `${9 - i}:4${i} AM` : `Oct ${Math.max(day, 1)}`,
      dateTime: `2026-10-${String(Math.max(day, 1)).padStart(2, '0')}`,
      unread: i % 3 === 0,
      body: [
        `Hi,`,
        preview,
        `Let me know if you need anything else.`,
        `${senders[i % senders.length]}`,
      ],
    };
  });
  const other: Mail[] = [
    {
      id: 's1',
      folder: 'sent',
      from: 'Me',
      to: 'Ana Ruiz',
      subject: 'Receipt for INV-1100',
      preview: 'Thanks for your payment.',
      date: 'Oct 30',
      dateTime: '2026-10-30',
      body: ['Hi Ana,', 'Thanks for your payment. Your receipt is attached.'],
    },
    {
      id: 's2',
      folder: 'sent',
      from: 'Me',
      to: 'Initech',
      subject: 'Re: Dispute: INV-1094',
      preview: 'We have issued a credit note for 2 licences.',
      date: 'Oct 28',
      dateTime: '2026-10-28',
      body: ['Hello,', 'We have issued a credit note for 2 licences.'],
    },
    {
      id: 'd1',
      folder: 'drafts',
      from: 'Me',
      to: 'Northwind Traders',
      subject: 'Re: Question about the tax line',
      preview: 'You are right, the GST line was',
      date: 'Oct 29',
      dateTime: '2026-10-29',
      body: ['You are right, the GST line was'],
    },
  ];
  return [...inbox, ...other];
}
