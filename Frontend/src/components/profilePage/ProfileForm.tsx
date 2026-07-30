import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserProfileFormData } from "@/types"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { ProfileImageUpload } from "./ProfileImageUpload"
import { SpinnerButton } from "@/components/uiUtils/SpinnerButton"
import { useEffect } from "react"

interface ProfileFormProps {
  onSubmit: (data: UserProfileFormData) => void
  isLoading: boolean
  initialName: string
  imagePreview: string | null
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export const ProfileForm = ({ onSubmit, isLoading, initialName, imagePreview, onFileChange }: ProfileFormProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserProfileFormData>({ defaultValues: { name: initialName } })

  useEffect(() => { reset({ name: initialName }) }, [initialName, reset])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Profile Image Upload */}
      <ProfileImageUpload
        imagePreview={imagePreview}
        onFileChange={onFileChange}
        disabled={isLoading}
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
          disabled={isLoading}
          maxLength={100}
          {...register("name", {
            required: "Name is required",
            setValueAs: (value: string) => value.trim(),
            maxLength: { value: 100, message: "Use at most 100 characters" },
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
        <SpinnerButton type="submit" state={isLoading} disabled={isLoading} aria-busy={isLoading}
          aria-label={isLoading ? "Updating profile" : "Update Profile"} name="Update Profile" className="flex-1" />
        <Link href="/profile" className="flex-1">
          <Button type="button" variant="outline" className="w-full bg-transparent">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  )
}
