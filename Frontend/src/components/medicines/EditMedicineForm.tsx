"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { SpinnerButton } from "@/components/uiUtils/SpinnerButton"
import { Plus } from "lucide-react"
import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { UpdateMedicineApi } from "@/endPoints/clinic.endPoints"
import { useUser } from "@/contextApis/UserContext"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UpdateMedicineFormData } from "@/types"
import { MEDICINE_TYPES } from "@/config/constants"


const EditMedicineForm = ({ medicineData }: any) => {
  const { toast } = useToast()
  const { tokens, setClinicMedicines } = useUser()
  const [isUpdating, setIsUpdating] = useState(false)
  const [open, setOpen] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset
  } = useForm<UpdateMedicineFormData>({
    defaultValues: medicineData
  })

  const submitHandler = (data: UpdateMedicineFormData) => {
    setIsUpdating(true)

    UpdateMedicineApi({
      medicineId: data.id,
      name: data.name,
      description: data.description,
      manufacturer: data.manufacturer,
      category: data.category,
      token: tokens?.accessToken || ""
    })
      .then(response => {
        setIsUpdating(false)
        if (response?.data?.data.length) {
          setClinicMedicines?.(response.data.data)
        }

        toast({
          title: "Success",
          description: "Medicine updated successfully."
        })

        setOpen(false)
      })
      .catch(error => {
        setIsUpdating(false)
        const message =
                error?.response?.data?.detail || 
                error?.response?.data?.message || "Something went wrong";
        toast({
          title: "Error",
          description: message,
          variant: "destructive"
        })
      })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost">
          Edit
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Medicine</DialogTitle>
          <DialogDescription>
            Edit details of the medicine. Click Update when you&apos;re done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submitHandler)}>
          <div className="grid gap-4 py-4">

            {/* Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Name</Label>
              <Input
                placeholder="Medicine Name"
                {...register("name", { required: true })}
                className={`col-span-3 ${errors.name ? "border-red-500" : ""}`}
              />
              {errors.name && (
                <Label className="text-right col-span-4 text-red-500 text-sm">
                  Name is required
                </Label>
              )}
            </div>

            {/* Description */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Description</Label>
              <Input
                placeholder="Description"
                {...register("description", { required: true })}
                className={`col-span-3 ${errors.description ? "border-red-500" : ""}`}
              />
              {errors.description && (
                <Label className="text-right col-span-4 text-red-500 text-sm">
                  Description is required
                </Label>
              )}
            </div>

            {/* Manufacturer */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Manufacturer</Label>
              <Input
                placeholder="Company Name"
                {...register("manufacturer", { required: true })}
                className={`col-span-3 ${errors.manufacturer ? "border-red-500" : ""}`}
              />
              {errors.manufacturer && (
                <Label className="text-right col-span-4 text-red-500 text-sm">
                  Manufacturer is required
                </Label>
              )}
            </div>

            {/* Category */}
                <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Category</Label>
                <Controller
                    name="category"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent className="max-h-56 overflow-y-auto">
                        {MEDICINE_TYPES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                            {cat}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    )}
                />
                {errors.category && (
                    <Label className="text-right col-span-4 text-red-500 text-sm">
                    Category is required
                    </Label>
                )}
                </div>


          </div>

          <DialogFooter>
            <SpinnerButton name="Update" state={isUpdating} type="submit" />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EditMedicineForm
