// src/app/cloudinary/page.tsx
"use client"
import React, { useEffect, useState } from 'react';

interface CloudinaryResource {
    public_id: string;
    url: string;
    secure_url: string;
    format: string;
}

const CloudinaryPage = () => {
    const [resources, setResources] = useState<CloudinaryResource[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchResources = async () => {
            try {
                const response = await fetch('/api/cloudinary');
                const data = await response.json();

                if (response.ok) {
                    setResources(data.resources);
                } else {
                    setError(data.error);
                }
            } catch (error) {
                console.error('Error fetching Cloudinary resources:', error);
                setError('Failed to fetch resources');
            }
        };

        fetchResources();
    }, []);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Cloudinary Resources</h1>
            {error ? (
                <div className="text-red-500">{error}</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {resources.map((resource) => (
                        <div key={resource.public_id} className="border p-2 rounded shadow">
                            <img
                                src={resource.secure_url}
                                alt={resource.public_id}
                                className="w-full h-auto"
                            />
                            <p className="mt-2 text-sm">{resource.public_id}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CloudinaryPage;

