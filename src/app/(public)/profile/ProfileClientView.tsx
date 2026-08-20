"use client";

import { useState } from "react";
import { Check, Upload, Trash2, KeyRound, ShieldAlert, Monitor, Smartphone, AlertTriangle } from "lucide-react";
import { updateProfile, updatePassword, revokeSessionAction } from "./actions";
import ConfirmModal from "@/components/ConfirmModal";
import AlertDialog from "@/components/AlertDialog";
import { useToast } from "@/components/Toast";

type Tab = "general" | "scholar" | "security" | "notifications";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  submissionsCount: number;
  scholarProfile?: {
    spasId: string;
    fullName: string;
    university: string;
    region: string;
  };
  sessions: {
    id: string;
    userAgent: string | null;
    ipAddress: string | null;
    isCurrent: boolean;
    createdAt: Date;
  }[];
}

export default function ProfileClientView({ user }: { user: ProfileData }) {
  const [activeTab, setActiveTab] = useState<Tab>("general");

  const tabs = [
    { id: "general", label: "General Profile" },
    ...(user.role === "SCHOLAR" ? [{ id: "scholar", label: "Scholar Credentials" }] : []),
    { id: "security", label: "Account & Security" },
    { id: "notifications", label: "Notifications" },
  ] as { id: Tab; label: string }[];

  return (
    <div className="mx-auto w-full max-w-[1200px] px-8 py-12 lg:px-0 lg:py-20">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="font-display text-[32px] font-extrabold text-[#0B3272]">Profile & Settings</h1>
        <p className="font-sans text-base text-[#5A6A7E]">Manage your personal identity, academic records, and security preferences.</p>
      </div>

      <div className="mb-10 w-full border-b border-[#E1E8F0]">
        <div className="flex flex-wrap gap-8">
          {tabs.map((tab: { id: Tab; label: string }) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative pb-4 font-sans text-sm transition-colors ${
                activeTab === tab.id ? "font-bold text-[#0B3272]" : "font-medium text-[#5A6A7E] hover:text-[#0B3272]"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0B3272]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-10 lg:flex-row">
        {activeTab === "general" && <GeneralProfileTab user={user} />}
        {activeTab === "scholar" && user.scholarProfile && <ScholarCredentialsTab user={user} />}
        {activeTab === "security" && <AccountSecurityTab user={user} />}
        {activeTab === "notifications" && <NotificationsTab />}
      </div>
    </div>
  );
}

function GeneralProfileTab({ user }: { user: ProfileData }) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await updateProfile(formData);
      showToast("Profile updated successfully.", "success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update profile.";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Left Column - 760px */}
      <div className="flex w-full min-w-0 flex-col gap-8 lg:w-[760px] lg:flex-shrink-0">
        <div className="flex flex-col gap-6 rounded-2xl border border-[#E1E8F0] bg-white p-8 shadow-sm">
          <div>
            <h2 className="font-sans text-lg font-bold text-[#0B1F3A]">Public Profile</h2>
            <p className="font-sans text-sm text-[#5A6A7E]">This information will be displayed on your papers and public profile.</p>
          </div>

          <form onSubmit={handleSave} className="mt-2 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-sans text-sm font-bold text-[#0B1F3A]">Display Name</label>
              <input
                name="name"
                type="text"
                defaultValue={user.name}
                className="h-12 w-full rounded-lg border border-[#E1E8F0] px-4 font-sans text-sm text-[#0B1F3A] outline-none transition-colors focus:border-[#0B3272]"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-sans text-sm font-bold text-[#0B1F3A]">Primary Email</label>
              <input
                type="email"
                defaultValue={user.email}
                disabled
                className="h-12 w-full cursor-not-allowed rounded-lg border border-[#E1E8F0] bg-[#F7F9FC] px-4 font-sans text-sm text-[#5A6A7E] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-40 rounded-lg bg-[#0B3272] py-3 font-sans text-sm font-bold text-white transition-colors hover:bg-[#082451] disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>

      {/* Right Column - 400px */}
      <div className="flex w-full min-w-0 flex-col gap-8 lg:w-[400px]">
        <div className="flex flex-col gap-5 rounded-2xl border border-[#E1E8F0] bg-white p-6 shadow-sm">
          <h3 className="font-sans text-base font-bold text-[#0B1F3A]">Account Status</h3>
          {user.role === "SCHOLAR" ? (
            <>
              <div className="flex items-center gap-3 rounded-xl border border-[#DCFCE7] bg-[#F0FDF4] p-4">
                <Check className="h-5 w-5 flex-shrink-0 text-[#166534]" strokeWidth={3} />
                <span className="font-sans text-sm font-bold text-[#166534]">Scholar Verified</span>
              </div>
              <p className="w-full font-sans text-[13px] leading-[1.5] text-[#5A6A7E]">
                Your account is linked to the DOST-SEI SPAS system. Primary identity details are locked to your official records.
              </p>
            </>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-[#E1E8F0] bg-[#F7F9FC] p-4">
              <span className="font-sans text-sm font-bold text-[#5A6A7E]">Standard Public Account</span>
            </div>
          )}

          <div className="flex flex-col gap-4 border-t border-[#F1F5F9] pt-4">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[13px] text-[#5A6A7E]">Member since</span>
              <span className="font-sans text-[13px] font-bold text-[#0B1F3A]">
                {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-sans text-[13px] text-[#5A6A7E]">Submissions</span>
              <span className="font-sans text-[13px] font-bold text-[#0B1F3A]">{user.submissionsCount} Papers</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ScholarCredentialsTab({ user }: { user: ProfileData }) {
  const prof = user.scholarProfile!;
  return (
    <>
      <div className="flex w-full min-w-0 flex-col gap-8 lg:w-[760px] lg:flex-shrink-0">
        <div className="flex flex-col gap-6 rounded-2xl border border-[#E1E8F0] bg-white p-8 shadow-sm">
          <div>
            <h2 className="font-sans text-lg font-bold text-[#0B1F3A]">Scholar Credentials</h2>
            <p className="font-sans text-sm text-[#5A6A7E]">Official records from the DOST-SEI SPAS system. These fields are read-only.</p>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-sans text-sm font-bold text-[#0B1F3A]">SPAS ID</label>
              <input
                type="text"
                value={prof.spasId}
                disabled
                className="h-12 w-full cursor-not-allowed rounded-lg border border-[#E1E8F0] bg-[#F7F9FC] px-4 font-sans text-sm font-medium tracking-widest text-[#0B1F3A] outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-sans text-sm font-bold text-[#0B1F3A]">Official Full Name</label>
              <input
                type="text"
                value={prof.fullName}
                disabled
                className="h-12 w-full cursor-not-allowed rounded-lg border border-[#E1E8F0] bg-[#F7F9FC] px-4 font-sans text-sm text-[#0B1F3A] outline-none"
              />
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="font-sans text-sm font-bold text-[#0B1F3A]">University</label>
                <input
                  type="text"
                  value={prof.university || "Not specified"}
                  disabled
                  className="h-12 w-full cursor-not-allowed rounded-lg border border-[#E1E8F0] bg-[#F7F9FC] px-4 font-sans text-sm text-[#0B1F3A] outline-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-sans text-sm font-bold text-[#0B1F3A]">Region</label>
                <input
                  type="text"
                  value={prof.region || "Not specified"}
                  disabled
                  className="h-12 w-full cursor-not-allowed rounded-lg border border-[#E1E8F0] bg-[#F7F9FC] px-4 font-sans text-sm text-[#0B1F3A] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <span className="w-full font-sans text-[13px] text-[#475569]">
              ℹ To update official records, please contact the DOST-SEI SEI-SPAS unit.
            </span>
          </div>
        </div>
      </div>

      <div className="flex w-full min-w-0 flex-col gap-8 lg:w-[400px]">
      </div>
    </>
  );
}

function AccountSecurityTab({ user }: { user: ProfileData }) {
  const [loading, setLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const { showToast } = useToast();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);

  async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    if (formData.get("newPassword") !== formData.get("confirmPassword")) {
      showToast("New passwords do not match.", "error");
      setLoading(false);
      return;
    }

    try {
      await updatePassword(formData);
      showToast("Password updated successfully.", "success");
      (e.target as HTMLFormElement).reset();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update password.";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleRevokeSession(sessionId: string) {
    setConfirmId(null);
    setRevokingId(sessionId);
    try {
      await revokeSessionAction(sessionId);
      showToast("Session signed out successfully.", "success");
    } catch (err) {
      setShowAlert(true);
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <>
      <div className="flex w-full min-w-0 flex-col gap-8 lg:w-[760px] lg:flex-shrink-0">
        <div className="flex flex-col gap-6 rounded-2xl border border-[#E1E8F0] bg-white p-8 shadow-sm">
          <div>
            <h2 className="font-sans text-lg font-bold text-[#0B1F3A]">Change Password</h2>
            <p className="font-sans text-sm text-[#5A6A7E]">Update your password to keep your account secure.</p>
          </div>

          <form onSubmit={handlePasswordChange} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-sans text-sm font-bold text-[#0B1F3A]">Current Password</label>
              <input
                name="currentPassword"
                type="password"
                placeholder="••••••••••••••••"
                className="h-12 w-full rounded-lg border border-[#E1E8F0] px-4 font-sans text-sm outline-none transition-colors focus:border-[#0B3272]"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-sans text-sm font-bold text-[#0B1F3A]">New Password</label>
              <input
                name="newPassword"
                type="password"
                placeholder="Enter new password"
                className="h-12 w-full rounded-lg border border-[#0B3272] px-4 font-sans text-sm outline-none transition-colors focus:border-[#0B3272]"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-sans text-sm font-bold text-[#0B1F3A]">Confirm New Password</label>
              <input
                name="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                className="h-12 w-full rounded-lg border border-[#E1E8F0] px-4 font-sans text-sm outline-none transition-colors focus:border-[#0B3272]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-44 rounded-lg bg-[#0B3272] py-3 font-sans text-sm font-bold text-white transition-colors hover:bg-[#082451] disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-6 rounded-2xl border border-[#E1E8F0] bg-white p-8 shadow-sm">
          <h2 className="font-sans text-lg font-bold text-[#0B1F3A]">Active Sessions</h2>
          <div className="flex flex-col gap-4">
            {user.sessions.map((session: ProfileData["sessions"][0], i: number) => {
              const isDesktop = session.userAgent?.toLowerCase().includes("windows") || session.userAgent?.toLowerCase().includes("mac") || session.userAgent?.toLowerCase().includes("linux");
              return (
                <div key={session.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#F7F9FC] text-[#5A6A7E]">
                        {isDesktop ? <Monitor className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
                      </div>
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="truncate font-sans text-sm font-bold text-[#0B1F3A]">
                          {session.userAgent ? (session.userAgent.split(' ')[0] + ' session') : 'Unknown Device'}
                        </span>
                        <span className={`font-sans text-xs ${session.isCurrent ? "text-[#166534]" : "text-[#64748B]"}`}>
                          {session.ipAddress || "Unknown IP"} • {session.isCurrent ? "Current session" : new Date(session.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {session.isCurrent ? (
                      <div className="rounded bg-[#DCFCE7] px-2 py-1 text-[10px] font-bold uppercase text-[#166534]">Active</div>
                    ) : (
                      <button 
                        disabled={revokingId === session.id}
                        onClick={() => setConfirmId(session.id)}
                        className="font-sans text-xs font-bold text-[#0B3272] hover:underline disabled:opacity-50"
                      >
                        {revokingId === session.id ? "Signing out..." : "Sign out"}
                      </button>
                    )}
                  </div>
                  {i < user.sessions.length - 1 && <div className="my-4 h-px w-full bg-[#F1F5F9]" />}
                </div>
              );
            })}
            {user.sessions.length === 0 && (
              <p className="text-sm text-[#5A6A7E]">No active sessions found.</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex w-full min-w-0 flex-col gap-8 lg:w-[400px]">
      </div>

      <ConfirmModal
        isOpen={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId && handleRevokeSession(confirmId)}
        title="Sign Out Session"
        message="Are you sure you want to sign out this session? You will need to log in again on that device."
        confirmLabel="Sign Out"
        type="danger"
        isLoading={!!revokingId}
      />

      <AlertDialog
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title="Error"
        message="Failed to sign out session. Please try again later."
        type="error"
      />
    </>
  );
}

function NotificationsTab() {
  const [toggles, setToggles] = useState([true, true, true, false]);

  const toggleHandler = (index: number) => {
    const newToggles = [...toggles];
    newToggles[index] = !newToggles[index];
    setToggles(newToggles);
  };

  return (
    <>
      <div className="flex w-full min-w-0 flex-col gap-8 lg:w-[760px] lg:flex-shrink-0">
        <div className="flex flex-col gap-6 rounded-2xl border border-[#E1E8F0] bg-white p-8 shadow-sm">
          <div>
            <h2 className="font-sans text-lg font-bold text-[#0B1F3A]">Email Notifications</h2>
            <p className="font-sans text-sm text-[#5A6A7E]">Select which updates you want to receive via email.</p>
          </div>

          <div className="mt-2 flex flex-col gap-5">
            {[
              "Paper Review Status Changes",
              "New Comments and Feedback",
              "Co-author Invitations",
              "Monthly Repository Newsletter"
            ].map((text, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="font-sans text-sm text-[#0B1F3A]">{text}</span>
                <button
                  onClick={() => toggleHandler(i)}
                  className={`flex h-6 w-10 items-center rounded-full p-1 transition-colors ${
                    toggles[i] ? "bg-[#0B3272]" : "bg-[#E1E8F0]"
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-white transition-transform ${
                      toggles[i] ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex w-full min-w-0 flex-col gap-8 lg:w-[400px]">
      </div>
    </>
  );
}
