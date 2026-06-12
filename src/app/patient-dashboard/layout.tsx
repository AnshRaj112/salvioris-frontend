import PatientShell from "./PatientShell";

export default function PatientDashboardLayout({ children }: { children: React.ReactNode }) {
  return <PatientShell>{children}</PatientShell>;
}
