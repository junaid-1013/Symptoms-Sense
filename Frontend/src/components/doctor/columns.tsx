"use client"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from "@/contextApis/UserContext"
import { clinicDoctorDeleteApi } from "@/endPoints/clinic.endPoints"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"

// Define your data type
export type Doctor = {
    id: string;
    userId: string;
    name: string;
    email: string;
    phone: string;
    specialization: string;
}

export const columns: ColumnDef<Doctor>[] = [
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
    {
        accessorKey: "name",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
    },
    {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => <div className="lowercase">{row.getValue("phone")}</div>,
    },
    {
        accessorKey: "specialization",
        header: "Specialization",
        cell: ({ row }) => <div>{row.getValue("specialization")}</div>,
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => <ActionsCell doctor={row.original} />,
    },
]

function ActionsCell({ doctor }: { doctor: Doctor }) {
    const { toast } = useToast()
    const { tokens, setClinicDoctors } = useUser()

    const handleDelete = async () => {
        clinicDoctorDeleteApi({ doctorId: doctor.id, token: tokens?.accessToken || "" })
            .then(response => {
                if (response.data.clinic_doctors.doctors) {
                    setClinicDoctors(response.data.clinic_doctors.doctors)
                }
                toast({ title: "Deleted", description: "Doctor removed successfully" })
            })
            .catch(error => {
                toast({ title: "Failed", description: error?.response?.data?.detail || "Could not delete doctor", variant: "destructive" })
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
                <DropdownMenuItem>View details</DropdownMenuItem>
                <DropdownMenuItem>Edit doctor</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
                    Delete doctor
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}