import { AppLoader } from "@/components/ui/AppLoader";

export default function BlogLoading() {
  return (
    <div className="w-full min-h-[75vh] flex items-center justify-center py-[60px]">
      <AppLoader />
    </div>
  );
}
