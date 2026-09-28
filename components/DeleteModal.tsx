import { Loader2, AlertTriangle } from 'lucide-react'

interface DeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  studentName: string
  isDeleting: boolean
}

export function DeleteModal({ isOpen, onClose, onConfirm, studentName, isDeleting }: DeleteModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center transition-colors">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Hapus Data?</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Anda yakin ingin menghapus data ujian atas nama <span className="font-semibold text-gray-900 dark:text-white">{studentName}</span>? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex justify-center space-x-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 w-full text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 font-medium transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 w-full text-white bg-red-600 rounded-xl hover:bg-red-700 font-medium transition-colors disabled:opacity-70 flex items-center justify-center shadow-sm"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 'Ya, Hapus'}
          </button>
        </div>
      </div>
    </div>
  )
}
