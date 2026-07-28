import { motion } from 'framer-motion'
import FacultyCard from './FacultyCard'
import type { FacultyMember } from '../../types'

interface FacultyGridProps {
  faculty: FacultyMember[]
}

const FacultyGrid = ({ faculty }: FacultyGridProps) => {
  return (
    <motion.div
      key="faculty"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {faculty.map((member, index) => (
        <FacultyCard key={member.name} member={member} index={index} />
      ))}
    </motion.div>
  )
}

export default FacultyGrid
