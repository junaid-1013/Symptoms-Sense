import DoctorDetail from "@/components/DoctorDetail"
import { Suspense } from "react"

export default function DoctorDetailPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DoctorDetail />
        </Suspense>
    )
}