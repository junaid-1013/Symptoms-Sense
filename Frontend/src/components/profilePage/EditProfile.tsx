"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { UserProfileFormData } from "@/types"
import { UpdateProfileApi, UploadAvatarApi } from "@/endPoints/auth.endPoints"
import { useUser } from "@/contextApis/UserContext"
import { ArrowLeft, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type React from "react"
import { useEffect, useState } from "react"
import { ProfileForm } from "./ProfileForm"

const EditProfile = () => {
    const router = useRouter()
    const { toast } = useToast()
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [image, setImage] = useState<File | null>(null)
    const { user, updateUserDetails } = useUser()
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (!image) {
            setImagePreview(null)
            return
        }
        const preview = URL.createObjectURL(image)
        setImagePreview(preview)
        return () => URL.revokeObjectURL(preview)
    }, [image])

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selected = event.target.files?.[0]
        if (!selected) return
        if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type) || selected.size > 2 * 1024 * 1024) {
            toast({ title: "Invalid image", description: "Choose a JPEG, PNG, or WebP no larger than 2 MB.", variant: "destructive" })
            event.target.value = ""
            return
        }
        setImage(selected)
    }

    const onSubmit = async (data: UserProfileFormData) => {
        if (isLoading) return
        setIsLoading(true)
        let nameSaved = false
        try {
            const response = await UpdateProfileApi({ name: data.name.trim() })
            updateUserDetails(response.data.data)
            nameSaved = true
            if (image) {
                const uploaded = await UploadAvatarApi(image)
                updateUserDetails(uploaded.data.data)
            }
            toast({ title: "Success!", description: "Profile has been updated successfully" })
            router.push("/profile")
        } catch (error: any) {
            const message = error?.response?.data?.message || "Please try again."
            toast({
                title: nameSaved ? "Name saved; image upload failed" : "Profile update failed",
                description: message,
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background py-8">
            <div className="container mx-auto px-4 max-w-2xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/profile">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold text-foreground">Edit Profile</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Profile Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ProfileForm
                            onSubmit={onSubmit}
                            isLoading={isLoading}
                            imagePreview={imagePreview || user?.avatar_url || null}
                            initialName={user?.name || ""}
                            onFileChange={handleFileChange}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default EditProfile