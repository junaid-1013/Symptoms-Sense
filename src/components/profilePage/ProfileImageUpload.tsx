import { Label } from "@/components/ui/label"
import { ProfileImageUploadProps } from "@/types"
import { Camera, Upload } from "lucide-react"

export const ProfileImageUpload = ({ imagePreview, onFileChange }: ProfileImageUploadProps) => {
  return (
    <div className="space-y-2">
      <Label className="text-base font-medium">Profile Image</Label>
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-2 border-dashed border-border overflow-hidden bg-muted flex items-center justify-center">
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagePreview || "/placeholder.svg"}
                alt="Profile Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center">
                <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No image</p>
              </div>
            )}
          </div>
          <label className="absolute bottom-0 right-0 p-2 bg-accent text-accent-foreground rounded-full cursor-pointer hover:bg-accent/90 transition-colors shadow-lg">
            <Upload className="w-4 h-4" />
            <input type="file" className="hidden" accept="image/*" onChange={onFileChange} />
          </label>
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Click the upload button to select a profile image
        </p>
      </div>
    </div>
  )
}
