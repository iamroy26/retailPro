import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogIn, Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/components/AuthLayout';
import { safeReturnTo } from '@/lib/authReturnTo';
import { useAuth } from '@/lib/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const returnTo = safeReturnTo();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      window.location.assign(returnTo);
    } catch (submitError) {
      setError(submitError.message || 'Email or password is incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Welcome back"
      subtitle="Sign in to your Retail POS account"
      footer={<>New to Retail POS? <Link to="/register" className="font-medium text-primary hover:underline">Create an account</Link></>}
    >
      {error && <div role="alert" className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="email" type="email" autoComplete="email" autoFocus required value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 pl-10" placeholder="you@example.com" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 pl-10" />
          </div>
        </div>
        <Button type="submit" className="h-12 w-full font-medium" disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  );
}
