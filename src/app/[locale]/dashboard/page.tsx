import DashboardPage from "@/_pages/dashboard/DashboardPage";
import DashboardLayout from "@/components/DashboardLayout";
import AuthGuard from "@/components/AuthGuard";

export default function Page() {
    return (
        <DashboardLayout>
            <AuthGuard>
                <DashboardPage />
            </AuthGuard>
        </DashboardLayout>
    );
}