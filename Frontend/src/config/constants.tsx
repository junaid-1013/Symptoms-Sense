import { Award, BarChartIcon, Bot, Building, Clock, HelpCircleIcon, Shield, Star, Stethoscope, UserCircle, Pill} from "lucide-react";

export const MEDICINE_TYPES = [
    "Tablet",
    "Capsule",
    "Liquid",
    "Drops",
    "Inhaler",
    "Injection",
    "Emulsion",
]
export const SERVICES = [
    {
        icon: Bot,
        title: "Explore Symptoms",
        description: "Ask questions, organize your symptoms, and learn what to discuss with a healthcare professional.",
        badge: "AI Guidance",
        color: "text-primary",
        href: "/chat-agent",
    },
    {
        icon: Stethoscope,
        title: "Find Doctors",
        description: "Browse doctors and specialties to find care that fits your needs.",
        badge: "Doctor Directory",
        color: "text-primary",
        href: "/doctors",
    },
    {
        icon: Pill,
        title: "Medicine Reminders",
        description: "Set a recurring schedule for the medicines you need to remember.",
        badge: "Stay Organized",
        color: "text-primary",
        href: "/medicineReminder",
    },
]
// Photos come from each member's GitHub avatar (github.com/<user>.png), so they update by themselves
// when the member changes their GitHub picture. `imageSrc` is an optional local fallback.
// A social icon only renders when its URL is set.
export const TEAM_MEMBERS: Array<{
    id: number;
    name: string;
    title: string;
    imageSrc?: string;
    linkedin?: string;
    github?: string;
}> = [
    {
        id: 1,
        name: "Junaid Ali Bhatti",
        title: "Software Engineer",
        imageSrc: "/junaid.jpg",
        github: "https://github.com/junaid-1013",
        linkedin: "https://www.linkedin.com/in/junaid-ali-bhatti-101452/",
    },
    {
        id: 2,
        name: "Dilawar Ali",
        title: "Software Engineer",
        github: "https://github.com/Dilawar4Ali",
        linkedin: "https://www.linkedin.com/in/dilawar-ali-thaheem-368707212/",
    },
    {
        id: 3,
        name: "Ayesha Mubashir",
        title: "Software Engineer",
        github: "https://github.com/ayeeshaa5",
        linkedin: "https://www.linkedin.com/in/ayesha-mubashir-008169275/",
    },
    {
        id: 4,
        name: "Humera Akmal",
        title: "Software Engineer",
        github: "https://github.com/humerahub",
        linkedin: "https://www.linkedin.com/in/humera-akmal-4a0b482a4/",
    }
]
export const CONTACT_INFO = {
    email: "support@symptomssense.com",
    phone: "+92 3065506950",
    address: {
        street: "House No. 123, Street No. 456",
        area: "Medical District, Health City",
        country: "Lahore, Pakistan"
    },
    hours: {
        weekdays: "Monday - Friday: 8:00 AM - 8:00 PM",
        weekends: "Saturday - Sunday: 9:00 AM - 5:00 PM",
        emergency: "24/7 Emergency Support Available"
    }
};
export const NAV_LINKS = [
    { label: "Home", href: "/" },
    { label: "Doctors", href: "/doctors" },
    { label: "Chat", href: "/chat-agent" },
    { label: "Services", href: "/#services" },
    { label: "Testimonials", href: "/#feedback" },
    { label: "Contact Us", href: "/#contact-us" },
    { label: "About", href: "/about" },
];
export const DOCTOR_CAROUSEL_STATS = [
    { icon: Star, label: "4.9 Average Rating", value: "4.9/5" },
    { icon: Shield, label: "All Verified", value: "100%" },
    { icon: Clock, label: "Avg Response Time", value: "< 2hrs" },
    { icon: Award, label: "Board Certified", value: "98%" }
];
export const USER_TYPES = [
    {
        id: "patient",
        title: "Patient",
        description: "Do you want to select your user type as Patient?",
        icon: Stethoscope,
        color: "text-red-500",
    },
    {
        id: "clinic",
        title: "Clinic",
        description: "Do you want to select your user type as Clinic?",
        icon: Building,
        color: "text-blue-500",
    },
]
export const GENDERS = ["Male", "Female", "Other"]
export const BLOOD_GROUPS = [
    "A+",
    "A-",
    "B+",
    "B-",
    "AB+",
    "AB-",
    "O+",
    "O-",
]
export const CLIINIC_SIDE_PANEL_ITEMS = {
    navMain: [
        {
            title: "Doctors",
            icon: Stethoscope,
        },
        {
            title: "Appointments",
            icon: BarChartIcon,
        },
        {
            title: "Medicines",
            icon: Pill,
        }
    ],
    navSecondary: [
        {
            title: "Go to Client Side",
            url: "/",
            icon: UserCircle,
        },
        {
            title: "Get Help",
            url: "/help",
            icon: HelpCircleIcon,
        },
    ],
}
export const DOCTOR_SPECIALIZATIONS = [
    "Cardiologist",
    "Dermatologist",
    "Neurologist",
    "Pediatrician",
    "Orthopedic Surgeon",
    "General Physician",
    "Gynecologist",
    "Dentist",
    "Psychiatrist",
    "Radiologist",
    "ENT Specialist",
    "Ophthalmologist",
    "Oncologist",
    "Urologist",
    "Endocrinologist",
    "Pulmonologist",
    "Nephrologist",
    "Gastroenterologist",
    "Rheumatologist",
    "Physiotherapist",
    "Anesthesiologist",
];
export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const APPOINTMENT_TYPES = [
    "Routine / Preventive",
    "Follow-up",
    "Diagnostic",
    "Urgent Care",
    "Emergency",
    "Specialist",
    "Telemedicine / Virtual",
    "Prenatal / Postnatal",
    "Medication Review"
];
