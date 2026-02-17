"use client"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from "@/contextApis/UserContext"
import { LogoutApi } from "@/endPoints/auth.endPoints"
import { useRouter } from "next/navigation"

export function useLogout() {
    const { toast } = useToast()
    const { clearAuthData, tokens } = useUser()
    const router = useRouter()

    const onLogout = async () => {
        LogoutApi(tokens?.refreshToken || "")
            .then(() => {
                clearAuthData()
                toast({ title: "Success!", description: "Successfully logged out" })
                router.push("/login")
            })
            .catch((error: any) => {
                console.log("Logging out Failed", error?.message)
                toast({ title: "Failed!", description: "Logging out Failed", variant: "destructive" })
            })
    }

    return { onLogout }
}