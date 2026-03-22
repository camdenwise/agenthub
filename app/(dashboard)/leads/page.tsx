import type { Lead } from '@/lib/leads-data'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { LeadsTable } from './LeadsTable'

export default async function LeadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!business) {
    return (
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Lead Pipeline</h1>
        <p className="mt-4 text-sm text-slate-500">No business found. Please complete setup first.</p>
      </div>
    )
  }

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })

  const typedLeads = (leads ?? []) as Lead[]

  return (
    <div className="flex flex-col">
      <div className="shrink-0">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Lead Pipeline
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Website form submissions with AI-powered instant follow-ups.
        </p>
      </div>

      {typedLeads.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-12 shadow-sm">
          <p className="text-slate-500">No leads yet.</p>
          <p className="mt-1 text-sm text-slate-400">
            Leads from your website contact form will appear here.
          </p>
        </div>
      ) : (
        <LeadsTable leads={typedLeads} />
      )}
    </div>
  )
}
