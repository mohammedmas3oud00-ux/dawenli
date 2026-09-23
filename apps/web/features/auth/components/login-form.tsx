"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Link } from "@/i18n/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { idle } from "@/lib/action-result";
import { signInWithMagicLink, signInWithPassword } from "../actions";
import { OAuthButtons } from "./oauth-buttons";

export function LoginForm({ next, oauthError }: { next?: string; oauthError?: boolean }) {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const [passwordState, passwordAction, passwordPending] = useActionState(signInWithPassword, idle);
  const [magicState, magicAction, magicPending] = useActionState(signInWithMagicLink, idle);

  return (
    <div className="flex flex-col gap-6">
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
        {passwordState.status === "error" ? <Alert variant="error">{passwordState.message}</Alert> : null}
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
          <Input id="magic-email" name="email" type="email" autoComplete="email" required dir="ltr" />
        </div>
        {magicState.status === "error" ? <Alert variant="error">{magicState.message}</Alert> : null}
        {magicState.status === "success" ? <Alert variant="success">{magicState.message}</Alert> : null}
        <Button type="submit" variant="outline" disabled={magicPending} className="w-full">
          {magicPending ? tc("loading") : t("login.magicLink")}
        </Button>
      </form>

      <OAuthButtons next={next} />

      <p className="text-center text-sm text-muted-foreground">
        {t("login.noAccount")}{" "}
        <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
          {t("login.register")}
        </Link>
      </p>
    </div>
  );
}
