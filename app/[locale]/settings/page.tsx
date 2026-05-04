import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from '@/components/settings/SettingsForm'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

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
    <div className="min-h-dvh max-w-md mx-auto p-4">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${locale}/monitor`} className="text-white/50 hover:text-white transition-colors text-lg">
          ←
        </Link>
        <h1 className="text-xl font-bold">{t('title')}</h1>
      </div>
      <SettingsForm initialPrefs={initialPrefs} userId={user.id} locale={locale} />
    </div>
  )
}
