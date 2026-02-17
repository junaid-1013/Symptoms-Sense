"use client"
import ResetPasswordForm from "@/components/ResetPasswordForm"
import { useToast } from "@/components/ui/use-toast"
import axios from "axios"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"

const ResetPasswordContent = () => {
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const role = searchParams.get("role")

  const handleResetPassword = async (newPassword: string) => {
    try {
      const data = { token, role, newPassword }
      const response = await axios.put("/api/forgot_password", data)
      router.push("/login")
      toast({
        title: "Success!",
        description: "Password changed. please login with new password.",
      })
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.error) {
        toast({
          title: "Failed!",
          description: error.response.data.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Failed!",
          description: "An error occurred.",
          variant: "destructive",
        })
      }
    }
  }

  return <ResetPasswordForm onSubmit={handleResetPassword} title="Reset Password" />
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
