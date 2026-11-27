import type { Service } from "@/types";

export type ServiceFilterField = "subject" | "school" | "board" | "hobby" | "otherMaster" | "route" | "vehicleType";

export function uniqueServiceValues(services: Service[], field: ServiceFilterField): string[] {
  return Array.from(
    new Set(
      services
        .map((service) => service[field]?.trim())
        .filter((value): value is string => Boolean(value))
    )
  ).sort((a, b) => a.localeCompare(b));
}

export function includesFilter(value: string | undefined, filter: string): boolean {
  const needle = filter.trim().toLowerCase();
  return !needle || (value || "").toLowerCase().includes(needle);
}

export function matchesExactFilter(value: string | undefined, filter: string): boolean {
  return !filter || (value || "").trim().toLowerCase() === filter.trim().toLowerCase();
}
