import CustomerLayout from "@/components/customer/CustomerLayout";

export default function Loading() {
  return (
    <CustomerLayout>
      <div className="bg-white min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <div className="h-10 bg-gray-200 rounded w-64 mx-auto mb-3 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
