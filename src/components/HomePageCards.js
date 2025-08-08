import {
  FaDatabase,
  FaComments,
  FaTable,
  FaUpload,
  FaFolderOpen,
  FaSearch,
  FaFileAlt,
  FaCloudUploadAlt,
  FaEnvelopeOpenText,
  FaCogs
} from 'react-icons/fa';

const homepageCards = [
  {
    label: 'Document Databases',
    sublabel: 'Docs & AI Assistant',
    icon: <FaDatabase size={40} />,
    description:
      'Access and manage Geolabs’ internal knowledge base through a suite of tools designed for efficiency and accuracy. Leverage Gemini-powered AI to ask questions about employee handbooks, retirement plans, or custom databases. Navigate, upload, and administer structured document databases in a secure environment with real-time indexing and role-based access.',
    subpages: [
      {
        name: 'Ask AI',
        icon: <FaComments />,
        path: '/ask-ai',
        description:
          'Chat with an AI assistant trained on internal documents such as employee handbooks and HR policies. Get accurate, citation-backed answers instantly using natural language.',
      },
      {
        name: 'DB Viewer',
        icon: <FaTable />,
        path: '/db-viewer',
        description:
          'View and explore the contents of internal document databases. Ideal for read-only access during audits, training, or policy reviews.',
      },
      {
        name: 'DB Editor',
        icon: <FaUpload />,
        path: '/db-admin',
        description:
          'Upload new documents, extract and embed content, and manage database indexing. Only available to authorized users with editing permissions.',
      },
    ],
  },
  {
    label: 'Project Finder',
    sublabel: 'Geotechnical Reports',
    icon: <FaFolderOpen size={40} />,
    description:
      'Easily search and retrieve geotechnical reports from Geolabs’ archive using advanced filters, OCR-enhanced lookup, and AI ranking. This toolset supports field engineers, drafters, and office staff by streamlining project data discovery from S3 buckets and scanned documents. Designed for high performance, instant viewing, and secure access to technical records.',
    subpages: [
      {
        name: 'OCR Lookup',
        icon: <FaSearch />,
        path: '/ocr-lookup',
        description:
          'Extract work order numbers and project info from scanned or handwritten reports using AI-powered OCR. Great for digitizing legacy files.',
      },
      {
        name: 'S3 Viewer',
        icon: <FaFileAlt />,
        path: '/s3-viewer',
        description:
          'Browse and search through thousands of engineering reports stored on S3. Supports instant PDF loading and includes metadata preview.',
      },
      {
        name: 'S3 Editor',
        icon: <FaCloudUploadAlt />,
        path: '/s3-admin',
        description:
          'Manage the file system directly from your browser. Upload new reports, organize folders, and maintain S3 storage used for project archives.',
      },
    ],
  },
  {
    label: 'Admin',
    sublabel: 'System Management',
    icon: <FaCogs size={40} />,
    description:
      'View and manage user roles, monitor connected users, and configure system settings. Owners and Admins can assign permissions and control access across Geolabs tools.',
    path: '/admin',
  },
  {
    label: 'Contacts',
    sublabel: 'Support Info',
    icon: <FaEnvelopeOpenText size={40} />,
    description:
      'Need assistance? Reach out to Geolabs support for help with tools, document access, or technical questions. This section will soon include direct department contacts, help desk hours, and ticket submission options.',
    disabled: false,
  },
];

export default homepageCards;
