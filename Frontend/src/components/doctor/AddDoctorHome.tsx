"use client"
import { DataTable } from "@/components/dataTable/DataTable"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { useState } from "react"
import { columns, type Doctor } from "./columns"

// Sample data
const data: Doctor[] = [
    { id: "1", name: "John Doe", email: "john.doe@example.com", specialization: "Cardiologist" },
    { id: "2", name: "Jane Smith", email: "jane.smith@example.com", specialization: "Dermatologist" },
    { id: "3", name: "Bob Johnson", email: "bob.johnson@example.com", specialization: "Neurologist" },
    { id: "4", name: "Alice Brown", email: "alice.brown@example.com", specialization: "Pediatrician" },
    { id: "5", name: "Charlie Wilson", email: "charlie.wilson@example.com", specialization: "General Physician" },
    { id: "6", name: "Eva Martinez", email: "eva.martinez@example.com", specialization: "Orthopedic Surgeon" },
    { id: "7", name: "Frank Lee", email: "frank.lee@example.com", specialization: "Psychiatrist" },
    { id: "8", name: "Grace Taylor", email: "grace.taylor@example.com", specialization: "Radiologist" },
]

const AddDoctorHome = () => {
    const [doctors, setDoctors] = useState<Doctor[]>(data)

    const actionButton = (
        <Button
            size="sm"
            onClick={() => {

            }}
        >
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Doctor
        </Button>
    )

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
                actionButton={actionButton}
            />
        </div>
    )
}

export default AddDoctorHome