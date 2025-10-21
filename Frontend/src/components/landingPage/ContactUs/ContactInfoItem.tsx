import { ContactInfoItemProps } from "@/types";

export default function ContactInfoItem({ icon, label, value, subValue, className = "" }: ContactInfoItemProps) {
    return (
        <div className={`flex items-start gap-3 ${className}`}>
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                {icon}
            </div>
            <div>
                <p className="text-sm opacity-90">{label}</p>
                <p className="font-semibold">{value}</p>
                {subValue && <p className="text-sm opacity-80">{subValue}</p>}
            </div>
        </div>
    );
}