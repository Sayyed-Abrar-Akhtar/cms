"use client";

import { useState } from "react";
import MonacoEditor from "@monaco-editor/react";
import FormGenerator from "@/lib/form-generator";
import { Terminal, Key, Database, AlertOctagon, RefreshCw, Check, Clipboard, ShieldAlert, Code } from "lucide-react";

interface ClientCustomerConfigProps {
  customer: {
    id: string;
    name: string;
    jsonSchema: Record<string, any>;
    schemaVersion: number;
    status: string;
  };
  owner: {
    id: string;
    email: string;
  } | null;
  keys: Array<{
    id: string;
    label: string;
    status: string;
    createdAt: string;
    lastUsedAt: string;
  }>;
  dataList: Array<{
    id: string;
    schemaVersion: number;
    data: Record<string, any>;
    updatedAt: string;
  }>;
}

export default function ClientCustomerConfig({
  customer,
  owner,
  keys,
  dataList,
}: ClientCustomerConfigProps) {
  const [activeTab, setActiveTab] = useState<"schema" | "keys" | "data" | "danger">("schema");

  // Schema Tab States
  const [schemaText, setSchemaText] = useState(JSON.stringify(customer.jsonSchema, null, 2));
  const [schemaError, setSchemaError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSavingSchema, setIsSavingSchema] = useState(false);

  // Key Tab States
  const [keyLabel, setKeyLabel] = useState("");
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [keyList, setKeyList] = useState(keys);

  // Danger Zone States
  const [customerStatus, setCustomerStatus] = useState(customer.status);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Parse schema cleanly for the preview
  let parsedSchema: Record<string, any> = {};
  try {
    parsedSchema = JSON.parse(schemaText);
  } catch (e) {
    // Keep reference to previous if compilation error
    parsedSchema = customer.jsonSchema;
  }

  const handleEditorChange = (value: string | undefined) => {
    const text = value || "";
    setSchemaText(text);
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed !== "object" || parsed === null) {
        setSchemaError("Schema must be a valid JSON Object.");
        return;
      }
      if (!parsed.$mode) {
        setSchemaError("Schema must include a top-level '$mode' key ('single' or 'collection').");
        return;
      }
      if (parsed.$mode !== "single" && parsed.$mode !== "collection") {
        setSchemaError("Top-level '$mode' must be either 'single' or 'collection'.");
        return;
      }
      setSchemaError("");
    } catch (e: any) {
      setSchemaError(`JSON syntax error: ${e.message}`);
    }
  };

  const handleSaveSchema = async () => {
    if (schemaError) return;
    setIsSavingSchema(true);
    setSaveSuccess(false);

    try {
      const parsed = JSON.parse(schemaText);
      const res = await fetch(`/api/admin/customers/${customer.id}/schema`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schema: parsed }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to save schema.");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSchemaError(err.message || "Failed to persist schema.");
    } finally {
      setIsSavingSchema(false);
    }
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGeneratingKey) return;
    setIsGeneratingKey(true);
    setNewlyCreatedKey("");

    try {
      const res = await fetch(`/api/admin/customers/${customer.id}/keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: keyLabel }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to generate key.");
      }

      setNewlyCreatedKey(data.rawKey);
      setKeyLabel("");

      // Update local key list
      setKeyList([
        {
          id: data.keyId,
          label: data.label,
          status: "active",
          createdAt: new Date().toLocaleDateString(),
          lastUsedAt: "Never",
        },
        ...keyList,
      ]);
    } catch (err: any) {
      alert(err.message || "An error occurred.");
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to permanently revoke this API key? This will instantly break all external applications using it.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/customers/${customer.id}/keys`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to revoke key.");
      }

      setKeyList(
        keyList.map((k) => (k.id === keyId ? { ...k, status: "revoked" } : k))
      );
    } catch (err: any) {
      alert(err.message || "An error occurred.");
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(newlyCreatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusChange = async (newStatus: "active" | "suspended") => {
    if (!confirm(`Are you sure you want to change this customer's status to [${newStatus}]?`)) {
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/customers/${customer.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update status.");
      }

      setCustomerStatus(newStatus);
    } catch (err: any) {
      alert(err.message || "An error occurred.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-border-muted overflow-x-auto">
        <button
          onClick={() => setActiveTab("schema")}
          className={`px-4 py-2.5 font-mono text-xs border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "schema"
              ? "border-accent text-accent bg-accent/5"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>01 / SCHEMA EDITOR</span>
        </button>
        <button
          onClick={() => setActiveTab("keys")}
          className={`px-4 py-2.5 font-mono text-xs border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "keys"
              ? "border-accent text-accent bg-accent/5"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>02 / API KEYS</span>
        </button>
        <button
          onClick={() => setActiveTab("data")}
          className={`px-4 py-2.5 font-mono text-xs border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "data"
              ? "border-accent text-accent bg-accent/5"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>03 / DATA DEBUGGER</span>
        </button>
        <button
          onClick={() => setActiveTab("danger")}
          className={`px-4 py-2.5 font-mono text-xs border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "danger"
              ? "border-red-500 text-red-400 bg-red-500/5"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>04 / DANGER ZONE</span>
        </button>
      </div>

      {/* SCHEMA TAB */}
      {activeTab === "schema" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Editor Container */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <div className="flex justify-between items-center bg-zinc-950 p-3 terminal-border border-b-0 rounded-t">
              <span className="font-mono text-xs text-zinc-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-accent" />
                <span>$ schema-editor.json</span>
              </span>
              <button
                onClick={handleSaveSchema}
                disabled={!!schemaError || isSavingSchema}
                className="terminal-btn-primary py-1 px-3 text-xs flex items-center gap-1"
              >
                {isSavingSchema ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>$ save-schema</span>
                )}
              </button>
            </div>
            <div className="terminal-border overflow-hidden h-[500px] rounded-b bg-black/60">
              <MonacoEditor
                height="100%"
                defaultLanguage="json"
                theme="vs-dark"
                value={schemaText}
                onChange={handleEditorChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: "var(--font-geist-mono), JetBrains Mono, monospace",
                  scrollbar: { vertical: "visible" },
                }}
              />
            </div>
            {schemaError ? (
              <div className="font-mono text-xs text-red-500 bg-red-500/10 border border-red-500/20 p-3 rounded">
                {`[schema-error] // ${schemaError}`}
              </div>
            ) : saveSuccess ? (
              <div className="font-mono text-xs text-accent bg-accent/10 border border-accent/20 p-3 rounded flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>[schema-success] // Schema updated successfully to version {customer.schemaVersion + 1}.</span>
              </div>
            ) : null}
          </div>

          {/* Form Preview panel */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="bg-zinc-950 p-3 terminal-border rounded-t border-b-0">
              <span className="font-mono text-xs text-zinc-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-accent" />
                <span>$ client-dashboard-preview</span>
              </span>
            </div>
            <div className="terminal-border p-6 rounded-b bg-black/30 h-[500px] overflow-y-auto">
              {!schemaError ? (
                <div className="pointer-events-none opacity-80">
                  <FormGenerator
                    schema={parsedSchema}
                    onSubmit={() => {}}
                    submitLabel="$ simulated-save-data"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-2 items-center justify-center h-full text-center text-zinc-500">
                  <AlertOctagon className="w-8 h-8 text-zinc-600" />
                  <p className="font-mono text-xs">Preview unavailable due to syntax errors.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* API KEYS TAB */}
      {activeTab === "keys" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Create Key */}
          <div className="md:col-span-5 terminal-border p-6 bg-black/40 rounded flex flex-col gap-4">
            <h2 className="text-sm font-mono font-bold text-white flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-accent" />
              <span>$ generate-api-key</span>
            </h2>
            <form onSubmit={handleGenerateKey} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-xs text-zinc-400">Key Label (e.g. Production Web)</label>
                <input
                  type="text"
                  placeholder="Website Client Integration"
                  value={keyLabel}
                  onChange={(e) => setKeyLabel(e.target.value)}
                  required
                  className="terminal-input text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={isGeneratingKey}
                className="terminal-btn-primary text-xs py-2 flex items-center justify-center gap-1.5"
              >
                {isGeneratingKey ? "Generating..." : "$ create-key"}
              </button>
            </form>

            {newlyCreatedKey && (
              <div className="mt-4 font-mono text-xs bg-yellow-500/10 border border-yellow-500/20 p-3.5 rounded flex flex-col gap-2">
                <div className="text-yellow-500 font-bold flex items-center gap-1">
                  <AlertOctagon className="w-4 h-4" />
                  <span>CRITICAL SECURITY WARNING:</span>
                </div>
                <p className="text-zinc-300">
                  Copy this key immediately. It will not be shown again!
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    readOnly
                    value={newlyCreatedKey}
                    className="bg-black/80 p-2 border border-border-muted text-accent rounded w-full select-all text-xs"
                  />
                  <button
                    onClick={handleCopyKey}
                    className="p-2 border border-border-muted hover:border-accent text-zinc-400 hover:text-accent rounded"
                  >
                    {copied ? <Check className="w-4 h-4 text-accent" /> : <Clipboard className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Key List */}
          <div className="md:col-span-7 flex flex-col gap-3">
            <div className="terminal-border rounded overflow-hidden">
              <div className="bg-zinc-950 p-3 font-mono text-xs border-b border-border-muted grid grid-cols-12 gap-2 text-zinc-500">
                <div className="col-span-4">LABEL</div>
                <div className="col-span-3">CREATED</div>
                <div className="col-span-3">LAST USED</div>
                <div className="col-span-2 text-right">ACTION</div>
              </div>

              {keyList.length === 0 ? (
                <div className="p-8 text-center bg-black/20">
                  <p className="font-mono text-xs text-zinc-500 italic">No active API keys created yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-border-muted bg-black/10">
                  {keyList.map((k) => (
                    <div
                      key={k.id}
                      className="p-3 grid grid-cols-12 gap-2 text-xs items-center hover:bg-zinc-950/40"
                    >
                      <div className="col-span-4 font-mono text-white truncate flex items-center gap-1.5">
                        <span className={`live-dot ${k.status === "active" ? "active" : "revoked"}`}></span>
                        <span>{k.label}</span>
                      </div>
                      <div className="col-span-3 text-zinc-400 font-mono">{k.createdAt}</div>
                      <div className="col-span-3 text-zinc-400 font-mono truncate">{k.lastUsedAt}</div>
                      <div className="col-span-2 text-right">
                        {k.status === "active" ? (
                          <button
                            onClick={() => handleRevokeKey(k.id)}
                            className="p-1 px-2 border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded font-mono text-[10px]"
                          >
                            $ revoke
                          </button>
                        ) : (
                          <span className="text-zinc-500 font-mono text-[10px] italic">revoked</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DATA DEBUGGER TAB */}
      {activeTab === "data" && (
        <div className="flex flex-col gap-4">
          <div className="border border-border-muted rounded bg-black/40 p-4">
            <h2 className="font-mono text-sm font-bold text-white flex items-center gap-1.5">
              <Database className="w-4 h-4 text-accent" />
              <span>$ select-records --client={customer.id}</span>
            </h2>
            <p className="text-zinc-400 text-xs mt-1">
              Read-only live developer sandbox records currently active inside database collections.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {dataList.length === 0 ? (
              <div className="terminal-border p-8 rounded text-center bg-black/25">
                <p className="font-mono text-xs text-zinc-500 italic">No saved client data records exist yet.</p>
              </div>
            ) : (
              dataList.map((d) => (
                <div key={d.id} className="terminal-border rounded overflow-hidden">
                  <div className="bg-zinc-950 p-2.5 font-mono text-[11px] text-zinc-400 border-b border-border-muted flex justify-between items-center">
                    <span>ID: {d.id} (Version {d.schemaVersion})</span>
                    <span>Updated: {d.updatedAt}</span>
                  </div>
                  <pre className="p-4 overflow-x-auto text-xs font-mono text-emerald-400 bg-black/20">
                    {JSON.stringify(d.data, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* DANGER ZONE TAB */}
      {activeTab === "danger" && (
        <div className="terminal-border rounded border-red-500/30 overflow-hidden">
          <div className="bg-red-500/10 p-4 border-b border-red-500/30 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <h2 className="font-mono text-sm font-bold text-red-400">$ administrator-gated-actions</h2>
          </div>
          <div className="p-6 bg-black/20 flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-bold text-white font-mono">Status Toggle</h3>
              <p className="text-zinc-400 text-xs mt-1">
                Suspended accounts cannot login to CMS Dashboards or request external API responses.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {customerStatus === "active" ? (
                <button
                  onClick={() => handleStatusChange("suspended")}
                  disabled={isUpdatingStatus}
                  className="p-2 px-4 bg-red-500 text-black font-bold font-mono text-xs hover:bg-red-600 rounded transition-all cursor-pointer"
                >
                  $ suspend-account
                </button>
              ) : (
                <button
                  onClick={() => handleStatusChange("active")}
                  disabled={isUpdatingStatus}
                  className="p-2 px-4 bg-accent text-black font-bold font-mono text-xs hover:bg-accent-hover rounded transition-all cursor-pointer"
                >
                  $ reactivate-account
                </button>
              )}
              <span className="text-xs font-mono text-zinc-500">
                Current State: <code className="text-zinc-300 font-bold uppercase">{customerStatus}</code>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
