"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import {
  getLeadSettings,
  getNearbyLeads,
  getProviderUnlocks,
  getProviderWallet,
  getUnlockedContact,
  NearbyLead,
  unlockLead,
} from "@/lib/services/leads";
import { LEAD_RADIUS_KM } from "@/lib/geo";
import { LeadContact } from "@/types";
import { Coins, MapPin, Phone, RefreshCw, ShieldCheck, Unlock, Users } from "lucide-react";

const PROVIDER_ROLE = "SERVICE_PROVIDER";

export default function ProviderLeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<NearbyLead[]>([]);
  const [contacts, setContacts] = useState<Record<string, LeadContact>>({});
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [balance, setBalance] = useState(0);
  const [unlockCost, setUnlockCost] = useState(10);
  const [loading, setLoading] = useState(true);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [nearby, wallet, unlocks, settings] = await Promise.all([
        getNearbyLeads(user),
        getProviderWallet(user.uid),
        getProviderUnlocks(user.uid),
        getLeadSettings(),
      ]);
      const contactEntries = await Promise.all(
        unlocks.map(async (unlock) => [unlock.leadId, await getUnlockedContact(user.uid, unlock.leadId)] as const)
      );
      setLeads(nearby);
      setBalance(wallet.balance);
      setUnlockCost(settings.leadUnlockCost);
      setUnlockedIds(unlocks.map((unlock) => unlock.leadId));
      setContacts(Object.fromEntries(contactEntries.filter((entry): entry is readonly [string, LeadContact] => Boolean(entry[1]))));
    } catch (err) {
      console.error("Failed to load nearby leads:", err);
      setError(err instanceof Error ? err.message : "Failed to load nearby leads.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => void loadLeads(), 0);
    return () => clearTimeout(timer);
  }, [loadLeads]);

  const handleUnlock = async (lead: NearbyLead) => {
    if (!user) return;
    if (!confirm(`Unlock ${lead.displayName}'s phone number for ${unlockCost} coins?`)) return;

    setUnlockingId(lead.uid);
    setError(null);
    setSuccess(null);
    try {
      const result = await unlockLead(user.uid, lead.uid);
      setBalance(result.balance);
      setUnlockedIds((current) => current.includes(lead.uid) ? current : [...current, lead.uid]);
      if (result.contact) {
        setContacts((current) => ({ ...current, [lead.uid]: result.contact as LeadContact }));
      }
      setSuccess(result.alreadyUnlocked
        ? "This contact was already unlocked; no coins were charged."
        : `${unlockCost} coins spent. The phone number is now permanently unlocked.`);
    } catch (err) {
      console.error("Failed to unlock lead:", err);
      setError(err instanceof Error ? err.message : "Failed to unlock this contact.");
    } finally {
      setUnlockingId(null);
    }
  };

  return (
    <ProtectedRoute allowedRoles={[PROVIDER_ROLE]}>
      <DashboardLayout title="Lead Generator">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Nearby Lead Generator</h2>
              <p className="mt-1 text-sm text-slate-600">All registered non-admin users within {LEAD_RADIUS_KM} km, nearest first.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-amber-800">
                <Coins className="h-5 w-5" /><span className="font-bold">{balance}</span><span className="text-sm">coins</span>
              </div>
              <Button variant="outline" size="icon" onClick={loadLeads} isLoading={loading} aria-label="Refresh leads"><RefreshCw className="h-4 w-4" /></Button>
            </div>
          </div>

          <Alert variant="info">
            Phone numbers stay masked until you spend {unlockCost} coins per lead. An unlock is permanent and is never charged twice.
          </Alert>
          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : leads.length === 0 ? (
            <Card>
              <div className="py-8 text-center">
                <Users className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-4 font-semibold text-slate-900">No nearby registered users</h3>
                <p className="mt-1 text-sm text-slate-500">Leads appear when users with valid registration coordinates are within {LEAD_RADIUS_KM} km.</p>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {leads.map((lead) => {
                const contact = contacts[lead.uid];
                const isUnlocked = unlockedIds.includes(lead.uid);
                return (
                  <Card key={lead.uid}>
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-900">{lead.displayName}</h3>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            {lead.role.replace("_", " ")}{lead.providerType ? ` · ${lead.providerType}` : ""}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 whitespace-nowrap">
                          <MapPin className="h-3 w-3" />{lead.distanceKm.toFixed(2)} km
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{[lead.district || lead.city, lead.state].filter(Boolean).join(", ") || "Location registered"}</p>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-500"><Phone className="h-3.5 w-3.5" /> Phone number</p>
                        {contact?.phoneNumber ? (
                          <a href={`tel:${contact.phoneNumber}`} className="font-semibold text-[#3b4cca] hover:underline">{contact.phoneNumber}</a>
                        ) : (
                          <p className="font-mono text-sm tracking-widest text-slate-500">{isUnlocked ? "Not provided" : "••••• •••••"}</p>
                        )}
                      </div>
                      {isUnlocked ? (
                        <div className="flex items-center gap-2 text-sm text-emerald-700"><ShieldCheck className="h-4 w-4" /> Contact unlocked</div>
                      ) : lead.hasPhone === false ? (
                        <p className="text-center text-sm text-slate-500">No phone number provided</p>
                      ) : (
                        <Button className="w-full" onClick={() => handleUnlock(lead)} isLoading={unlockingId === lead.uid} disabled={balance < unlockCost}>
                          <Unlock className="mr-2 h-4 w-4" /> Unlock for {unlockCost} coins
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
