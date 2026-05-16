import { getTranslations } from 'next-intl/server'
import { GuideContent } from '@/components/guide/GuideContent'
import { AppHeader } from '@/components/layout/AppHeader'

export default async function GuidePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('guide')

  return (
    <div className="min-h-dvh max-w-md mx-auto pb-8">
      <AppHeader pageLabel="Guida" />
      <div className="px-4 pt-2">
        <GuideContent />
      </div>
    </div>
  )
}
