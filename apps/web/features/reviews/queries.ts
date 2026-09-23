import { getLatestReview, listReviews, type Review } from "@bawsala/db";
import { db } from "@/lib/db";
import type { CurrentUser } from "@/lib/auth";

export async function getReviewsForUser(user: CurrentUser): Promise<Review[]> {
  return listReviews(db(), user.id);
}

export async function getLatestDailyReviewForUser(user: CurrentUser): Promise<Review | null> {
  return getLatestReview(db(), user.id, "daily");
}
