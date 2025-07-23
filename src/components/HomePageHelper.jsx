import { FaTools, FaBook, FaUserShield, FaEnvelope, FaEllipsisH, FaChartLine, FaFolderOpen } from 'react-icons/fa';

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
    label: 'Reports',
    sublabel: 'Project data',
    icon: <FaTools size={40} />,
    description: 'Ask questions and retrieve information from over 8,000 engineering reports using AI-powered tools. Filter by work order, location, and keyword to explore detailed geotechnical data.',
    linkText: 'View Reports →',
    link: '/reports',
  },
  {
    label: 'Employee Handbook',
    sublabel: 'Company policies',
    icon: <FaBook size={40} />,
    description: 'Explore company policies, onboarding resources, and workplace FAQs through an interactive AI chatbot. Designed to help new and existing employees find answers instantly.',
    linkText: 'Read Handbook →',
    link: '/employee',
  },
  {
    label: 'Retirement',
    sublabel: 'Retirement savings',
    icon: <FaChartLine size={40} />,
    description: 'Get instant answers about your 401K and ESOP plans. Learn about employer matching, vesting schedules, eligibility, and more using an intelligent chatbot trained on HR documents.',
    linkText: 'Ask Retirement →',
    link: '/retirement',
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
    label: 'Contact',
    sublabel: 'Reach us',
    icon: <FaEnvelope size={40} />,
    description: 'Feature coming soon. A centralized place to view contact information for team members, departments, and support services.',
    linkText: 'View Contacts →',
    link: '',
  },
];

export default homepageCards;
