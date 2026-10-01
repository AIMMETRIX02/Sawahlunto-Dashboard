import React from 'react'
import { Users, CheckCircle2, Clock, Target } from 'lucide-react'

interface SummaryCardsProps {
  totalStudents: number
  passedStudents: number
  failedStudents: number
  passRate: number
  pendingStudents?: number
}

export function SummaryCards({
  totalStudents,
  passedStudents,
  failedStudents,
  pendingStudents = 0,
}: SummaryCardsProps) {
  const cards = [
    {
      title: 'Total Evaluasi Ujian',
      value: totalStudents,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      title: 'Kompeten (Disetujui)',
      value: passedStudents,
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      title: 'Sedang Ditinjau',
      value: pendingStudents,
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30'
    },
    {
      title: 'Belum Kompeten',
      value: failedStudents,
      icon: Target,
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-100 dark:bg-rose-900/30'
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
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">{card.title}</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">{card.value}</h3>
          </div>
        </div>
      ))}
    </div>
  )
}
