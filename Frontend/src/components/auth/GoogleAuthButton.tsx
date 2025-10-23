"use client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { GetGoogleAuthUrlApi } from "@/endPoints/auth.endPoints";
import Image from "next/image";

interface GoogleAuthButtonProps {
    label?: string;
    className?: string;
}

const GoogleAuthButton = ({ label = "Continue with Google", className = "" }: GoogleAuthButtonProps) => {
    const { toast } = useToast();

    const handleGoogleLogin = async () => {
        try {
            const response = await GetGoogleAuthUrlApi();
            const authUrl: string = response.data?.auth_url;
            if (authUrl) {
                window.location.href = authUrl;
            } else {
                throw new Error("Auth URL not received");
            }
        } catch (error) {
            toast({
                title: "Failed!",
                description: "Unable to start Google login.",
                variant: "destructive",
            })
        }
    }

    return (
        <Button
            onClick={handleGoogleLogin}
            variant={"outline"}
            className={`gap-x-2 w-full ${className}`}
        >
            <Image src="/google.svg" alt="google" width={18} height={18} />
            <span className="text-sm text-gray-700">{label}</span>
        </Button>
    )
}

export default GoogleAuthButton;