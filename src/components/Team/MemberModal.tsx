import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, Mail, Phone, GraduationCap, Contact } from "lucide-react";
import type { TeamMember } from "../../types";

const Linkedin: React.FC<React.SVGProps<SVGSVGElement> & { size?: number }> = (props) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>);
const Github: React.FC<React.SVGProps<SVGSVGElement> & { size?: number }> = (props) => (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>);

interface MemberModalProps {
  member: TeamMember | null
  onClose: () => void
}

const MemberModal = ({ member, onClose }: MemberModalProps) => {
  if (!member) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 top-10 z-50 flex items-center justify-center backdrop-blur-lg"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 120, damping: 14 }}
          className="relative w-full max-w-4xl h-[80vh] rounded-2xl overflow-hidden bg-black/70 border border-white/20 shadow-2xl flex"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/20 transition-colors z-10"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-white/90 hover:text-white" />
          </button>

          {/* Left Side - Image */}
          <div className="w-1/2 relative hidden md:block">
            <Image
              src={member.imageSrc}
              alt={member.name}
              width={500}
              height={640}
              unoptimized
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute bottom-6 left-6">
              <h3 className="text-3xl font-bold text-white drop-shadow-md">
                {member.name}
              </h3>
              <p className="text-primary-300 font-medium">{member.role}</p>
            </div>
          </div>

          {/* Right Side - Info */}
          <div className="w-full md:w-1/2 h-full overflow-y-auto p-6 space-y-6">
            {/* Mobile Heading (only visible on small screens) */}
            <div className="md:hidden text-center mb-4">
              <h3 className="text-2xl font-bold text-white">{member.name}</h3>
              <p className="text-primary-300">{member.role}</p>
            </div>

            {/* About */}
            <div className="text-gray-300">
              <p className="text-lg font-semibold mb-2 text-primary-200">
                About
              </p>
              <div className="space-y-2 text-sm leading-relaxed">
                {(member.branch || member.year) && (
                  <p className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-primary-300" />
                    <span>
                      {member.branch}{member.branch && member.year ? ' • ' : ''}{member.year}
                    </span>
                  </p>
                )}
                {member.usn && (
                  <p className="flex items-center gap-2 text-gray-400">
                    <Contact className="w-4 h-4" />
                    <span>USN: {member.usn}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Skills */}
            <div>
              <p className="text-lg font-semibold mb-3 text-primary-200">
                Skills
              </p>
              {Array.isArray(member.skills) && member.skills.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {member.skills.map((skill) => (
                    <motion.span
                      key={skill}
                      whileHover={{
                        scale: 1.1,
                        boxShadow: "0 0 12px rgba(59,130,246,0.6)",
                      }}
                      className="px-4 py-1.5 text-sm rounded-full bg-gradient-to-r from-primary-500/20 to-cyber-blue/20 text-primary-100 border border-white/10 shadow-sm cursor-default"
                    >
                      {skill}
                    </motion.span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No skills added yet.</p>
              )}
            </div>

            {/* Bio */}
            {member.bio && (
              <div>
                <p className="text-lg font-semibold mb-2 text-primary-200">Bio</p>
                <p className="text-sm text-gray-300 leading-relaxed">{member.bio}</p>
              </div>
            )}

            {/* Contact */}
            {(member.email || member.phone) && (
              <div className="text-gray-300">
                <p className="text-lg font-semibold mb-2 text-primary-200">Contact</p>
                <div className="space-y-1 text-sm">
                  {member.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary-300" />
                      <a
                        href={`mailto:${member.email}`}
                        className="text-primary-300 hover:text-primary-200 underline-offset-2 hover:underline"
                      >
                        {member.email}
                      </a>
                    </p>
                  )}
                  {member.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-primary-300" />
                      <a
                        href={`tel:${member.phone}`}
                        className="text-primary-300 hover:text-primary-200 underline-offset-2 hover:underline"
                      >
                        {member.phone}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Socials */}
            {(member.linkedin || member.github) && (
              <div>
                <p className="text-lg font-semibold mb-2 text-primary-200">Socials</p>
                <div className="flex gap-6 text-sm">
                  {member.linkedin && member.linkedin !== '#' && (
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-primary-300 hover:text-primary-200 underline-offset-2 hover:underline"
                    >
                      <Linkedin className="w-4 h-4" />
                      <span>LinkedIn</span>
                    </a>
                  )}
                  {member.github && member.github !== '#' && (
                    <a
                      href={member.github}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-primary-300 hover:text-primary-200 underline-offset-2 hover:underline"
                    >
                      <Github className="w-4 h-4" />
                      <span>GitHub</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MemberModal;
