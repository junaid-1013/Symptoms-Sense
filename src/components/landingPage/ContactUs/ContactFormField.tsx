import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ContactFormFieldProps } from "@/types";

export default function ContactFormField({ id, label, type = "text", placeholder, register, error, icon }: ContactFormFieldProps) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id} className="text-sm font-medium flex items-center gap-2">
                {icon && <span className="text-muted-foreground">{icon}</span>}
                {label}
                <span className="text-destructive">*</span>
            </Label>
            <Input
                id={id}
                type={type}
                placeholder={placeholder}
                className={`transition-all duration-200 ${error
                    ? 'border-destructive focus:ring-destructive'
                    : 'hover:border-primary/50 focus:border-primary'
                    }`}
                {...register}
            />
            {error && (
                <p className="text-sm text-destructive flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-destructive rounded-full" />
                    {error.message}
                </p>
            )}
        </div>
    );
}