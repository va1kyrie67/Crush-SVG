import { AdminLoader } from "@/components/admin/AdminLoader";

export default function AdminLoading() {
  return (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center p-8">
      <AdminLoader message="Loading admin panel..." />
    </div>
  );
}
