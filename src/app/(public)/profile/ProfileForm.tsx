"use client"

import { useState } from "react";
import { updateProfile } from "./actions";

interface ProfileFormProps {
  initialData: {
    name: string;
    university?: string;
    region?: string;
    isScholar: boolean;
  };
}

export default function ProfileForm({ initialData }: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    try {
      const result = await updateProfile(formData);
      if (result.success) {
        setIsEditing(false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update profile.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (!isEditing) {
    return (
      <div className="mt-10 rounded-xl bg-psrr-surface p-6 border border-psrr-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display text-base font-bold text-psrr-navy">Profile Settings</h3>
          <button 
            onClick={() => setIsEditing(true)}
            className="text-sm font-bold text-psrr-navy-cta hover:underline"
          >
            Edit Profile
          </button>
        </div>
        <p className="text-sm text-psrr-slate italic">Update your display name, university, and region.</p>
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-xl bg-psrr-white p-8 border border-psrr-navy-cta/30 shadow-lg">
      <h3 className="font-display text-lg font-bold text-psrr-navy mb-6">Edit Profile</h3>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-psrr-navy uppercase">Display Name</label>
          <input 
            name="name"
            type="text"
            defaultValue={initialData.name}
            className="h-11 w-full rounded-lg border border-psrr-border px-4 text-sm outline-none focus:border-psrr-navy-cta"
            required
          />
        </div>

        {initialData.isScholar && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-psrr-navy uppercase">University</label>
              <input 
                name="university"
                type="text"
                defaultValue={initialData.university}
                className="h-11 w-full rounded-lg border border-psrr-border px-4 text-sm outline-none focus:border-psrr-navy-cta"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-psrr-navy uppercase">Region</label>
              <select 
                name="region" 
                defaultValue={initialData.region}
                className="h-11 w-full rounded-lg border border-psrr-border px-4 text-sm outline-none focus:border-psrr-navy-cta"
              >
                <option value="">Select region...</option>
                <option>NCR</option>
                <option>Region I</option>
                <option>Region II</option>
                <option>Region III</option>
                <option>Region IV-A</option>
                <option>Region IV-B</option>
                <option>Region V</option>
                <option>Region VI</option>
                <option>Region VII</option>
                <option>Region VIII</option>
                <option>Region IX</option>
                <option>Region X</option>
                <option>Region XI</option>
                <option>Region XII</option>
                <option>CARAGA</option>
                <option>BARMM</option>
                <option>CAR</option>
              </select>
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm font-bold text-rose-500">{error}</p>
        )}

        <div className="flex items-center gap-4 mt-2">
          <button 
            type="submit"
            disabled={loading}
            className="rounded-lg bg-psrr-navy-cta px-6 py-2.5 text-sm font-bold text-white hover:bg-psrr-navy transition-all disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <button 
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-sm font-bold text-psrr-slate hover:text-psrr-navy"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
