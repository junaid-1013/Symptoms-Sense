"use client"

import { DataTable } from "@/components/dataTable/DataTable"
import { useEffect, useState } from "react"
import AddMedicineForm from "./AddMedicineForm"
import { medicineColumns, type Medicine } from "./columns"
import { useUser } from "@/contextApis/UserContext"

const AddMedicineHome = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const { clinicMedicines } = useUser()

  useEffect(() => {
    if (clinicMedicines) {
      const mapped = clinicMedicines.map((med: any) => ({
        id: med.id,
        name: med.name,
        description: med.description,
        manufacturer: med.manufacturer,
        category: med.category,
      }))
      setMedicines(mapped)
    }
  }, [clinicMedicines])

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Medicine Management</h1>
        <p className="text-muted-foreground">
          Manage and view all medicines in the system
        </p>
      </div>

      <DataTable
        columns={medicineColumns}
        data={medicines}
        actionButton={<AddMedicineForm />}
      />
    </div>
  )
}

export default AddMedicineHome
