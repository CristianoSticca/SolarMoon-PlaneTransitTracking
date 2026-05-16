import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from '@/components/settings/SettingsForm'
import { getTranslations } from 'next-intl/server'
import { AppHeader } from '@/components/layout/AppHeader'

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const t = await getTranslations('settings')

  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const initialPrefs = prefs ?? {
    language: locale,
    search_radius_km: 25,
    angular_margin_deg: 0.5,
    notification_lead_min: 3,
  }

  return (
    <div className="min-h-dvh max-w-md mx-auto">
      <AppHeader pageLabel="Settings" />
      <div className="px-4 pb-4">
        <SettingsForm initialPrefs={initialPrefs} userId={user.id} locale={locale} />
      </div>
    </div>
  )
}
