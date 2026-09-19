'use client';
import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  ExternalLink,
  FileCheck2,
  FileText,
  Plus,
  ShieldCheck,
  Upload,
  X,
  XCircle,
} from 'lucide-react';

import { FormEvent, useState } from 'react';

import { addDocument, useDriverProfile, type DriverDocumentDto } from '@/features/drivers';
import { cn } from '@/lib/utils';

type DocumentType = 'LICENSE' | 'ID' | 'INSURANCE' | 'VEHICLE_REGISTRATION';

const documentTypes: {
  value: DocumentType;
  label: string;
  description: string;
}[] = [
  {
    value: 'LICENSE',
    label: 'Driver License',
    description: 'Your valid driving license.',
  },
  {
    value: 'ID',
    label: 'National ID',
    description: 'Government-issued identification.',
  },
  {
    value: 'INSURANCE',
    label: 'Insurance',
    description: 'Valid vehicle insurance documentation.',
  },
  {
    value: 'VEHICLE_REGISTRATION',
    label: 'Vehicle Registration',
    description: 'Vehicle registration certificate.',
  },
];

export default function DriverDocumentsPage() {
  const { driver, isLoading, error, refetch } = useDriverProfile();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [documentType, setDocumentType] = useState<DocumentType>('LICENSE');
  const [fileUrl, setFileUrl] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function resetForm() {
    setDocumentType('LICENSE');
    setFileUrl('');
    setActionError(null);
  }

  function openAddForm() {
    resetForm();
    setSuccessMessage(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    if (isSaving) return;

    setIsFormOpen(false);
    resetForm();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setActionError(null);
    setSuccessMessage(null);

    const trimmedFileUrl = fileUrl.trim();

    if (!trimmedFileUrl) {
      setActionError('Please provide the document file URL.');
      return;
    }

    try {
      new URL(trimmedFileUrl);
    } catch {
      setActionError('Please enter a valid document URL.');
      return;
    }

    setIsSaving(true);

    try {
      await addDocument({
        type: documentType,
        fileUrl: trimmedFileUrl,
      });

      await refetch();

      setIsFormOpen(false);
      resetForm();
      setSuccessMessage('Document submitted successfully. It is now pending review.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to submit the document.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <div className="h-8 w-52 animate-pulse rounded-md bg-neutral-200" />
          <div className="mt-2 h-4 w-96 animate-pulse rounded-md bg-neutral-200" />
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-24 animate-pulse rounded-xl border border-neutral-200 bg-neutral-100"
            />
          ))}
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-56 animate-pulse rounded-xl border border-neutral-200 bg-neutral-100"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !driver) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />

            <div>
              <h2 className="font-semibold text-red-900">Unable to load your documents</h2>

              <p className="mt-1 text-sm text-red-800">{error ?? 'Driver profile not found.'}</p>

              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-4 rounded-lg bg-red-800 px-4 py-2 text-sm font-semibold text-white hover:bg-red-900"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const documents = driver.documents;

  const pendingDocuments = documents.filter((document) => document.status === 'PENDING');

  const approvedDocuments = documents.filter((document) => document.status === 'APPROVED');

  const rejectedDocuments = documents.filter((document) => document.status === 'REJECTED');

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">My Documents</h2>

          <p className="mt-1 text-sm text-neutral-500">
            Submit and track the documents required for driver verification.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-900"
        >
          <Plus className="h-4 w-4" />
          Add document
        </button>
      </div>

      {successMessage && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {actionError && !isFormOpen && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Pending review" value={pendingDocuments.length} icon={Clock3} />

        <SummaryCard label="Approved" value={approvedDocuments.length} icon={CheckCircle2} />

        <SummaryCard label="Rejected" value={rejectedDocuments.length} icon={XCircle} />
      </div>

      {documents.length === 0 ? (
        <section className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
            <FileText className="h-7 w-7 text-neutral-500" />
          </div>

          <h3 className="mt-5 text-lg font-semibold text-neutral-900">No documents submitted</h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
            Submit your driver license, identification, insurance, and vehicle registration
            documents for verification.
          </p>

          <button
            type="button"
            onClick={openAddForm}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
          >
            <Upload className="h-4 w-4" />
            Submit a document
          </button>
        </section>
      ) : (
        <section>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Submitted documents</h3>

            <p className="mt-1 text-sm text-neutral-500">
              Review the current verification status of each document.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {documents.map((document) => (
              <DocumentCard key={document.id} document={document} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

          <div>
            <h3 className="font-semibold text-blue-900">Document verification</h3>

            <p className="mt-1 text-sm leading-6 text-blue-800">
              Documents are reviewed by an administrator. Make sure submitted documents are valid,
              readable, and belong to you. A document must be approved before it can satisfy the
              corresponding verification requirement.
            </p>
          </div>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Add document</h3>

                <p className="mt-0.5 text-sm text-neutral-500">
                  Submit a document for administrator review.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={isSaving}
                className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              {actionError && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="document-type"
                  className="mb-2 block text-sm font-medium text-neutral-900"
                >
                  Document type
                </label>

                <select
                  id="document-type"
                  value={documentType}
                  onChange={(event) => setDocumentType(event.target.value as DocumentType)}
                  disabled={isSaving}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                >
                  {documentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>

                <p className="mt-1.5 text-xs text-neutral-500">
                  {documentTypes.find((type) => type.value === documentType)?.description}
                </p>
              </div>

              <div>
                <label
                  htmlFor="document-url"
                  className="mb-2 block text-sm font-medium text-neutral-900"
                >
                  Document file URL
                </label>

                <input
                  id="document-url"
                  type="url"
                  value={fileUrl}
                  onChange={(event) => setFileUrl(event.target.value)}
                  placeholder="https://example.com/document.pdf"
                  disabled={isSaving}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none transition placeholder:text-neutral-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100 disabled:bg-neutral-100"
                />

                <p className="mt-1.5 text-xs leading-5 text-neutral-500">
                  Provide the URL of the uploaded document. File upload/storage can be connected
                  later if required by the platform.
                </p>
              </div>

              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex items-start gap-3">
                  <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-neutral-600" />

                  <div>
                    <p className="text-sm font-medium text-neutral-800">Before submitting</p>

                    <ul className="mt-2 space-y-1 text-xs leading-5 text-neutral-600">
                      <li>• Make sure the document is valid and readable.</li>
                      <li>• Check that the document belongs to you.</li>
                      <li>• An administrator will review your submission.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-neutral-200 pt-5">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={isSaving}
                  className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  {isSaving ? 'Submitting...' : 'Submit document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Clock3;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">{label}</p>

        <Icon className="h-5 w-5 text-neutral-500" />
      </div>

      <p className="mt-2 text-2xl font-bold text-neutral-900">{value}</p>
    </div>
  );
}

function DocumentCard({ document }: { document: DriverDocumentDto }) {
  const status = getDocumentStatus(document.status);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
          <FileText className="h-5 w-5" />
        </div>

        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
            status.className,
          )}
        >
          <status.icon className="h-3.5 w-3.5" />
          {status.label}
        </span>
      </div>

      <div className="mt-5">
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">Document</p>

        <h4 className="mt-1 text-lg font-bold text-neutral-900">
          {formatDocumentType(document.type)}
        </h4>
      </div>

      <div className="mt-5 border-t border-neutral-100 pt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-500">Submitted</span>

          <span className="font-medium text-neutral-900">{formatDate(document.createdAt)}</span>
        </div>

        {document.reviewedAt && (
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-neutral-500">Reviewed</span>

            <span className="font-medium text-neutral-900">{formatDate(document.reviewedAt)}</span>
          </div>
        )}
      </div>

      <a
        href={document.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
      >
        <ExternalLink className="h-4 w-4" />
        View document
      </a>
    </div>
  );
}

function getDocumentStatus(status: DriverDocumentDto['status']) {
  switch (status) {
    case 'APPROVED':
      return {
        label: 'Approved',
        icon: CheckCircle2,
        className: 'bg-emerald-50 text-emerald-800',
      };

    case 'REJECTED':
      return {
        label: 'Rejected',
        icon: XCircle,
        className: 'bg-red-50 text-red-800',
      };

    case 'PENDING':
    default:
      return {
        label: 'Pending',
        icon: Clock3,
        className: 'bg-amber-50 text-amber-800',
      };
  }
}

function formatDocumentType(value: string) {
  switch (value) {
    case 'LICENSE':
      return 'Driver License';

    case 'ID':
      return 'National ID';

    case 'INSURANCE':
      return 'Insurance';

    case 'VEHICLE_REGISTRATION':
      return 'Vehicle Registration';

    default:
      return value
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return date.toLocaleDateString();
}
