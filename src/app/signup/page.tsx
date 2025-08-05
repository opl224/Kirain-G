
import SignupForm from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
       <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold font-headline text-center mb-8">
          Gabung Kirain'G
        </h1>
        <SignupForm />
      </div>
    </div>
  );
}
