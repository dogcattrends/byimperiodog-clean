'use client'

import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button';

interface ErrorStateProps {
 title: string
 description: string
 actionLabel: string
 onAction: () => void
}

export default function ErrorState({ title, description, actionLabel, onAction }: ErrorStateProps) {
 return (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="flex flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50 p-8 text-center"
 >
 <h2 className="text-xl font-semibold text-red-800">{title}</h2>
 <p className="text-red-600">{description}</p>
 <Button
   onClick={onAction}
   variant="danger"
   analyticsPayload={{ placement: 'error-state', label: actionLabel }}
 >
   {actionLabel}
 </Button>
 </motion.div>
 )
}
