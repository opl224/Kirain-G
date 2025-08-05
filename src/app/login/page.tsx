
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="container mx-auto max-w-sm py-8 px-4">
      <h1 className="text-3xl font-bold font-headline text-center mb-8">
        Masuk ke NotaSphere
      </h1>
      <LoginForm />
    </div>
  );
}
