import LoginPage from "@/pages/login/LoginPage";
import AuthLayout from "@/components/AuthLayout";

export default function Page(){
    return (
        <AuthLayout>
            <LoginPage />
        </AuthLayout>
    );
}