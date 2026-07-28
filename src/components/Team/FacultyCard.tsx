import { motion } from 'framer-motion'
import Image from 'next/image'
import { Mail } from 'lucide-react'
import type { FacultyMember } from '../../types'

const Linkedin: React.FC<React.SVGProps<SVGSVGElement> & { size?: number }> = (props) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>);

interface FacultyCardProps {
  member: FacultyMember
  index: number
}

const FacultyCard = ({ member, index }: FacultyCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="h-full group"
    >
      <div className="h-full bg-white dark:bg-gray-900 rounded-2xl p-6 text-center 
                      border border-gray-100 dark:border-gray-800 
                      hover:border-primary-200 dark:hover:border-primary-900
                      transition-all duration-300">
        {/* Profile Image */}
        <div className="relative mb-6">
          <Image
            src={member.image}
            alt={member.name}
            width={112}
            height={112}
            unoptimized
            className="w-28 h-28 mx-auto rounded-full object-cover 
                       ring-2 ring-primary-400/40 dark:ring-primary-500/30
                       group-hover:ring-primary-500 transition-all duration-300"
          />
        </div>
        
        {/* Member Info */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{member.name}</h3>
        <p className="text-sm text-primary-600 dark:text-primary-400 font-medium mb-3">
          {member.role}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 tracking-wide uppercase mb-4">
          {member.department}
        </p>
        
        {/* Social Links */}
        <div className="flex justify-center gap-3 mt-auto">
          <a
            href={`mailto:${member.email}`}
            className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all"
            aria-label={`Email ${member.name}`}
          >
            <Mail size={18} />
          </a>
          <a
            href={member.linkedin}
            target="_blank"
            className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all"
            aria-label={`${member.name}'s LinkedIn`}
          >
            <Linkedin size={18} />
          </a>
        </div>
      </div>
    </motion.div>
  )
}

export default FacultyCard
