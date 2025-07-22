import { FaTools, FaBook, FaUserShield, FaEnvelope, FaEllipsisH, FaCogs, FaChartLine } from 'react-icons/fa';

const homepageCards = [
  {
    label: 'Reports',
    sublabel: 'Project data',
    icon: <FaTools size={40} />,
    description: 'Ask questions and retrieve project information from 8,000+ engineering reports using AI-powered tools.',
    linkText: 'View Reports →',
    link: '/reports',
  },
  {
    label: 'Handbook',
    sublabel: 'Company policies',
    icon: <FaBook size={40} />,
    description: 'Explore company policies, onboarding documents, and FAQs through an interactive AI chatbot.',
    linkText: 'Read Handbook →',
    link: '/employee',
  },
  {
    label: 'Admin',
    sublabel: 'Management tools',
    icon: <FaUserShield size={40} />,
    description: 'Feature coming soon.',
    linkText: '',
    link: '',
  },
  {
    label: 'Contact',
    sublabel: 'Reach us',
    icon: <FaEnvelope size={40} />,
    description: 'Feature coming soon.',
    linkText: '',
    link: '',
  },
  {
    label: 'AI Tools',
    sublabel: 'Smart features',
    icon: <FaCogs size={40} />,
    description: 'Feature coming soon.',
    linkText: '',
    link: '',
  },
  {
    label: 'Analytics',
    sublabel: 'Insights',
    icon: <FaChartLine size={40} />,
    description: 'Feature coming soon.',
    linkText: '',
    link: '',
  },
  {
    label: 'More Coming...',
    sublabel: 'Under development',
    icon: <FaEllipsisH size={40} />,
    description: 'Placeholder – more tools on the way.',
    linkText: '',
    link: '',
  },
  {
    label: 'More Coming...',
    sublabel: 'Under development',
    icon: <FaEllipsisH size={40} />,
    description: 'Placeholder – more features coming soon.',
    linkText: '',
    link: '',
  },
];

export default homepageCards;
