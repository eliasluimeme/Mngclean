"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type {
  AppointmentSettings,
  Worker,
  WorkerStatus,
} from "@/lib/appointments/types";

interface ManageWorkersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workers: Worker[];
  settings: AppointmentSettings;
  onCreateWorker: (payload: Partial<Worker> & { name: string }) => Promise<void>;
  onUpdateWorker: (id: string, payload: Partial<Worker>) => Promise<void>;
  onDeleteWorker: (id: string) => Promise<void>;
  onUpdateSettings: (payload: Partial<AppointmentSettings>) => Promise<void>;
}

function statusLabel(status: WorkerStatus): string {
  switch (status) {
    case "available":
      return "Available";
    case "on_site":
      return "On-Site";
    default:
      return "Off Duty";
  }
}

export function ManageWorkersModal({
  open,
  onOpenChange,
  workers,
  settings,
  onCreateWorker,
  onUpdateWorker,
  onDeleteWorker,
  onUpdateSettings,
}: ManageWorkersModalProps) {
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<WorkerStatus>("available");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grandWorkers, setGrandWorkers] = useState(String(settings.service_worker_requirements.grand));
  const [petitWorkers, setPetitWorkers] = useState(String(settings.service_worker_requirements.petit));
  const [slotCapacity, setSlotCapacity] = useState(String(settings.total_slot_capacity));
  const [settingsSubmitting, setSettingsSubmitting] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

  const sortedWorkers = useMemo(
    () => [...workers].sort((workerA, workerB) => workerA.name.localeCompare(workerB.name)),
    [workers],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setGrandWorkers(String(settings.service_worker_requirements.grand));
    setPetitWorkers(String(settings.service_worker_requirements.petit));
    setSlotCapacity(String(settings.total_slot_capacity));
    setSettingsError(null);
    setSettingsSuccess(null);
  }, [open, settings]);

  const resetForm = () => {
    setEditingWorkerId(null);
    setName("");
    setAvatarUrl("");
    setPhone("");
    setStatus("available");
    setIsActive(true);
    setError(null);
  };

  const startEdit = (worker: Worker) => {
    setEditingWorkerId(worker.id);
    setName(worker.name);
    setAvatarUrl(worker.avatar_url || "");
    setPhone(worker.phone || "");
    setStatus(worker.status);
    setIsActive(worker.is_active);
    setError(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Worker name is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (editingWorkerId) {
        await onUpdateWorker(editingWorkerId, {
          name: name.trim(),
          avatar_url: avatarUrl.trim() || null,
          phone: phone.trim() || null,
          status,
          is_active: isActive,
        });
      } else {
        await onCreateWorker({
          name: name.trim(),
          avatar_url: avatarUrl.trim() || null,
          phone: phone.trim() || null,
          status,
          is_active: isActive,
        });
      }

      resetForm();
    } catch (err: any) {
      setError(err?.message || "Failed to save worker.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveSettings = async () => {
    const parsedGrand = Math.floor(Number(grandWorkers));
    const parsedPetit = Math.floor(Number(petitWorkers));
    const parsedCapacity = Math.floor(Number(slotCapacity));

    if (!Number.isFinite(parsedGrand) || parsedGrand < 1) {
      setSettingsError("Grand Menage workers must be a positive number.");
      setSettingsSuccess(null);
      return;
    }

    if (!Number.isFinite(parsedPetit) || parsedPetit < 1) {
      setSettingsError("Petit Menage workers must be a positive number.");
      setSettingsSuccess(null);
      return;
    }

    if (!Number.isFinite(parsedCapacity) || parsedCapacity < 1) {
      setSettingsError("Total slot capacity must be a positive number.");
      setSettingsSuccess(null);
      return;
    }

    if (parsedCapacity < Math.max(parsedGrand, parsedPetit)) {
      setSettingsError(
        "Total slot capacity must be greater than or equal to the highest service requirement.",
      );
      setSettingsSuccess(null);
      return;
    }

    setSettingsSubmitting(true);
    setSettingsError(null);
    setSettingsSuccess(null);

    try {
      await onUpdateSettings({
        service_worker_requirements: {
          grand: parsedGrand,
          petit: parsedPetit,
        },
        total_slot_capacity: parsedCapacity,
      });
      setSettingsSuccess("Service requirements updated.");
    } catch (err: any) {
      setSettingsError(err?.message || "Failed to update requirements.");
    } finally {
      setSettingsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage Workers</DialogTitle>
          <DialogDescription>
            Add, edit, activate or deactivate workers available for appointment assignment.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-foreground">Service Assignment Rules</h3>
              <p className="text-xs text-muted-foreground">
                Configure how many workers are required per service and total workers available per slot.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="grand-workers">Grand Menage Workers</Label>
                <Input
                  id="grand-workers"
                  type="number"
                  min={1}
                  value={grandWorkers}
                  onChange={(event) => setGrandWorkers(event.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="petit-workers">Petit Menage Workers</Label>
                <Input
                  id="petit-workers"
                  type="number"
                  min={1}
                  value={petitWorkers}
                  onChange={(event) => setPetitWorkers(event.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="slot-capacity">Total Slot Capacity</Label>
                <Input
                  id="slot-capacity"
                  type="number"
                  min={1}
                  value={slotCapacity}
                  onChange={(event) => setSlotCapacity(event.target.value)}
                />
              </div>
            </div>

            {settingsError && <p className="mt-2 text-sm text-destructive">{settingsError}</p>}
            {settingsSuccess && <p className="mt-2 text-sm text-emerald-600">{settingsSuccess}</p>}

            <div className="mt-3">
              <Button type="button" onClick={handleSaveSettings} disabled={settingsSubmitting}>
                {settingsSubmitting ? "Saving rules..." : "Save Assignment Rules"}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="mb-3 grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="worker-name">Name</Label>
                <Input
                  id="worker-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Worker name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="worker-phone">Phone</Label>
                <Input
                  id="worker-phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div className="mb-3 grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="worker-avatar">Avatar URL</Label>
                <Input
                  id="worker-avatar"
                  value={avatarUrl}
                  onChange={(event) => setAvatarUrl(event.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as WorkerStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Worker status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="on_site">On-Site</SelectItem>
                    <SelectItem value="off_duty">Off Duty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border bg-background p-2">
              <div>
                <p className="text-sm font-medium">Active for assignment</p>
                <p className="text-xs text-muted-foreground">Inactive workers are hidden from assignment lists.</p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

            <div className="mt-3 flex items-center gap-2">
              <Button type="button" onClick={handleSave} disabled={submitting}>
                {submitting ? "Saving..." : editingWorkerId ? "Update Worker" : "Add Worker"}
              </Button>
              {editingWorkerId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel Edit
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {sortedWorkers.map((worker) => (
              <div
                key={worker.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{worker.name}</p>
                  <p className="text-xs text-muted-foreground">{worker.phone || "No phone"}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={worker.is_active ? "default" : "secondary"}>
                    {worker.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline">{statusLabel(worker.status)}</Badge>
                  <Switch
                    checked={worker.is_active}
                    onCheckedChange={async (checked) => {
                      await onUpdateWorker(worker.id, { is_active: checked });
                    }}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => startEdit(worker)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      const confirmed = window.confirm(`Delete ${worker.name}?`);
                      if (!confirmed) return;
                      await onDeleteWorker(worker.id);
                      if (editingWorkerId === worker.id) {
                        resetForm();
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}

            {sortedWorkers.length === 0 && (
              <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                No workers yet. Add one using the form above.
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
