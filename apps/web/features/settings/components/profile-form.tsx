"use client";

import { LOCALES, THEMES } from "@bawsala/core";
import type { Profile } from "@bawsala/db";
import { LOCALE_LABELS } from "@bawsala/i18n";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useActionState, useEffect } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { idle } from "@/lib/action-result";
import { saveProfile } from "../actions";

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

export function ProfileForm({ profile, timezones }: { profile: Profile; timezones: string[] }) {
  const t = useTranslations("settings");
  const tTheme = useTranslations("theme");
  const tc = useTranslations("common");
  const { setTheme } = useTheme();
  const [state, action, pending] = useActionState(saveProfile, idle);

  // Keep the client theme in sync with the persisted preference.
  useEffect(() => {
    setTheme(profile.theme);
  }, [profile.theme, setTheme]);

  const tzOptions = timezones.includes(profile.timezone) ? timezones : [profile.timezone, ...timezones];

  return (
    <form action={action} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("profile.title")}</CardTitle>
          <CardDescription>{t("profile.description")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="displayName">{t("fields.displayName")}</Label>
            <Input
              id="displayName"
              name="displayName"
              defaultValue={profile.displayName ?? ""}
              maxLength={80}
              required
              aria-invalid={Boolean(state.status === "error" && state.fieldErrors?.displayName)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="timezone">{t("fields.timezone")}</Label>
            <Select id="timezone" name="timezone" defaultValue={profile.timezone} dir="ltr">
              {tzOptions.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("preferences.title")}</CardTitle>
          <CardDescription>{t("preferences.description")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="locale">{t("fields.locale")}</Label>
            <Select id="locale" name="locale" defaultValue={profile.locale}>
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {LOCALE_LABELS[l]}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="theme">{t("fields.theme")}</Label>
            <Select id="theme" name="theme" defaultValue={profile.theme}>
              {THEMES.map((th) => (
                <option key={th} value={th}>
                  {tTheme(th)}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="weekStartsOn">{t("fields.weekStartsOn")}</Label>
            <Select id="weekStartsOn" name="weekStartsOn" defaultValue={String(profile.weekStartsOn)}>
              {WEEKDAYS.map((d) => (
                <option key={d} value={d}>
                  {t(`weekdays.${d}`)}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? tc("saving") : tc("save")}
        </Button>
        {state.status === "success" ? <Alert variant="success">{state.message}</Alert> : null}
        {state.status === "error" ? <Alert variant="error">{state.message}</Alert> : null}
      </div>
    </form>
  );
}
