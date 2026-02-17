"use client"
import { DataTable } from "@/components/dataTable/DataTable"
import { useEffect, useState } from "react"
import AddDoctorForm from "./AddDoctorForm"
import { columns, type Doctor } from "./columns"
import { useUser } from "@/contextApis/UserContext"

const AddDoctorHome = () => {
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const { clinicDoctors } = useUser()

    useEffect(() => {
        if (clinicDoctors) {
            const result = clinicDoctors.map((doctor: any) => ({
                id: doctor.id,
                userId: doctor.user_id,
                name: doctor.name,
                email: doctor.email,
                phone: doctor.phone,
                specialization: doctor?.specialization || ""
            }))
            setDoctors(result);
        }
    }, [clinicDoctors])

    return (
        <div className="container mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Doctor Management</h1>
                <p className="text-muted-foreground">
                    Manage and view all doctors in the system
                </p>
            </div>

            <DataTable
                columns={columns}
                data={doctors}
                actionButton={<AddDoctorForm />}
            />
        </div>
    )
}

export default AddDoctorHome