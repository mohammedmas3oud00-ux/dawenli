"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { idle } from "@/lib/action-result";
import { cn } from "@/lib/utils";
import { recordEnergy } from "../actions";

const LEVELS = [1, 2, 3, 4, 5] as const;

export function EnergyCheckIn({ current }: { current: number | null }) {
  const t = useTranslations("today.energy");
  const [state, action, pending] = useActionState(recordEnergy, idle);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <form action={action} className="grid grid-cols-5 gap-2" aria-busy={pending}>
          {LEVELS.map((level) => {
            const selected = current === level;
            return (
              <button
                key={level}
                type="submit"
                name="level"
                value={level}
                disabled={pending}
                aria-pressed={selected}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-md border px-2 py-3 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-background hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <span className="text-lg font-semibold tabular-nums">{level}</span>
                <span>{t(`levels.${level}`)}</span>
              </button>
            );
          })}
        </form>
        <p className="text-sm text-muted-foreground">
          {current ? t("current", { level: t(`levels.${current as 1 | 2 | 3 | 4 | 5}`) }) : t("notSet")}
        </p>
        {state.status === "error" ? <Alert variant="error">{state.message}</Alert> : null}
      </CardContent>
    </Card>
  );
}
