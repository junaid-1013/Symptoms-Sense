export interface ContactFormData {
    name: string
    email: string
    phone: number
    subject: string
    message: string
}
export interface ContactFormFieldProps {
    id: string;
    label: string;
    type?: string;
    placeholder: string;
    register: any;
    error?: any;
    icon?: React.ReactNode;
}
export interface ContactInfoItemProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    subValue?: string;
    className?: string;
}
export type SubmitStatus = "idle" | "loading" | "success" | "error";