import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

const activities = [
  {
    numeral: '01',
    title: 'Technical Workshops',
    description: 'Hands-on learning with industry experts covering cutting-edge technologies from AI to cloud computing.',
    count: '30+',
    countLabel: 'Workshops',
  },
  {
    numeral: '02',
    title: 'Hackathons & Competitions',
    description: 'Intense coding challenges and innovation sprints that push your problem-solving limits.',
    count: '10+',
    countLabel: 'Hackathons',
  },
  {
    numeral: '03',
    title: 'Guest Lectures & Talks',
    description: 'Insights from tech leaders, alumni, and industry pioneers sharing real-world experience.',
    count: '20+',
    countLabel: 'Lectures',
  },
  {
    numeral: '04',
    title: 'Project Exhibitions',
    description: 'A platform to showcase your innovations, get feedback, and connect with fellow builders.',
    count: '15+',
    countLabel: 'Projects',
  },
]

const Features: React.FC = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section className="py-28 relative bg-zinc-50 dark:bg-zinc-900/30" ref={ref}>
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="heading-2 mb-4 text-gray-900 dark:text-white">
            What We Offer
          </h2>
          <p className="body-text max-w-3xl mx-auto">
            A structured ecosystem of activities designed to build technical depth, professional skills, and lasting connections.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-x-16 gap-y-0">
          {activities.map((item, index) => (
            <motion.div
              key={item.numeral}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="flex gap-6 group pl-4 border-l-2 border-transparent 
                         hover:border-primary-400 transition-colors duration-300 py-10"
            >
              <div className="shrink-0 pt-1">
                <span className="text-4xl font-bold font-display text-gray-200 dark:text-gray-800 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors duration-300">
                  {item.numeral}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-4">
                  {item.description}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold font-display text-primary-500">{item.count}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{item.countLabel}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}

export default Features
