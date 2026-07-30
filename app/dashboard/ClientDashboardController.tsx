"use client";

import { useState } from "react";
import FormGenerator from "@/lib/form-generator";
import { Terminal, Plus, Edit2, Trash2, ArrowLeft, Database, Check } from "lucide-react";

interface ClientDashboardControllerProps {
  customer: {
    id: string;
    name: string;
    jsonSchema: Record<string, any>;
    schemaVersion: number;
  };
  initialEntries: Array<{
    id: string;
    schemaVersion: number;
    data: Record<string, any>;
    updatedAt: string;
  }>;
  isCollection: boolean;
}

export default function ClientDashboardController({
  customer,
  initialEntries,
  isCollection,
}: ClientDashboardControllerProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [currentView, setCurrentView] = useState<"list" | "form">("list");

  // Keep track of which entry is being modified
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  // Custom alerts/toasts
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // If SINGLE mode, first record is the payload, else empty object
  const singleEntry = !isCollection && entries.length > 0 ? entries[0] : null;

  const handleCreateOrUpdate = async (submittedData: any) => {
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload = {
        data: submittedData,
        schemaVersion: customer.schemaVersion,
        entryId: editingEntryId || (singleEntry ? singleEntry.id : null),
      };

      const res = await fetch(`/api/dashboard/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || "Failed to persist customer data.");
      }

      // Update state locally
      if (isCollection) {
        if (editingEntryId) {
          // Edit operation
          setEntries(
            entries.map((item) =>
              item.id === editingEntryId
                ? { ...item, data: submittedData, schemaVersion: customer.schemaVersion }
                : item
            )
          );
          setSuccessMsg("Record modified successfully!");
        } else {
          // Add operation
          setEntries([
            {
              id: resData.entryId,
              schemaVersion: customer.schemaVersion,
              data: submittedData,
              updatedAt: new Date().toLocaleDateString(),
            },
            ...entries,
          ]);
          setSuccessMsg("Record created successfully!");
        }
        setCurrentView("list");
      } else {
        // Single mode
        setEntries([
          {
            id: resData.entryId,
            schemaVersion: customer.schemaVersion,
            data: submittedData,
            updatedAt: new Date().toLocaleDateString(),
          },
        ]);
        setSuccessMsg("Content changes committed successfully!");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
      // Auto-dismiss success message
      setTimeout(() => setSuccessMsg(""), 4000);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm("Are you sure you want to permanently delete this record? This action is irreversible.")) {
      return;
    }

    try {
      const res = await fetch(`/api/dashboard/content`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId }),
      });

      if (!res.ok) {
        const resData = await res.json();
        throw new Error(resData.message || "Failed to delete record.");
      }

      setEntries(entries.filter((e) => e.id !== entryId));
      setSuccessMsg("Record deleted successfully.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to complete delete request.");
    }
  };

  const startEdit = (entryId: string) => {
    setEditingEntryId(entryId);
    setCurrentView("form");
  };

  const startCreate = () => {
    setEditingEntryId(null);
    setCurrentView("form");
  };

  // Find record object currently selected for form
  const activeEditingEntry = isCollection && editingEntryId
    ? entries.find((e) => e.id === editingEntryId)
    : singleEntry;

  return (
    <div className="flex flex-col gap-6">
      {/* Dynamic Header actions depending on $mode */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-border-muted pb-4">
        <div>
          <h1 className="text-2xl font-mono font-bold text-white flex items-center gap-1.5">
            <span>$ content-manager --mode={isCollection ? "collection" : "single"}</span>
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            {isCollection
              ? "This module manages a collection of objects (e.g. multiple project items or blog post logs)."
              : "This schema dictates a single site configuration file (e.g. your master profile metadata)."}
          </p>
        </div>

        {isCollection && currentView === "list" && (
          <button
            onClick={startCreate}
            className="terminal-btn-primary py-2 px-4 text-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>$ add-record</span>
          </button>
        )}
      </div>

      {/* Message Notifications */}
      {successMsg && (
        <div className="font-mono text-xs text-accent bg-accent/10 border border-accent/20 p-3.5 rounded flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{`[success] // ${successMsg}`}</span>
        </div>
      )}

      {errorMsg && (
        <div className="font-mono text-xs text-red-500 bg-red-500/10 border border-red-500/20 p-3.5 rounded">
          {`[error] // ${errorMsg}`}
        </div>
      )}

      {/* COLLECTION LIST VIEW */}
      {isCollection && currentView === "list" && (
        <div className="terminal-border rounded overflow-hidden">
          <div className="bg-zinc-950 p-3 font-mono text-xs border-b border-border-muted grid grid-cols-12 gap-2 text-zinc-500">
            <div className="col-span-8">RECORD SUMMARY / FIELD PREVIEWS</div>
            <div className="col-span-4 text-right">ACTIONS</div>
          </div>

          {entries.length === 0 ? (
            <div className="p-12 text-center bg-black/20 flex flex-col items-center justify-center gap-2">
              <Database className="w-8 h-8 text-zinc-600" />
              <p className="font-mono text-xs text-zinc-500 italic">No records present in collection. Create your first record.</p>
            </div>
          ) : (
            <div className="divide-y divide-border-muted bg-black/10">
              {entries.map((entry) => {
                // Generate a smart preview label from the item fields
                const keys = Object.keys(entry.data || {});
                const previewText = keys
                  .slice(0, 3)
                  .map((k) => `${k}: ${typeof entry.data[k] === "object" ? "[Object]" : entry.data[k]}`)
                  .join(" | ");

                return (
                  <div key={entry.id} className="p-4 grid grid-cols-12 gap-2 text-sm items-center hover:bg-zinc-950/40">
                    <div className="col-span-8 font-mono text-xs text-zinc-300 truncate">
                      <span className="text-zinc-500 mr-2">[{entry.id.slice(-6)}]</span>
                      <span>{previewText || "{ empty payload }"}</span>
                    </div>
                    <div className="col-span-4 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => startEdit(entry.id)}
                        className="terminal-btn py-1 px-2.5 text-xs flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="p-1 px-2.5 border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded font-mono text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* COLLECTION FORM VIEW (ADD/EDIT) OR SINGLE MODE VIEW */}
      {(!isCollection || currentView === "form") && (
        <div className="flex flex-col gap-4">
          {isCollection && (
            <button
              onClick={() => setCurrentView("list")}
              className="terminal-btn text-xs py-1 px-3 self-start flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>$ back-to-list</span>
            </button>
          )}

          <div className="terminal-border p-6 bg-black/40 rounded max-w-3xl">
            <FormGenerator
              schema={customer.jsonSchema}
              initialData={activeEditingEntry ? activeEditingEntry.data : undefined}
              onSubmit={handleCreateOrUpdate}
              submitLabel={saving ? "$ committing-changes..." : "$ save-changes"}
            />
          </div>
        </div>
      )}
    </div>
  );
}
