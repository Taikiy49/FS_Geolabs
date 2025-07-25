import { FaTools, FaBook, FaUserShield, FaEnvelope, FaEllipsisH, FaChartLine, FaFolderOpen, FaHandsHelping, FaRobot } from 'react-icons/fa';

const homepageCards = [
  {
    label: 'File System',
    sublabel: 'Read-only tools',
    icon: <FaFolderOpen size={40} />,  // ✅ Updated to reflect file access
    description: 'Browse engineering documents and metadata through a secure, read-only system. Ideal for general users who need access to reports without permission to upload or remove files.',
    linkText: 'Open File System →',
    link: '/file-system',
  },
  {
  label: 'Contextual Chatbot',
  sublabel: 'Interactive knowledge',
  icon: <FaRobot size={40} />,
  description: 'Chat with AI across various internal knowledge bases like the Employee Handbook, ESOP, or safety guides. Choose a specific document database and get fast, relevant answers tailored to that content.',
  linkText: 'Open Chatbot →',
  link: '/contextualchatbot',
  },

  {
    label: 'Reports',
    sublabel: 'Project data',
    icon: <FaTools size={40} />,
    description: 'Ask questions and retrieve information from over 8,000 engineering reports using AI-powered tools. Filter by work order, location, and keyword to explore detailed geotechnical data.',
    linkText: 'View Reports →',
    link: '/reports',
  },

  {
    label: 'Admin',
    sublabel: 'Management tools',
    icon: <FaUserShield size={40} />,
    description: 'Access file management and system control tools restricted to administrators. Add or delete reports, update chat data, and manage users across the Geolabs platform securely.',
    linkText: 'Go to Admin →',
    link: '/admin',
  },
  {
    label: 'More Coming...',
    sublabel: 'Under development',
    icon: <FaEllipsisH size={40} />,
    description: 'Stay tuned for upcoming tools. We’re building more features to help automate tasks, centralize data, and improve your experience with the Geolabs platform.',
    linkText: 'More Coming →',
    link: '',
  },
  {
    label: 'More Coming...',
    sublabel: 'Under development',
    icon: <FaEllipsisH size={40} />,
    description: 'Stay tuned for upcoming tools. We’re building more features to help automate tasks, centralize data, and improve your experience with the Geolabs platform.',
    linkText: 'More Coming →',
    link: '',
  },
  {
    label: 'More Coming...',
    sublabel: 'Under development',
    icon: <FaEllipsisH size={40} />,
    description: 'Stay tuned for upcoming tools. We’re building more features to help automate tasks, centralize data, and improve your experience with the Geolabs platform.',
    linkText: 'More Coming →',
    link: '',
  },
  {
    label: 'Contact',
    sublabel: 'Reach us',
    icon: <FaEnvelope size={40} />,
    description: 'Feature coming soon. A centralized place to view contact information for team members, departments, and support services.',
    linkText: 'View Contacts →',
    link: '',
  },
];

export default homepageCards;
