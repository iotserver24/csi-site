import { motion } from 'framer-motion'
import Image from 'next/image'
import type { TeamMember } from '../../types'
const Linkedin: React.FC<React.SVGProps<SVGSVGElement> & { size?: number }> = (props) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>);
const Github: React.FC<React.SVGProps<SVGSVGElement> & { size?: number }> = (props) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>);

interface StudentCardProps {
  member: TeamMember
  index: number
  onClick: (member: TeamMember) => void
}

const StudentCard = ({ member, index, onClick }: StudentCardProps) => {
  const displayRole = member?.roleDetails?.position || member?.role || 'Member'
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      onClick={() => onClick(member)}
      className="cursor-pointer group"
    >
      <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-black
                      ring-1 ring-black/5 dark:ring-white/5
                      hover:ring-primary-500/30 transition-all duration-300">
        
        <Image
          src={member.imageSrc}
          alt={member.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          unoptimized
          className="w-full h-full object-cover group-hover:scale-[1.04] 
                     transition-transform duration-500"
        />

        {/* Always visible bottom strip */}
        <div className="absolute bottom-0 inset-x-0 p-4 
                        bg-gradient-to-t from-black/90 via-black/60 to-transparent">
          <h3 className="text-sm font-semibold text-white leading-snug">{member.name}</h3>
          <p className="text-xs text-yellow-400 font-medium mt-0.5">{displayRole}</p>
        </div>

        {/* Hover reveal — social links only */}
        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100
                        transition-opacity duration-300 flex items-end justify-end p-4">
          <div className="flex gap-2">
            {member.linkedin && member.linkedin !== '#' && (
              <a href={member.linkedin} target="_blank" onClick={(e: React.MouseEvent) => e.stopPropagation()}
                 className="p-2 rounded-lg bg-white/10 hover:bg-white/20 
                            border border-white/10 transition-colors">
                <Linkedin size={16} className="text-white" />
              </a>
            )}
            {member.github && member.github !== '#' && (
              <a href={member.github} target="_blank" onClick={(e: React.MouseEvent) => e.stopPropagation()}
                 className="p-2 rounded-lg bg-white/10 hover:bg-white/20 
                            border border-white/10 transition-colors">
                <Github size={16} className="text-white" />
              </a>
            )}
          </div>
        </div>

        {displayRole === 'President' && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-md 
                          bg-yellow-400/90 backdrop-blur-sm">
            <span className="text-[10px] font-bold text-yellow-900 tracking-wide uppercase">
              President
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default StudentCard
