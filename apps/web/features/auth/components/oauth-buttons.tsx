import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "../actions";

export function OAuthButtons({ next }: { next?: string }) {
  const t = useTranslations("auth.login");

  return (
    <form action={signInWithGoogle}>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Button type="submit" variant="outline" className="w-full">
        <GoogleMark />
        {t("google")}
      </Button>
    </form>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path
        fill="currentColor"
        d="M21.6 12.23c0-.68-.06-1.36-.18-2.02H12v3.83h5.4a4.62 4.62 0 0 1-2 3.03v2.5h3.23c1.9-1.75 2.97-4.32 2.97-7.34Z"
      />
      <path
        fill="currentColor"
        opacity=".7"
        d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.23-2.5c-.9.6-2.04.95-3.39.95-2.6 0-4.8-1.76-5.6-4.12H3.07v2.58A10 10 0 0 0 12 22Z"
      />
      <path
        fill="currentColor"
        opacity=".5"
        d="M6.4 13.9A6 6 0 0 1 6.4 10.1V7.52H3.07a10 10 0 0 0 0 8.96L6.4 13.9Z"
      />
      <path
        fill="currentColor"
        opacity=".85"
        d="M12 5.98c1.47 0 2.78.5 3.82 1.5l2.86-2.86A9.98 9.98 0 0 0 3.07 7.52L6.4 10.1c.8-2.36 3-4.12 5.6-4.12Z"
      />
    </svg>
  );
}
