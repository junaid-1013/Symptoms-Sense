"use client";
import { Button } from "@/components/ui/button";
import { GetDoctorReviewsApi } from "@/endPoints/doctor.endPoints";
import { DoctorReviewList } from "@/types/doctors";
import { Star } from "lucide-react";
import { useEffect, useState } from "react";

export default function DoctorReviews({ doctorId }: { doctorId: string }) {
    const [page, setPage] = useState(1);
    const [result, setResult] = useState<DoctorReviewList | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(false);
        GetDoctorReviewsApi({ doctor_id: doctorId, page, page_size: 10 })
            .then((response) => {
                if (!cancelled) setResult(response.data.data);
            })
            .catch(() => { if (!cancelled) setError(true); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [doctorId, page, retry]);

    if (loading) return <p role="status" className="mt-4 text-sm text-muted-foreground">Loading reviews…</p>;
    if (error) return (
        <div className="mt-4 space-y-2">
            <p role="alert" className="text-sm text-destructive">Could not load reviews.</p>
            <Button variant="outline" onClick={() => setRetry((value) => value + 1)}>Try again</Button>
        </div>
    );
    if (!result) return null;

    const totalPages = Math.max(1, Math.ceil(result.total / result.page_size));
    return (
        <div className="mt-4 space-y-4">
            {result.reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews available yet.</p>
            ) : (
                <ul className="divide-y">
                    {result.reviews.map((review) => (
                        <li key={review.id} className="py-4 first:pt-0 space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <p className="font-medium">{review.reviewer_name || "Patient"}</p>
                                <time dateTime={review.created_at} className="text-xs text-muted-foreground">
                                    {new Date(review.created_at).toLocaleDateString()}
                                </time>
                            </div>
                            <div className="flex gap-1" role="img" aria-label={`${review.rating} out of 5 stars`}>
                                {Array.from({ length: 5 }, (_, index) => (
                                    <Star key={index} aria-hidden="true" className={`h-4 w-4 ${index < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                                ))}
                            </div>
                            <p className="text-sm whitespace-pre-wrap break-words">{review.review}</p>
                        </li>
                    ))}
                </ul>
            )}
            {(totalPages > 1 || page > 1) && (
                <nav aria-label="Review pages" className="flex items-center justify-between gap-3">
                    <Button variant="outline" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
                    <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                    <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button>
                </nav>
            )}
        </div>
    );
}
