"use client";

import React, { useState, useEffect } from "react";
import { Terminal, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

interface FormGeneratorProps {
  schema: Record<string, any>;
  initialData?: any;
  onSubmit: (data: any) => void;
  submitLabel?: string;
}

export default function FormGenerator({
  schema,
  initialData,
  onSubmit,
  submitLabel = "$ save-changes",
}: FormGeneratorProps) {
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Fill deep/nested values from initialData, falling back to defaults
    if (initialData) {
      setFormData(JSON.parse(JSON.stringify(initialData)));
    } else {
      setFormData(getInitialStateFromSchema(schema));
    }
  }, [initialData, schema]);

  // Helper to extract default empty structure from Schema definition
  function getInitialStateFromSchema(sch: any): any {
    if (!sch) return {};
    if (sch.type === "object") {
      const obj: any = {};
      const props = sch.properties || {};
      for (const key in props) {
        obj[key] = getInitialStateFromSchema(props[key]);
      }
      return obj;
    } else if (sch.type === "array") {
      return [];
    } else if (sch.type === "boolean") {
      return false;
    } else {
      return "";
    }
  }

  // Deep clone and set value in nested path (array/object helper)
  const setNestedValue = (obj: any, path: (string | number)[], val: any): any => {
    const newObj = JSON.parse(JSON.stringify(obj));
    let current = newObj;
    for (let i = 0; i < path.length - 1; i++) {
      const p = path[i];
      if (current[p] === undefined) {
        current[p] = typeof path[i + 1] === "number" ? [] : {};
      }
      current[p] = JSON.parse(JSON.stringify(current[p]));
      current = current[p];
    }
    const lastKey = path[path.length - 1];
    current[lastKey] = val;
    return newObj;
  };

  // Helper validation matching schema spec basics
  const validateForm = (data: any, sch: any, path: string[] = []): Record<string, string> => {
    let errs: Record<string, string> = {};
    if (!sch) return errs;

    if (sch.type === "object") {
      // Validate required properties
      const required = sch.required || [];
      const props = sch.properties || {};
      required.forEach((reqField: string) => {
        const val = data ? data[reqField] : undefined;
        if (val === undefined || val === null || val === "") {
          errs[[...path, reqField].join(".")] = `${props[reqField]?.title || reqField} is required.`;
        }
      });

      // Recurse fields
      for (const key in props) {
        const nestedErrs = validateForm(data ? data[key] : undefined, props[key], [...path, key]);
        errs = { ...errs, ...nestedErrs };
      }
    } else if (sch.type === "array") {
      if (Array.isArray(data)) {
        data.forEach((item, index) => {
          const nestedErrs = validateForm(item, sch.items, [...path, index.toString()]);
          errs = { ...errs, ...nestedErrs };
        });
      }
    } else {
      // Basic format validations
      if (data && sch.type === "string") {
        if (sch.format === "uri" && !/^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})([\/\w.-]*)*\/?$/i.test(data)) {
          errs[path.join(".")] = `${sch.title || path[path.length - 1]} must be a valid URI.`;
        }
      }
    }
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm(formData, schema);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Scroll to first error
      const firstErrKey = Object.keys(validationErrors)[0];
      const element = document.getElementById(`form-field-${firstErrKey}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else {
      setErrors({});
      onSubmit(formData);
    }
  };

  // Main Recursive Renderer Function
  const renderField = (fieldSchema: any, fieldKey: string | number, path: (string | number)[]) => {
    const fullPathStr = path.join(".");
    const errorMsg = errors[fullPathStr];
    const isRequired = schema.required?.includes(fieldKey);

    const labelTitle = fieldSchema.title || (typeof fieldKey === "string" ? fieldKey : `Item ${fieldKey}`);

    if (fieldSchema.type === "object") {
      const properties = fieldSchema.properties || {};
      return (
        <div
          key={fullPathStr}
          id={`form-field-${fullPathStr}`}
          className="terminal-border rounded p-4 mb-4 bg-zinc-950/45 flex flex-col gap-4"
        >
          <div className="font-mono text-xs text-zinc-400 border-b border-border-muted pb-1.5 flex justify-between items-center">
            <span>{`{ ${labelTitle} }`}</span>
            {isRequired && <span className="text-red-500 font-bold">*</span>}
          </div>
          <div className="flex flex-col gap-4">
            {Object.keys(properties).map((propKey) =>
              renderField(properties[propKey], propKey, [...path, propKey])
            )}
          </div>
        </div>
      );
    }

    if (fieldSchema.type === "array") {
      const items = (path.reduce((acc, p) => (acc ? acc[p] : undefined), formData) as any[]) || [];
      const itemSchema = fieldSchema.items || {};

      const handleAddItem = () => {
        const newItem = getInitialStateFromSchema(itemSchema);
        const updated = setNestedValue(formData, path, [...items, newItem]);
        setFormData(updated);
      };

      const handleRemoveItem = (index: number) => {
        const updatedItems = [...items];
        updatedItems.splice(index, 1);
        const updated = setNestedValue(formData, path, updatedItems);
        setFormData(updated);
      };

      const handleMoveItem = (index: number, direction: "up" | "down") => {
        if (direction === "up" && index === 0) return;
        if (direction === "down" && index === items.length - 1) return;

        const updatedItems = [...items];
        const swapIndex = direction === "up" ? index - 1 : index + 1;
        const temp = updatedItems[index];
        updatedItems[index] = updatedItems[swapIndex];
        updatedItems[swapIndex] = temp;

        const updated = setNestedValue(formData, path, updatedItems);
        setFormData(updated);
      };

      return (
        <div
          key={fullPathStr}
          id={`form-field-${fullPathStr}`}
          className="terminal-border rounded p-4 mb-4 bg-zinc-950/20"
        >
          <div className="font-mono text-xs text-zinc-400 border-b border-border-muted pb-2 mb-4 flex justify-between items-center">
            <span className="flex items-center gap-1">
              <Plus className="w-3.5 h-3.5 text-accent" />
              {`[ ${labelTitle} ]`}
            </span>
            <button
              type="button"
              onClick={handleAddItem}
              className="terminal-btn py-1 px-2.5 text-xs flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add item
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {items.map((_, index) => (
              <div key={index} className="flex gap-3 items-start border-l-2 border-border-muted pl-3 relative group">
                <div className="flex-1">
                  {renderField(itemSchema, index, [...path, index])}
                </div>
                <div className="flex flex-col gap-1.5 pt-6">
                  <button
                    type="button"
                    onClick={() => handleMoveItem(index, "up")}
                    disabled={index === 0}
                    className="p-1.5 border border-border-muted text-zinc-400 hover:text-accent disabled:opacity-30 rounded"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveItem(index, "down")}
                    disabled={index === items.length - 1}
                    className="p-1.5 border border-border-muted text-zinc-400 hover:text-accent disabled:opacity-30 rounded"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="p-1.5 border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 rounded"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <p className="font-mono text-xs text-zinc-500 italic">No entries created yet.</p>
            )}
          </div>
        </div>
      );
    }

    // Leaf nodes
    const value = path.reduce((acc, p) => (acc ? acc[p] : undefined), formData) ?? "";

    const handleValueChange = (val: any) => {
      const updated = setNestedValue(formData, path, val);
      setFormData(updated);
    };

    return (
      <div key={fullPathStr} id={`form-field-${fullPathStr}`} className="flex flex-col gap-1.5">
        <label className="font-mono text-xs text-zinc-400 flex items-center gap-1 justify-between">
          <span className="flex items-center gap-1">
            <Terminal className="w-3 h-3 text-accent" />
            {labelTitle}
          </span>
          {isRequired && <span className="text-red-500">*</span>}
        </label>

        {fieldSchema.type === "boolean" ? (
          <div className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleValueChange(e.target.checked)}
              className="accent-accent w-4 h-4 cursor-pointer"
            />
            <span className="font-mono text-xs text-zinc-300">Active / Enabled</span>
          </div>
        ) : fieldSchema.format === "textarea" ? (
          <textarea
            value={value}
            onChange={(e) => handleValueChange(e.target.value)}
            className="terminal-input text-sm w-full min-h-[100px] font-sans"
            placeholder={`Enter ${labelTitle}...`}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => handleValueChange(e.target.value)}
            className="terminal-input text-sm w-full font-sans"
            placeholder={`Enter ${labelTitle}...`}
          />
        )}

        {errorMsg && (
          <div className="font-mono text-[10px] text-red-500 mt-1">
            {`[!] // ${errorMsg}`}
          </div>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {schema && schema.properties ? (
        Object.keys(schema.properties).map((key) =>
          renderField(schema.properties[key], key, [key])
        )
      ) : (
        <p className="font-mono text-xs text-zinc-500 italic">No active schema properties defined.</p>
      )}

      <button type="submit" className="terminal-btn-primary w-full mt-4 py-3">
        {submitLabel}
      </button>
    </form>
  );
}
