import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserProfileFormData } from "@/types"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { ProfileImageUpload } from "./ProfileImageUpload"

interface ProfileFormProps {
  onSubmit: (data: UserProfileFormData) => void
  isLoading: boolean
  imagePreview: string | null
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export const ProfileForm = ({ onSubmit, isLoading, imagePreview, onFileChange }: ProfileFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserProfileFormData>()

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Profile Image Upload */}
      <ProfileImageUpload
        imagePreview={imagePreview}
        onFileChange={onFileChange}
      />

      {/* Name Input */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-base font-medium">
          Full Name
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="Enter your full name"
          {...register("name", {
            required: "Name is required",
            minLength: {
              value: 2,
              message: "Name must be at least 2 characters",
            },
          })}
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? "Updating..." : "Update Profile"}
        </Button>
        <Link href="/profile" className="flex-1">
          <Button type="button" variant="outline" className="w-full bg-transparent">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  )
}