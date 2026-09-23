"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Link } from "@/i18n/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { idle } from "@/lib/action-result";
import { signUp } from "../actions";
import { OAuthButtons } from "./oauth-buttons";

export function RegisterForm() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const [state, action, pending] = useActionState(signUp, idle);

  if (state.status === "success" && state.message) {
    return <Alert variant="success">{state.message}</Alert>;
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="displayName">{t("fields.displayName")}</Label>
          <Input id="displayName" name="displayName" autoComplete="name" required maxLength={80} />
        </div>
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
            autoComplete="new-password"
            required
            minLength={8}
            dir="ltr"
          />
        </div>
        {state.status === "error" ? <Alert variant="error">{state.message}</Alert> : null}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? tc("loading") : t("register.submit")}
        </Button>
      </form>

      <OAuthButtons />

      <p className="text-center text-sm text-muted-foreground">
        {t("register.haveAccount")}{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          {t("register.login")}
        </Link>
      </p>
    </div>
  );
}
