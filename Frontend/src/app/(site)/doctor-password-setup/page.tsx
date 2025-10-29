import ResetPasswordPage from "@/components/ResetPasswordPage"
import { Suspense } from "react"

export default function DoctorPasswordSetupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordPage />
    </Suspense>
  )
}
