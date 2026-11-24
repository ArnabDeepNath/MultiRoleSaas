"use client";

import React, { useId } from "react";
import { getAllStates, getDistricts } from "india-state-district";
import { Input } from "@/components/ui/Input";
import { LocationValue } from "@/lib/location";
import { cn } from "@/lib/utils";

const STATES = getAllStates();
const SELECT_CLASS_NAME =
  "flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3b4cca] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

interface LocationSelectorProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  mode?: "edit" | "filter";
  showAddress?: boolean;
  required?: boolean;
  className?: string;
}

export function LocationSelector({
  value,
  onChange,
  mode = "edit",
  showAddress = true,
  required = false,
  className,
}: LocationSelectorProps) {
  const id = useId();
  const selectedState = STATES.find((state) => state.name === value.state);
  const districts = selectedState ? getDistricts(selectedState.code) : [];
  const stateOptions = STATES.some((state) => state.name === value.state) || !value.state
    ? STATES
    : [...STATES, { code: "LEGACY", name: value.state }];
  const districtOptions = districts.includes(value.district) || !value.district
    ? districts
    : [...districts, value.district];

  const handleStateChange = (state: string) => {
    onChange({ ...value, state, district: "" });
  };

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4",
        showAddress ? "md:grid-cols-3" : "md:grid-cols-2",
        className
      )}
    >
      <div className="space-y-1.5">
        <label htmlFor={`${id}-state`} className="text-sm font-medium text-slate-700">
          State
        </label>
        <select
          id={`${id}-state`}
          value={value.state}
          onChange={(event) => handleStateChange(event.target.value)}
          required={required}
          className={SELECT_CLASS_NAME}
        >
          <option value="">{mode === "filter" ? "All states" : "Select state"}</option>
          {stateOptions.map((state) => (
            <option key={state.code} value={state.name}>
              {state.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${id}-district`} className="text-sm font-medium text-slate-700">
          District
        </label>
        <select
          id={`${id}-district`}
          value={value.district}
          onChange={(event) => onChange({ ...value, district: event.target.value })}
          disabled={!value.state}
          required={required}
          className={SELECT_CLASS_NAME}
        >
          <option value="">
            {mode === "filter" ? "All districts" : value.state ? "Select district" : "Select state first"}
          </option>
          {districtOptions.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>
      </div>

      {showAddress && (
        <Input
          id={`${id}-address`}
          label="Address"
          value={value.address}
          onChange={(event) => onChange({ ...value, address: event.target.value })}
          placeholder={mode === "filter" ? "Search by street address" : "Street address"}
        />
      )}
    </div>
  );
}
