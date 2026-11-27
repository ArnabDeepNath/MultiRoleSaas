"use client";

import React, { useCallback, useState, useEffect } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { getAllUsers, toggleUserBlock, deleteUserAccount } from "@/lib/services/users";
import { getAllWallets } from "@/lib/services/leads";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { CoinWallet, UserProfile } from "@/types";
import { currentTimestamp } from "@/lib/utils";
import { Search, Shield, UserX, UserCheck, Trash2, Coins } from "lucide-react";

const ADMIN_ROLE = "SUPER_ADMIN";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [wallets, setWallets] = useState<Record<string, CoinWallet>>({});
  const [coinDrafts, setCoinDrafts] = useState<Record<string, string>>({});
  const [savingCoinsId, setSavingCoinsId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [data, walletData] = await Promise.all([getAllUsers(), getAllWallets()]);
      const walletMap = Object.fromEntries(walletData.map((wallet) => [wallet.uid, wallet]));
      setUsers(data);
      setWallets(walletMap);
      setCoinDrafts(Object.fromEntries(walletData.map((wallet) => [wallet.uid, wallet.balance.toString()])));
    } catch (err) {
      console.error(err);
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void loadUsers(), 0);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  const handleBlock = async (uid: string, blocked?: boolean) => {
    try {
      await toggleUserBlock(uid, !blocked);
      setUsers(users.map((u) => (u.uid === uid ? { ...u, blocked: !blocked } : u)));
    } catch (err) {
      console.error(err);
      setError("Failed to update user.");
    }
  };

  const handleDelete = async (uid: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUserAccount(uid);
      setUsers(users.filter((u) => u.uid !== uid));
    } catch (err) {
      console.error(err);
      setError("Failed to delete user.");
    }
  };

  const handleSaveCoins = async (uid: string) => {
    const balance = Number(coinDrafts[uid] ?? "100");
    if (!Number.isInteger(balance) || balance < 0) {
      setError("Coin balance must be a non-negative whole number.");
      return;
    }
    setSavingCoinsId(uid);
    setError(null);
    try {
      const wallet: CoinWallet = {
        uid,
        balance,
        lastUnlockId: wallets[uid]?.lastUnlockId || "",
        updatedAt: currentTimestamp(),
      };
      await setDoc(doc(db, "wallets", uid), wallet, { merge: true });
      setWallets((current) => ({ ...current, [uid]: wallet }));
      setCoinDrafts((current) => ({ ...current, [uid]: balance.toString() }));
    } catch (err) {
      console.error(err);
      setError("Failed to update the provider coin balance.");
    } finally {
      setSavingCoinsId(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={[ADMIN_ROLE]}>
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[ADMIN_ROLE]}>
      <DashboardLayout title="User Management">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
          {error && <Alert variant="error">{error}</Alert>}

          <Card>
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email or role"
                  className="pl-9"
                />
              </div>
              <Button onClick={loadUsers}>Refresh</Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Provider Coins</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.uid} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-900">{u.displayName}</td>
                      <td className="px-4 py-3 text-slate-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">
                          <Shield className="h-3 w-3" /> {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.blocked ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                          {u.blocked ? "Blocked" : "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.role === "SERVICE_PROVIDER" ? (
                          <div className="flex min-w-40 items-center gap-2">
                            <Coins className="h-4 w-4 text-amber-500" />
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              aria-label={`Coin balance for ${u.displayName}`}
                              value={coinDrafts[u.uid] ?? "100"}
                              onChange={(event) => setCoinDrafts((current) => ({ ...current, [u.uid]: event.target.value }))}
                              className="h-9 w-24"
                            />
                            <Button size="sm" variant="outline" onClick={() => handleSaveCoins(u.uid)} isLoading={savingCoinsId === u.uid}>Save</Button>
                          </div>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBlock(u.uid, u.blocked)}
                          className={u.blocked ? "text-emerald-600" : "text-amber-600"}
                        >
                          {u.blocked ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(u.uid)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <p className="text-center text-slate-500 py-6">No users found.</p>}
            </div>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
