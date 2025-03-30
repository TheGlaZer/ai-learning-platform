import SignUpPage from "@/pages/signup/SignupPage";
import AuthLayout from "@/components/AuthLayout";

export default function Page(){
    return (
        <AuthLayout>
            <SignUpPage />
        </AuthLayout>
    );
}