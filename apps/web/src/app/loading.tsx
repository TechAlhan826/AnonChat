'use client';
import { motion } from 'framer-motion';

export default function Loading() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-white dark:bg-black"
    >
      <div className="text-4xl font-bold">AnonChat</div> {/* Add logo SVG if wanted */}
      <motion.div 
        className="ml-2 h-8 w-8 border-4 border-t-transparent border-blue-500 rounded-full"
        animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </motion.div>
  );
}