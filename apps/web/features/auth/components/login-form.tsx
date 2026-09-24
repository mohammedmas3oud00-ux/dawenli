"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { idle } from "@/lib/action-result";
import { signInWithMagicLink, signInWithPassword } from "../actions";
import { OAuthButtons } from "./oauth-buttons";

export function LoginForm({
  next,
  oauthError,
  showDemo = false,
}: {
  next?: string;
  oauthError?: boolean;
  showDemo?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const [passwordState, passwordAction, passwordPending] = useActionState(signInWithPassword, idle);
  const [magicState, magicAction, magicPending] = useActionState(signInWithMagicLink, idle);

  const isAr = locale === "ar";

  return (
    <div className="flex flex-col gap-6">
      {showDemo ? (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col gap-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-primary">
            <Sparkles className="size-4 text-primary" />
            <span>{isAr ? "وضع التجربة المحلي (بدون سيرفر)" : "Local Demo Mode (No Server)"}</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {isAr
              ? "اضغط الزر أدناه للدخول الفوري وتجربة كافة شاشات وميزات بوصلة:"
              : "Click below to sign in instantly with a pre-configured demo account:"}
          </p>
          <form action={passwordAction}>
            {next ? <input type="hidden" name="next" value={next} /> : null}
            <input type="hidden" name="email" value="demo@bawsala.life" />
            <input type="hidden" name="password" value="bawsala123" />
            <Button
              type="submit"
              disabled={passwordPending}
              className="w-full font-bold shadow-xs text-xs h-9 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {passwordPending
                ? tc("loading")
                : isAr
                  ? "⚡ دخول فوري كحساب تجريبي (Demo)"
                  : "⚡ One-Click Demo Sign In"}
            </Button>
          </form>
          <div className="text-[10px] text-muted-foreground/80 font-mono" dir="ltr">
            demo@bawsala.life / bawsala123
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span>{isAr ? "أو تسجيل الدخول العادي" : "Or regular sign in"}</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {oauthError ? <Alert variant="error">{t("errors.oauthFailed")}</Alert> : null}

      <form action={passwordAction} className="flex flex-col gap-4">
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">{t("fields.email")}</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required dir="ltr" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">{t("fields.password")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            dir="ltr"
          />
        </div>
        {passwordState.status === "error" ? (
          <Alert variant="error">{passwordState.message}</Alert>
        ) : null}
        <Button type="submit" disabled={passwordPending} className="w-full">
          {passwordPending ? tc("loading") : t("login.submit")}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {tc("or")}
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={magicAction} className="flex flex-col gap-3">
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <div className="flex flex-col gap-2">
          <Label htmlFor="magic-email">{t("fields.email")}</Label>
          <Input
            id="magic-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            dir="ltr"
          />
        </div>
        {magicState.status === "error" ? <Alert variant="error">{magicState.message}</Alert> : null}
        {magicState.status === "success" ? (
          <Alert variant="success">{magicState.message}</Alert>
        ) : null}
        <Button type="submit" variant="outline" disabled={magicPending} className="w-full">
          {magicPending ? tc("loading") : t("login.magicLink")}
        </Button>
      </form>

      <OAuthButtons next={next} />

      <p className="text-center text-sm text-muted-foreground">
        {t("login.noAccount")}{" "}
        <Link
          href="/register"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("login.register")}
        </Link>
      </p>
    </div>
  );
}
