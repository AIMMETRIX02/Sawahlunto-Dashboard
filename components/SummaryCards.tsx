import { Users, CheckCircle2, TrendingUp, Target } from 'lucide-react'

interface SummaryCardsProps {
  totalStudents: number
  averageScore: number
  highestScore: number
  passRate: number
}

export function SummaryCards({ totalStudents, averageScore, highestScore, passRate }: SummaryCardsProps) {
  const cards = [
    {
      title: 'Total Peserta Diklat',
      value: totalStudents,
      icon: Users,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30'
    },
    {
      title: 'Rata-rata Benar',
      value: averageScore.toFixed(1),
      icon: TrendingUp,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
      title: 'Skor Tertinggi',
      value: highestScore,
      icon: Target,
      color: 'text-amber-600 dark:text-amber-500',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30'
    },
    {
      title: 'Tingkat Kelulusan',
      value: `${passRate.toFixed(0)}%`,
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, index) => (
        <div key={index} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex items-center transition-colors">
          <div className={`${card.bgColor} p-4 rounded-xl mr-4 transition-colors`}>
            <card.icon className={`h-6 w-6 ${card.color}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{card.title}</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</h3>
          </div>
        </div>
      ))}
    </div>
  )
}
