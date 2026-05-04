import { getTranslations } from 'next-intl/server'
import { GuideContent } from '@/components/guide/GuideContent'
import Link from 'next/link'

export default async function GuidePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('guide')

  return (
    <div className="min-h-dvh max-w-md mx-auto p-4 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/${locale}/monitor`}
          className="text-white/50 hover:text-white transition-colors text-lg"
        >
          ←
        </Link>
        <h1 className="text-xl font-bold">{t('title')}</h1>
      </div>
      <GuideContent />
    </div>
  )
}
