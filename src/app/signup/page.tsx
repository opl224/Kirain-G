
import SignupForm from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <div className="container mx-auto max-w-sm py-8 px-4">
      <h1 className="text-3xl font-bold font-headline text-center mb-8">
        Gabung NotaSphere
      </h1>
      <SignupForm />
    </div>
  );
}
