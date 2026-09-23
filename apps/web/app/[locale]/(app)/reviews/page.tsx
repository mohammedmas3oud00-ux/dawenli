import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/layout/page-header";
import { ReviewForm } from "@/features/reviews/components/review-form";
import { ReviewHistory } from "@/features/reviews/components/review-history";
import { getLatestDailyReviewForUser, getReviewsForUser } from "@/features/reviews/queries";
import { requireUser } from "@/lib/auth";
import type { LocaleParams } from "@/lib/types";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("reviews") };
}

export default async function ReviewsPage({ params }: { params: LocaleParams }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser();
  const [latestDailyReview, allReviews] = await Promise.all([
    getLatestDailyReviewForUser(user),
    getReviewsForUser(user),
  ]);

  const isAr = locale === "ar";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={isAr ? "نظام المراجعات والاستخلاص" : "Reviews & Reflection Engine"}
        description={
          isAr
            ? "محرك المراجعات اليومية والأسبوعية لتحويل التجربة اليومية إلى رؤى وحكمة مستمرة."
            : "Daily and weekly review system to turn everyday actions into compounding insights."
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ReviewForm initialReview={latestDailyReview} locale={locale} />
        </div>
        <div className="lg:col-span-1">
          <ReviewHistory reviews={allReviews} locale={locale} />
        </div>
      </div>
    </div>
  );
}
