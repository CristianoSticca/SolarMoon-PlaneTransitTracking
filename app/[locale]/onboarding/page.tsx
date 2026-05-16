import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingSteps } from '@/components/onboarding/OnboardingSteps'
import { getTranslations } from 'next-intl/server'

export default async function OnboardingPage({
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

  const t = await getTranslations('app')

  return (
    <div className="min-h-dvh max-w-md mx-auto p-6 flex flex-col justify-center">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🌙</div>
        <h1 className="text-2xl font-bold" style={{ color: '#e8eaf0' }}>{t('name')}</h1>
        <p className="text-sm mt-1" style={{ color: '#8892a4' }}>{t('tagline')}</p>
      </div>
      <OnboardingSteps userId={user.id} locale={locale} />
    </div>
  )
}
