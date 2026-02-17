import DoctorDetailHome from "@/components/doctorDetailPageComps/DoctorDetailHome"
import { Suspense } from "react"

export default function DoctorDetailPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DoctorDetailHome />
        </Suspense>
    )
}