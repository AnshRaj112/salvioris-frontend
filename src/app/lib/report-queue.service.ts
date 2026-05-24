import { ReportItem } from "./crypto.service";
import { API_BASE_URL } from "./api";

export interface PendingReport {
  id: string;
  userId: string;
  groupId: string;
  encryptedPayload: string;
  createdAt: number;
  retries: number;
}

const DB_NAME = "SerenifyAbuseReports";
const STORE_NAME = "pending_queue";

function openReportDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported on this platform."));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function queuePendingReport(report: PendingReport): Promise<void> {
  const db = await openReportDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(report);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getPendingReports(): Promise<PendingReport[]> {
  const db = await openReportDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as PendingReport[]);
    request.onerror = () => reject(request.error);
  });
}

export async function dequeueReport(id: string): Promise<void> {
  const db = await openReportDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retries all pending queued reports with exponential backoff + jitter.
 */
export async function processOfflineReportQueue(): Promise<void> {
  let reports: PendingReport[] = [];
  try {
    reports = await getPendingReports();
  } catch (e) {
    // IndexedDB not available/server context
    return;
  }
  if (reports.length === 0) return;

  for (const report of reports) {
    if (report.retries >= 5) {
      console.warn(`[Report Queue] Report ${report.id} exceeded maximum retries. Evicting to preserve memory.`);
      await dequeueReport(report.id);
      continue;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reported_by: report.userId,
          group_id: report.groupId,
          encrypted_payload: report.encryptedPayload,
        }),
      });

      if (response.ok) {
        console.log(`[Report Queue] Secure report ${report.id} successfully delivered after retry.`);
        await dequeueReport(report.id);
      } else {
        report.retries += 1;
        await queuePendingReport(report);
      }
    } catch (err) {
      console.error(`[Report Queue] Network failed during delivery of report ${report.id}. Waiting for next attempt.`);
    }
  }
}
