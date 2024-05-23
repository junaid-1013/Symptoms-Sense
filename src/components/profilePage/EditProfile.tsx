"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { UserProfileFormData } from "@/types"
import axios from "axios"
import { ArrowLeft, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type React from "react"
import { useState } from "react"
import { ProfileForm } from "./ProfileForm"

const EditProfile = () => {
    const router = useRouter()
    const { toast } = useToast()
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [image, setImage] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const selectedFile = event.target.files[0]
            setImagePreview(URL.createObjectURL(selectedFile))
            setFileToBase(selectedFile)
        }
    }

    const setFileToBase = (file: File) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onloadend = () => {
            setImage(reader.result as string)
        }
    }

    const onSubmit = async (data: UserProfileFormData) => {
        setIsLoading(true)
        try {
            if (image === "") {
                throw new Error("Please select an image to update profile")
            }

            const requestData = {
                img: image,
                name: data.name,
            }

            const response = await axios.put("/api/users/profile", requestData)
            toast({
                title: "Success!",
                description: "Profile has been updated successfully",
            })
            router.push("/profile")
            window.location.reload()
        } catch (error: any) {
            if (error.response && error.response.data && error.response.data.error) {
                toast({
                    title: "Failed!",
                    description: error.response.data.error,
                    variant: "destructive",
                })
            } else {
                toast({
                    title: "Failed!",
                    description: error.message,
                    variant: "destructive",
                })
            }
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
                            imagePreview={imagePreview}
                            onFileChange={handleFileChange}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default EditProfile