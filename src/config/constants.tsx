import { Bot, Stethoscope, Workflow } from "lucide-react"

export const MEDICINE_TYPES = [
    "tablet",
    "capsule",
    "liquid",
    "drops",
    "inhaler",
    "injection",
    "emulsion",
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