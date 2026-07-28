import { motion } from 'framer-motion'
import { EVENT_YEARS } from '../../constants/eventConstants'

interface Props {
  selectedYear: string
  setSelectedYear: (year: string) => void
  selectedType: string
  setSelectedType: (type: string) => void
}

const EventsNavigator = ({ selectedYear, setSelectedYear, selectedType: _selectedType, setSelectedType: _setSelectedType }: Props) => {
  return (
    <section className="pb-8">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-0 border-b border-gray-200 dark:border-gray-800 mb-8 overflow-x-auto no-scrollbar"
        >
          {EVENT_YEARS.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-4 py-4 text-sm font-medium transition-colors duration-200
                          border-b-2 rounded-none whitespace-nowrap
                          ${selectedYear === year 
                            ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
            >
              {year}-{(parseInt(year) + 1).toString().slice(2)}
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default EventsNavigator
