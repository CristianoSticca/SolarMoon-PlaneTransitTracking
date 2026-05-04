import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/${locale}/login`)

  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('user_id, language')
    .eq('user_id', user.id)
    .single()

  if (!prefs) redirect(`/${locale}/onboarding`)
  const targetLocale = prefs.language ?? locale
  redirect(`/${targetLocale}/monitor`)
}
