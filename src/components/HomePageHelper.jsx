import { FaTools, FaBook, FaUserShield, FaEnvelope, FaEllipsisH, FaCogs, FaChartLine, FaLightbulb } from 'react-icons/fa';

const homepageCards = [
  {
    label: 'Reports',
    sublabel: 'Project data',
    icon: <FaTools size={40} />,
    description: 'Search and retrieve engineering reports quickly using AI-powered tools.',
    linkText: 'View Reports →',
    link: '/reports',
  },
  {
    label: 'Admin',
    sublabel: 'Admin tools',
    icon: <FaUserShield size={40} />,
    description: 'Access administrative tools for managing files, users, and configurations.',
    linkText: 'Admin Access →',
    link: '#admin',
  },
  {
    label: 'Employee Guide',
    sublabel: 'Company policies',
    icon: <FaBook size={40} />,
    description: 'Read through company policies, guidelines, and onboarding documents.',
    linkText: 'Read Handbook →',
    link: '#handbook',
  },
  {
    label: 'Contact',
    sublabel: 'Get in touch',
    icon: <FaEnvelope size={40} />,
    description: 'Reach out to Geolabs for support, questions, or collaboration opportunities.',
    linkText: 'Contact Us →',
    link: '#contact',
  },
  {
    label: 'AI Tools',
    sublabel: 'Productivity',
    icon: <FaCogs size={40} />,
    description: 'Explore our suite of intelligent tools that enhance engineering workflows.',
    linkText: 'Explore Tools →',
    link: '#ai-tools',
  },
  {
    label: 'Analytics',
    sublabel: 'Insights',
    icon: <FaChartLine size={40} />,
    description: 'View usage data and trends to gain deeper insights into your projects.',
    linkText: 'View Analytics →',
    link: '#analytics',
  },
  {
    label: 'More Coming...',
    sublabel: 'Under development',
    icon: <FaEllipsisH size={40} />,
    description: 'New tools and features are on the way. Check back soon!',
    linkText: '',
    link: '',
  },
  {
    label: 'More Coming...',
    sublabel: 'Under development',
    icon: <FaEllipsisH size={40} />,
    description: 'We’re working on expanding the platform to serve you better.',
    linkText: '',
    link: '',
  },
];

export default homepageCards;
