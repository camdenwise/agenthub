/**
 * Lead types and mock data for the Leads pipeline.
 * Form submission fields can be extended per business—add optional keys to
 * FormSubmission or use a config-driven schema for custom interest forms.
 */

export type LeadStatus = 'new' | 'contacted' | 'follow_up' | 'converted'

export type FollowUpStatus = 'pending' | 'sent'

/** Base form fields many businesses collect. Add optional keys for custom interest forms. */
export type FormSubmission = {
  name: string
  email: string
  phone?: string
  interest: string
  referral?: string
  message?: string
  submitted: string
}

export type Lead = {
  id: string
  form: FormSubmission
  status: LeadStatus
  followUp: FollowUpStatus
  followUpSentAt?: string
  followUpEmail?: {
    subject: string
    body: string
  }
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  follow_up: 'Follow Up',
  converted: 'Converted',
}

const STATUS_CLASSES: Record<LeadStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-amber-100 text-amber-800',
  follow_up: 'bg-red-100 text-red-800',
  converted: 'bg-emerald-100 text-emerald-800',
}

export function getStatusLabel(status: LeadStatus): string {
  return STATUS_LABELS[status]
}

export function getStatusBadgeClass(status: LeadStatus): string {
  return STATUS_CLASSES[status]
}

/** Ordered list of form field keys for display (configurable per business later). */
export const DEFAULT_FORM_FIELD_ORDER: (keyof FormSubmission)[] = [
  'name',
  'email',
  'phone',
  'interest',
  'referral',
  'submitted',
  'message',
]

export const MOCK_LEADS: Lead[] = [
  {
    id: '1',
    form: {
      name: 'David Park',
      email: 'david.p@gmail.com',
      phone: '(704) 555-0123',
      interest: 'Annual membership + personal training',
      referral: 'Google',
      message: 'Interested in signing up for the year and adding personal training sessions.',
      submitted: 'Today, 9:30 AM',
    },
    status: 'new',
    followUp: 'pending',
  },
  {
    id: '2',
    form: {
      name: 'Emily Tran',
      email: 'emilyt@outlook.com',
      phone: '(704) 555-0456',
      interest: 'Student membership',
      referral: 'Friend',
      message: 'I\'m a student at UNC Charlotte. Do you offer student discounts?',
      submitted: 'Yesterday, 4:15 PM',
    },
    status: 'contacted',
    followUp: 'sent',
    followUpSentAt: 'Yesterday, 4:18 PM',
    followUpEmail: {
      subject: 'Iron Temple — Student Membership Info',
      body: `Hi Emily,

Thanks for reaching out! We do offer a discounted student membership with a valid student ID. You'll get 20% off our standard monthly rate.

Would you like to schedule a quick tour or try a free class? Reply to this email or give us a call.

Best,
Iron Temple Gym`,
    },
  },
  {
    id: '3',
    form: {
      name: 'Marcus Johnson',
      email: 'marcus.j@yahoo.com',
      phone: '(704) 555-0341',
      interest: 'Family plan',
      referral: 'Instagram',
      message:
        'My wife and I are looking for a gym we can go to together. We have two kids (ages 4 and 7). Do you have any family plans or childcare options?',
      submitted: 'Mar 4, 2:00 PM',
    },
    status: 'follow_up',
    followUp: 'sent',
    followUpSentAt: 'Mar 4, 2:05 PM',
    followUpEmail: {
      subject: 'Iron Temple Family Plan — Perfect for Your Crew!',
      body: `Hi Marcus,

Great to hear from you! We'd love to help you and your family find a fit that works for everyone.

We offer a Family Plan that includes two adult memberships and discounted rates for kids' programs. Our childcare facility is available for children ages 3–12 during select hours—perfect for your 4- and 7-year-olds while you and your wife work out.

Pricing and availability depend on the options you choose. The best next step is to schedule a quick tour so we can show you the space and walk you through the family options.

You can book a tour here: www.irontemple.com/tour

Looking forward to meeting the family!

– Iron Temple Gym`,
    },
  },
  {
    id: '4',
    form: {
      name: 'Rachel Kim',
      email: 'rkim@gmail.com',
      phone: '(704) 555-0789',
      interest: 'Free trial',
      referral: 'Facebook',
      message: 'I\'d like to try a free trial before committing to a membership.',
      submitted: 'Mar 3, 11:00 AM',
    },
    status: 'converted',
    followUp: 'sent',
    followUpSentAt: 'Mar 3, 11:05 AM',
    followUpEmail: {
      subject: 'Your Iron Temple Free Trial — Let\'s Get Started!',
      body: `Hi Rachel,

Thanks for your interest! We'd love to have you in for a free 3-day trial. No obligation—just come in, try our classes and equipment, and see if we're the right fit.

To get started, just bring a valid ID and stop by the front desk during our opening hours. You can also reply to this email to schedule a specific time if you prefer.

We can't wait to meet you!

– Iron Temple Gym`,
    },
  },
]
