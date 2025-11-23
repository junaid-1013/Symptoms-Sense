import { Award, BarChartIcon, Bot, Building, Clock, HelpCircleIcon, Shield, Star, Stethoscope, UserCircle, Workflow, Pill} from "lucide-react";

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
        icon: Stethoscope,
        title: "Disease Diagnosis & Recommendation",
        description:
            "Experience precise disease diagnosis and personalized recommendations, empowering you to take control of your well-being with expert guidance.",
        badge: "AI-Powered",
        color: "text-primary",
    },
    {
        icon: Bot,
        title: "Customized AI Medical Chatbot",
        description:
            "Unlock the future of healthcare with our custom AI Medical Chatbot Development, designed to cater to your unique healthcare needs.",
        badge: "24/7 Available",
        color: "text-primary",
    },
    {
        icon: Workflow,
        title: "Seamless Integration",
        description:
            "Streamline healthcare interactions with seamless chatbot integration, enhancing communication and support while saving time and resources.",
        badge: "Enterprise Ready",
        color: "text-primary",
    },
]
export const TEAM_MEMBERS = [
    {
        id: 1,
        name: "Khubaib Mashood",
        title: "Software Engineer",
        imageSrc: "/khubaib.jpg",
    },
    {
        id: 2,
        name: "Junaid Ali Bhatti",
        title: "Software Engineer",
        imageSrc: "/junaid.jpg",
    },
    {
        id: 3,
        name: "Asadullah Rind",
        title: "Software Engineer",
        imageSrc: "/asadullah.jpg",
    },
    {
        id: 4,
        name: "Muhammad Muzammil",
        title: "Software Engineer",
        imageSrc: "/muzzi.jpg",
    },
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
    { label: "Chat", href: "/#chat" },
    { label: "Services", href: "/#services" },
    { label: "Testimonials", href: "/#feedback" },
    { label: "Contact Us", href: "/#contact-us" },
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
    "Physiotherapist",
    "Anesthesiologist",
];
export const DOCTOR_CAROUSEL_STATS = [
    { icon: Star, label: "4.9 Average Rating", value: "4.9/5" },
    { icon: Shield, label: "All Verified", value: "100%" },
    { icon: Clock, label: "Avg Response Time", value: "< 2hrs" },
    { icon: Award, label: "Board Certified", value: "98%" }
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
