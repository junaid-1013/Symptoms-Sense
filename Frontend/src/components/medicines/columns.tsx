"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from "@/contextApis/UserContext"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { DeleteMedicineApi } from "@/endPoints/clinic.endPoints"
import EditMedicineForm from "./EditMedicineForm"

export type Medicine = {
  id: string
  name: string
  description: string
  manufacturer: string
  category: string
}

export const medicineColumns: ColumnDef<Medicine>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },

  // NAME
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },

  // DESCRIPTION
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => <div>{row.getValue("description")}</div>,
  },

  // MANUFACTURER
  {
    accessorKey: "manufacturer",
    header: "Manufacturer",
    cell: ({ row }) => <div>{row.getValue("manufacturer")}</div>,
  },

  // CATEGORY
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => <div>{row.getValue("category")}</div>,
  },

  // ACTIONS
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => <MedicineActions medicine={row.original} />,
  },
]

// ACTIONS CELL
function MedicineActions({ medicine }: { medicine: Medicine }) {
  const { toast } = useToast()
  const { tokens, setClinicMedicines } = useUser()

  const handleDelete = async () => {

    DeleteMedicineApi({
      medicineId: medicine.id,
      token: tokens?.accessToken || ""
    })
      .then(response => {
        if (response?.data?.data) {
          setClinicMedicines?.(response.data.data)
        }
        toast({
          title: "Deleted",
          description: `${medicine.name} removed successfully`,
        })
      })
      .catch(error => {
        toast({
          variant: "destructive",
          title: "Delete failed",
          description: error?.response?.data?.detail || "Could not delete medicine",
        })
      })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <EditMedicineForm medicineData={medicine} />
        </DropdownMenuItem>

        <DropdownMenuItem
          className="text-red-600 ml-2"
          onClick={handleDelete}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
